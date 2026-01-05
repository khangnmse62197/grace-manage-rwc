/**
 * Mock Data for Storage Management System
 * Contains sample categories and equipment for development and testing
 */

import {Category, Equipment, EquipmentStatus} from '../models/storage.models';

/**
 * Mock Categories Data
 * - Light: Contains 2 equipment (Fuji, Xiaomi)
 * - Speaker: Contains 1 equipment (Sony)
 */
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_light_001',
    name: 'Light',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: 'cat_speaker_001',
    name: 'Speaker',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  }
];

/**
 * Mock Equipment Data
 * Organized by category with various statuses and prices
 */
export const MOCK_EQUIPMENT: Equipment[] = [
  // Light Category Equipment
  {
    id: 'eq_light_fuji_001',
    name: 'Fuji LED Light',
    price: 1500,
    status: EquipmentStatus.IN_USE,
    expirationDate: new Date('2027-12-31'),
    assignedTo: 'emp_001',
    pictureUrl: '/assets/images/fuji-light.jpg',
    categoryId: 'cat_light_001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: 'eq_light_xiaomi_001',
    name: 'Xiaomi Smart Light',
    price: 1200,
    status: EquipmentStatus.NEW,
    expirationDate: new Date('2028-06-30'),
    pictureUrl: '/assets/images/xiaomi-light.jpg',
    categoryId: 'cat_light_001',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  },
  // Speaker Category Equipment
  {
    id: 'eq_speaker_sony_001',
    name: 'Sony Wireless Speaker',
    price: 3500,
    status: EquipmentStatus.IN_USE,
    expirationDate: new Date('2027-03-15'),
    assignedTo: 'emp_002',
    pictureUrl: '/assets/images/sony-speaker.jpg',
    categoryId: 'cat_speaker_001',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  }
];

/**
 * Initialize mock data to localStorage
 * Call this function in app initialization to seed mock data if storage is empty
 */
export function initializeMockData(): void {
  const CATEGORIES_KEY = 'storage_categories';
  const EQUIPMENT_KEY = 'storage_equipment';

  // Only initialize if storage is empty
  const existingCategories = localStorage.getItem(CATEGORIES_KEY);
  const existingEquipment = localStorage.getItem(EQUIPMENT_KEY);

  if (!existingCategories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(MOCK_CATEGORIES));
  }

  if (!existingEquipment) {
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(MOCK_EQUIPMENT));
  }
}

/**
 * Clear all mock data from localStorage
 * Useful for resetting the application state during testing
 */
export function clearMockData(): void {
  localStorage.removeItem('storage_categories');
  localStorage.removeItem('storage_equipment');
}

/**
 * Reset mock data - clears and reinitializes
 * Useful for starting fresh during testing
 */
export function resetMockData(): void {
  clearMockData();
  initializeMockData();
}

