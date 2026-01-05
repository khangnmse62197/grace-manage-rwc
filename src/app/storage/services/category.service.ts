/**
 * Category Service
 * Manages category CRUD operations with localStorage persistence
 * Designed to easily replace localStorage calls with real API calls
 */

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {delay, map} from 'rxjs/operators';
import {Category, CategoryResponse} from '../models/storage.models';
import {initializeMockData} from '../mock-data/storage.mock-data';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'storage_categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    // Initialize mock data if localStorage is empty
    initializeMockData();
    this.loadCategoriesFromStorage();
  }

  /**
   * Get all categories
   * @returns Observable of categories array
   */
  getAllCategories(): Observable<Category[]> {
    return this.categoriesSubject.asObservable().pipe(
      delay(300),
      map(categories => [...categories])
    );
  }

  /**
   * Get a single category by ID
   * @param categoryId - The ID of the category to retrieve
   * @returns Observable of the category or null
   */
  getCategoryById(categoryId: string): Observable<Category | null> {
    return this.categoriesSubject.asObservable().pipe(
      delay(300),
      map(categories => categories.find(c => c.id === categoryId) || null)
    );
  }

  /**
   * Create a new category
   * @param categoryName - The name of the new category
   * @returns Observable of the created category
   */
  createCategory(categoryName: string): Observable<CategoryResponse> {
    return of(this.categoriesSubject.value).pipe(
      delay(500),
      map(categories => {
        const newCategory: Category = {
          id: this.generateId(),
          name: categoryName,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updatedCategories = [...categories, newCategory];
        this.persistToStorage(updatedCategories);
        this.categoriesSubject.next(updatedCategories);

        return {
          success: true,
          data: newCategory,
          message: 'Category created successfully'
        };
      })
    );
  }

  /**
   * Update an existing category
   * @param categoryId - The ID of the category to update
   * @param categoryName - The new name for the category
   * @returns Observable of the updated category
   */
  updateCategory(categoryId: string, categoryName: string): Observable<CategoryResponse> {
    return of(this.categoriesSubject.value).pipe(
      delay(500),
      map(categories => {
        const index = categories.findIndex(c => c.id === categoryId);

        if (index === -1) {
          return {
            success: false,
            message: 'Category not found'
          };
        }

        const updatedCategory: Category = {
          ...categories[index],
          name: categoryName,
          updatedAt: new Date()
        };

        const updatedCategories = [
          ...categories.slice(0, index),
          updatedCategory,
          ...categories.slice(index + 1)
        ];

        this.persistToStorage(updatedCategories);
        this.categoriesSubject.next(updatedCategories);

        return {
          success: true,
          data: updatedCategory,
          message: 'Category updated successfully'
        };
      })
    );
  }

  /**
   * Delete a category
   * @param categoryId - The ID of the category to delete
   * @returns Observable of the response
   */
  deleteCategory(categoryId: string): Observable<CategoryResponse> {
    return of(this.categoriesSubject.value).pipe(
      delay(500),
      map(categories => {
        const filteredCategories = categories.filter(c => c.id !== categoryId);

        if (filteredCategories.length === categories.length) {
          return {
            success: false,
            message: 'Category not found'
          };
        }

        this.persistToStorage(filteredCategories);
        this.categoriesSubject.next(filteredCategories);

        return {
          success: true,
          message: 'Category deleted successfully'
        };
      })
    );
  }

  /**
   * Load all categories from localStorage
   * Replace this with API call: this.http.get('/api/categories')
   */
  private loadCategoriesFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const categories: Category[] = data ? JSON.parse(data) : [];
      this.categoriesSubject.next(categories);
    } catch (error) {
      console.error('Error loading categories from storage:', error);
      this.categoriesSubject.next([]);
    }
  }

  /**
   * Persist categories to localStorage
   * Replace this with API call: this.http.post('/api/categories/sync', data)
   * @param categories - The categories to persist
   */
  private persistToStorage(categories: Category[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error persisting categories to storage:', error);
    }
  }

  /**
   * Generate a unique ID
   * Replace this with server-generated ID in real API
   * @returns A unique string ID
   */
  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

