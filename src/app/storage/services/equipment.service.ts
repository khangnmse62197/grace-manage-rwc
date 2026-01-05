/**
 * Equipment Service
 * Manages equipment CRUD operations with localStorage persistence
 * Designed to easily replace localStorage calls with real API calls
 */

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {delay, map} from 'rxjs/operators';
import {Equipment, EquipmentResponse, EquipmentStatus} from '../models/storage.models';
import {initializeMockData} from '../mock-data/storage.mock-data';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private readonly STORAGE_KEY = 'storage_equipment';
  private equipmentSubject = new BehaviorSubject<Equipment[]>([]);
  public equipment$ = this.equipmentSubject.asObservable();

  constructor() {
    // Initialize mock data if localStorage is empty
    initializeMockData();
    this.loadEquipmentFromStorage();
  }

  /**
   * Get all equipment
   * @returns Observable of equipment array
   */
  getAllEquipment(): Observable<Equipment[]> {
    return this.equipmentSubject.asObservable().pipe(
      delay(300),
      map(equipment => [...equipment])
    );
  }

  /**
   * Get equipment by category
   * @param categoryId - The ID of the category
   * @returns Observable of equipment in that category
   */
  getEquipmentByCategory(categoryId: string): Observable<Equipment[]> {
    return this.equipmentSubject.asObservable().pipe(
      delay(300),
      map(equipment => equipment.filter(e => e.categoryId === categoryId))
    );
  }

  /**
   * Get a single equipment by ID
   * @param equipmentId - The ID of the equipment to retrieve
   * @returns Observable of the equipment or null
   */
  getEquipmentById(equipmentId: string): Observable<Equipment | null> {
    return this.equipmentSubject.asObservable().pipe(
      delay(300),
      map(equipment => equipment.find(e => e.id === equipmentId) || null)
    );
  }

  /**
   * Create new equipment
   * @param equipment - The equipment data to create
   * @returns Observable of the created equipment
   */
  createEquipment(equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Observable<EquipmentResponse> {
    return of(this.equipmentSubject.value).pipe(
      delay(500),
      map(allEquipment => {
        // Validate expiration date
        const expirationDate = new Date(equipment.expirationDate);
        if (expirationDate <= new Date()) {
          return {
            success: false,
            message: 'Expiration date must be in the future'
          };
        }

        const newEquipment: Equipment = {
          ...equipment,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updatedEquipment = [...allEquipment, newEquipment];
        this.persistToStorage(updatedEquipment);
        this.equipmentSubject.next(updatedEquipment);

        return {
          success: true,
          data: newEquipment,
          message: 'Equipment created successfully'
        };
      })
    );
  }

  /**
   * Update existing equipment
   * @param equipmentId - The ID of the equipment to update
   * @param updates - The fields to update
   * @returns Observable of the updated equipment
   */
  updateEquipment(equipmentId: string, updates: Partial<Equipment>): Observable<EquipmentResponse> {
    return of(this.equipmentSubject.value).pipe(
      delay(500),
      map(allEquipment => {
        const index = allEquipment.findIndex(e => e.id === equipmentId);

        if (index === -1) {
          return {
            success: false,
            message: 'Equipment not found'
          };
        }

        // Validate expiration date if provided
        if (updates.expirationDate && new Date(updates.expirationDate) <= new Date()) {
          return {
            success: false,
            message: 'Expiration date must be in the future'
          };
        }

        const updatedEquipmentItem: Equipment = {
          ...allEquipment[index],
          ...updates,
          id: allEquipment[index].id, // Prevent ID override
          categoryId: allEquipment[index].categoryId, // Prevent category change
          updatedAt: new Date()
        };

        const updatedEquipment = [
          ...allEquipment.slice(0, index),
          updatedEquipmentItem,
          ...allEquipment.slice(index + 1)
        ];

        this.persistToStorage(updatedEquipment);
        this.equipmentSubject.next(updatedEquipment);

        return {
          success: true,
          data: updatedEquipmentItem,
          message: 'Equipment updated successfully'
        };
      })
    );
  }

  /**
   * Delete equipment
   * @param equipmentId - The ID of the equipment to delete
   * @returns Observable of the response
   */
  deleteEquipment(equipmentId: string): Observable<EquipmentResponse> {
    return of(this.equipmentSubject.value).pipe(
      delay(500),
      map(allEquipment => {
        const filteredEquipment = allEquipment.filter(e => e.id !== equipmentId);

        if (filteredEquipment.length === allEquipment.length) {
          return {
            success: false,
            message: 'Equipment not found'
          };
        }

        this.persistToStorage(filteredEquipment);
        this.equipmentSubject.next(filteredEquipment);

        return {
          success: true,
          message: 'Equipment deleted successfully'
        };
      })
    );
  }

  /**
   * Assign equipment to a user
   * @param equipmentId - The ID of the equipment to assign
   * @param userId - The ID of the user to assign to
   * @returns Observable of the updated equipment
   */
  assignEquipmentToUser(equipmentId: string, userId: string): Observable<EquipmentResponse> {
    return this.updateEquipment(equipmentId, {
      assignedTo: userId,
      status: EquipmentStatus.ASSIGNED_TO
    });
  }

  /**
   * Unassign equipment from user
   * @param equipmentId - The ID of the equipment to unassign
   * @returns Observable of the updated equipment
   */
  unassignEquipment(equipmentId: string): Observable<EquipmentResponse> {
    return this.updateEquipment(equipmentId, {
      assignedTo: undefined,
      status: EquipmentStatus.IN_USE
    });
  }

  /**
   * Get equipment assigned to a user
   * @param userId - The ID of the user
   * @returns Observable of equipment assigned to the user
   */
  getEquipmentByUser(userId: string): Observable<Equipment[]> {
    return this.equipmentSubject.asObservable().pipe(
      delay(300),
      map(equipment => equipment.filter(e => e.assignedTo === userId))
    );
  }

  /**
   * Load all equipment from localStorage
   * Replace this with API call: this.http.get('/api/equipment')
   */
  private loadEquipmentFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const equipment: Equipment[] = data ? JSON.parse(data, this.dateReviver) : [];
      this.equipmentSubject.next(equipment);
    } catch (error) {
      console.error('Error loading equipment from storage:', error);
      this.equipmentSubject.next([]);
    }
  }

  /**
   * Persist equipment to localStorage
   * Replace this with API call: this.http.post('/api/equipment/sync', data)
   * @param equipment - The equipment to persist
   */
  private persistToStorage(equipment: Equipment[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(equipment));
    } catch (error) {
      console.error('Error persisting equipment to storage:', error);
    }
  }

  /**
   * Generate a unique ID
   * Replace this with server-generated ID in real API
   * @returns A unique string ID
   */
  private generateId(): string {
    return `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Custom reviver for JSON.parse to convert date strings to Date objects
   * @param key - The key of the property
   * @param value - The value of the property
   * @returns The parsed value
   */
  private dateReviver = (key: string, value: any): any => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  };
}

