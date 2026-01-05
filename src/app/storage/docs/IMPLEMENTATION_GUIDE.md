# Storage Management - Implementation Guide

## Overview

The Storage Management system is a modular implementation designed to manage equipment inventory organized by categories. It uses Angular Material for UI components and localStorage for temporary data persistence, with a clean architecture that allows easy migration to a real REST API.

## Architecture

### Service Layer

The system uses two main services:

#### 1. CategoryService (`src/app/storage/services/category.service.ts`)

- **Responsibility**: Manage categories (create, read, update, delete)
- **State Management**: BehaviorSubject-based state with localStorage persistence
- **Key Methods**:
  - `getAllCategories()` - Get all categories
  - `createCategory(name: string)` - Create new category
  - `updateCategory(id: string, name: string)` - Update category
  - `deleteCategory(id: string)` - Delete category

#### 2. EquipmentService (`src/app/storage/services/equipment.service.ts`)

- **Responsibility**: Manage equipment items and assignments
- **State Management**: BehaviorSubject-based state with localStorage persistence
- **Key Methods**:
  - `getEquipmentByCategory(categoryId: string)` - Get equipment in a category
  - `createEquipment(equipment: Equipment)` - Create new equipment
  - `updateEquipment(id: string, updates: Partial<Equipment>)` - Update equipment
  - `deleteEquipment(id: string)` - Delete equipment
  - `assignEquipmentToUser(id: string, userId: string)` - Assign to user
  - `unassignEquipment(id: string)` - Remove assignment

### Component Structure

```
storage/
├── storage.component.ts          # Main container component
├── components/
│   ├── category-list/           # List categories
│   │   └── category-list.component.ts
│   ├── category-form-dialog/    # Create/edit category dialog
│   │   └── category-form-dialog.component.ts
│   ├── equipment-list/          # List equipment
│   │   └── equipment-list.component.ts
│   └── equipment-form-dialog/   # Create/edit equipment dialog
│       └── equipment-form-dialog.component.ts
├── services/
│   ├── category.service.ts
│   └── equipment.service.ts
├── models/
│   └── storage.models.ts        # TypeScript interfaces and enums
└── docs/                         # Documentation
```

### Data Models

**Category**

```typescript
interface Category {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Equipment**

```typescript
interface Equipment {
  id: string;
  name: string;
  price: number;
  status: EquipmentStatus;  // 'new' | 'in_use' | 'expired' | 'assigned_to'
  expirationDate: Date;
  assignedTo?: string;       // User ID
  pictureUrl?: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## localStorage Keys

- `storage_categories` - Stores all categories
- `storage_equipment` - Stores all equipment items

Data is serialized as JSON strings and deserialized on application load.

## Component Communication

```
StorageComponent (Main Container)
├── CategoryListComponent
│   ├── Emits selected category ID via public property
│   └── Uses CategoryFormDialogComponent for CRUD
└── EquipmentListComponent
    ├── Receives selectedCategoryId as @Input
    └── Uses EquipmentFormDialogComponent for CRUD
```

## User Workflows

### 1. Add New Category

1. User clicks "Add Category" button in CategoryListComponent
2. CategoryFormDialogComponent opens
3. User enters category name and clicks Create
4. CategoryService.createCategory() is called
5. New category is persisted to localStorage
6. CategoryListComponent refreshes with new data

### 2. Add Equipment to Category

1. User selects a category from the list
2. User clicks "Add Equipment" button in EquipmentListComponent
3. EquipmentFormDialogComponent opens with form for equipment details
4. User fills in: name, price, status, expiration date, assigned user (optional), picture URL
5. User clicks Create
6. EquipmentService.createEquipment() is called
7. Equipment is associated with selected category
8. EquipmentListComponent refreshes with new equipment

### 3. Assign Equipment to User

1. User clicks Edit on an equipment item
2. EquipmentFormDialogComponent opens with pre-filled data
3. User enters a User ID in "Assigned To" field
4. User clicks Update
5. EquipmentService.updateEquipment() updates the equipment
6. Status is automatically changed to 'assigned_to'
7. EquipmentListComponent displays updated information

## Migration to Real API

### Step 1: Update CategoryService

Replace `persistToStorage()` and `loadCategoriesFromStorage()` methods:

```typescript
// Before (localStorage)
private
loadCategoriesFromStorage()
:
void {
  const data = localStorage.getItem(this.STORAGE_KEY);
  const categories = data ? JSON.parse(data) : [];
  this.categoriesSubject.next(categories);
}

// After (HTTP API)
private
loadCategoriesFromStorage()
:
void {
  this.http.get<Category[]>('/api/categories').subscribe(
    categories => this.categoriesSubject.next(categories)
  );
}
```

### Step 2: Update EquipmentService

Replace localStorage calls with HTTP requests:

```typescript
// Before (localStorage)
private
persistToStorage(equipment
:
Equipment[]
):
void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(equipment));
}

// After (HTTP API)
private
persistToStorage(equipment
:
Equipment[]
):
void {
  // Sync to server instead
}
```

### Step 3: Remove Mock Delays

Remove `.pipe(delay(...))` operators from observable methods:

```typescript
// Before
getAllCategories()
:
Observable < Category[] > {
  return this.categoriesSubject.asObservable().pipe(
    delay(300),
    map(categories => [...categories])
  );
}

// After
getAllCategories()
:
Observable < Category[] > {
  return this.http.get<Category[]>('/api/categories');
}
```

### Step 4: Remove ID Generation

Replace `generateId()` with server-provided IDs:

```typescript
// Before
id: this.generateId(),

// After
// ID is provided by server in response
  id
:
response.id,
```

## Error Handling

Both services and components include error handling:

1. **Service Level**: Methods catch errors and log to console
2. **Component Level**: Error responses are displayed via MatSnackBar notifications
3. **Validation**: Expiration dates are validated to ensure they're in the future

## Testing

Services can be tested by:

1. Mocking localStorage calls
2. Testing observable streams
3. Verifying state updates after CRUD operations

Components can be tested by:

1. Mocking services
2. Testing dialog interactions
3. Verifying data display

## Future Enhancements

1. **Real-time sync**: WebSocket integration for multi-user updates
2. **File uploads**: Support for image uploads instead of URLs only
3. **Advanced filtering**: Filter equipment by status, user, price range
4. **Bulk operations**: Bulk edit/delete for multiple items
5. **Reports**: Generate reports on equipment status and assignments
6. **Audit logging**: Track all changes to categories and equipment

