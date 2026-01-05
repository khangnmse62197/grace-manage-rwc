/**
 * Data Models for Storage Management System
 * Defines interfaces for Categories and Equipment
 */

export enum EquipmentStatus {
  NEW = 'new',
  IN_USE = 'in_use',
  EXPIRED = 'expired',
  ASSIGNED_TO = 'assigned_to'
}

export interface Category {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  status: EquipmentStatus;
  expirationDate: Date;
  assignedTo?: string; // User ID
  pictureUrl?: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category;
  message?: string;
}

export interface EquipmentResponse {
  success: boolean;
  data?: Equipment;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data?: Category[];
  message?: string;
}

export interface EquipmentsResponse {
  success: boolean;
  data?: Equipment[];
  message?: string;
}

