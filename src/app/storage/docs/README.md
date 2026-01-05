# Storage Management Feature

## Overview

The Storage Management module provides a comprehensive inventory management system for the Grace RWC application. Admins can create and manage equipment categories, add equipment items with detailed information, and assign equipment to users.

## Features

### Category Management

- ✅ Create new equipment categories
- ✅ Edit category names
- ✅ Delete categories
- ✅ View all categories in an organized list
- ✅ Select category to view associated equipment

### Equipment Management

- ✅ Add equipment items to categories
- ✅ Track equipment details:
  - Name and price
  - Status (New, In Use, Expired, Assigned)
  - Expiration date
  - Picture URL
  - Assignment to users
- ✅ Edit equipment information
- ✅ Delete equipment
- ✅ Assign equipment to team members
- ✅ Unassign equipment from users

### User Experience

- ✅ Two-column responsive layout
- ✅ Material Design UI with icons
- ✅ Modal dialogs for create/edit operations
- ✅ Confirmation dialogs for deletions
- ✅ Real-time notifications (snackbar messages)
- ✅ Status color-coding for equipment
- ✅ Responsive design for mobile, tablet, and desktop

## Technical Stack

- **Framework**: Angular 18+
- **UI Library**: Angular Material
- **State Management**: RxJS BehaviorSubject
- **Persistence**: localStorage (mock) → REST API (future)
- **Language**: TypeScript 5+

## File Structure

```
src/app/storage/
├── storage.component.ts                    # Main container
├── storage.component.html                  # Main template
├── storage.component.scss                  # Main styles
│
├── models/
│   └── storage.models.ts                  # Data models
│
├── services/
│   ├── category.service.ts                # Category CRUD
│   └── equipment.service.ts               # Equipment CRUD
│
├── components/
│   ├── category-list/
│   │   └── category-list.component.ts
│   ├── category-form-dialog/
│   │   └── category-form-dialog.component.ts
│   ├── equipment-list/
│   │   └── equipment-list.component.ts
│   └── equipment-form-dialog/
│       └── equipment-form-dialog.component.ts
│
└── docs/
    ├── README.md                          # This file
    ├── IMPLEMENTATION_GUIDE.md            # Architecture guide
    ├── API_SPECIFICATION.md               # REST API endpoints
    ├── SERVICE_ARCHITECTURE.md            # Design patterns
    └── QUICK_REFERENCE.md                 # Quick reference
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- Angular CLI 18+

### Installation

1. The Storage module is already integrated into the Grace RWC application.

2. Ensure Angular Material is installed:

```bash
npm install @angular/material @angular/cdk
```

3. Import required Material modules in your component (already done in this implementation).

### Verify Installation

Navigate to `http://localhost:4200/home/storage` (admin only) to access the Storage Management page.

## Usage Guide

### Creating a Category

1. Click the **"Add Category"** button in the Categories section
2. Enter the category name (e.g., "Computers", "Furniture")
3. Click **"Create"**
4. New category appears in the list and is automatically saved

### Adding Equipment to a Category

1. Select a category from the left panel
2. Click **"Add Equipment"** button in the Equipment section
3. Fill in equipment details:

- **Name**: Equipment name (required)
- **Price**: Equipment cost (required)
- **Status**: New, In Use, Expired, or Assigned To
- **Expiration Date**: Must be in the future (required)
- **Assigned To**: User ID (optional)
- **Picture URL**: Link to equipment image (optional)

4. Click **"Create"**

### Assigning Equipment to a User

1. Select a category and find the equipment in the list
2. Click **Edit** on the equipment
3. Enter the User ID in "Assigned To" field
4. Status automatically changes to "Assigned To"
5. Click **"Update"**

### Editing Equipment

1. Click **Edit** button on any equipment row
2. Modify the desired fields
3. Click **"Update"**
4. Changes are saved immediately

### Deleting Equipment or Categories

1. Click **Delete** button (trash icon)
2. Confirm the deletion
3. Item is removed immediately

## Data Models

### Category

```typescript
interface Category {
  id: string;              // Unique identifier
  name: string;            // Category name
  createdAt?: Date;        // Creation timestamp
  updatedAt?: Date;        // Last update timestamp
}
```

### Equipment

```typescript
interface Equipment {
  id: string;              // Unique identifier
  name: string;            // Equipment name
  price: number;           // Equipment cost
  status: EquipmentStatus; // new | in_use | expired | assigned_to
  expirationDate: Date;    // Must be in the future
  assignedTo?: string;     // User ID (optional)
  pictureUrl?: string;     // Image URL (optional)
  categoryId: string;      // Associated category ID
  createdAt?: Date;        // Creation timestamp
  updatedAt?: Date;        // Last update timestamp
}

enum EquipmentStatus {
  NEW = 'new',
  IN_USE = 'in_use',
  EXPIRED = 'expired',
  ASSIGNED_TO = 'assigned_to'
}
```

## Service API

### CategoryService

```typescript
// Get all categories
getAllCategories()
:
Observable<Category[]>

// Get single category
getCategoryById(categoryId
:
string
):
Observable<Category | null>

// Create new category
createCategory(categoryName
:
string
):
Observable<CategoryResponse>

// Update category
updateCategory(categoryId
:
string, categoryName
:
string
):
Observable<CategoryResponse>

// Delete category
deleteCategory(categoryId
:
string
):
Observable<CategoryResponse>
```

### EquipmentService

```typescript
// Get all equipment
getAllEquipment()
:
Observable<Equipment[]>

// Get equipment by category
getEquipmentByCategory(categoryId
:
string
):
Observable<Equipment[]>

// Get single equipment
getEquipmentById(equipmentId
:
string
):
Observable<Equipment | null>

// Get equipment assigned to user
getEquipmentByUser(userId
:
string
):
Observable<Equipment[]>

// Create equipment
createEquipment(equipment
:
Equipment
):
Observable<EquipmentResponse>

// Update equipment
updateEquipment(equipmentId
:
string, updates
:
Partial<Equipment>
):
Observable<EquipmentResponse>

// Delete equipment
deleteEquipment(equipmentId
:
string
):
Observable<EquipmentResponse>

// Assign equipment to user
assignEquipmentToUser(equipmentId
:
string, userId
:
string
):
Observable<EquipmentResponse>

// Unassign equipment
unassignEquipment(equipmentId
:
string
):
Observable<EquipmentResponse>
```

## Data Persistence

### Current Implementation (Development)

Data is stored in browser localStorage using JSON serialization:

- **storage_categories**: Stores all categories
- **storage_equipment**: Stores all equipment items

**View in browser:**

1. Open Developer Tools (F12)
2. Go to Application → Storage → Local Storage
3. Look for keys: `storage_categories`, `storage_equipment`

### Clear Data

To clear all data and start fresh:

```javascript
// In browser console (F12)
localStorage.removeItem('storage_categories');
localStorage.removeItem('storage_equipment');
location.reload();
```

### Production Implementation

Will use REST API endpoints. See `API_SPECIFICATION.md` for complete endpoint documentation.

## Responsive Design

### Desktop (1024px+)

- Two-column layout
- Categories on left (30%)
- Equipment on right (70%)

### Tablet (768px - 1024px)

- Stacked layout
- Categories at top (40%)
- Equipment below (60%)

### Mobile (< 768px)

- Single column
- Scrollable categories
- Equipment below
- Optimized button sizes

## Validation Rules

- **Category Names**: Must be unique, max 255 characters
- **Equipment Names**: Required, max 255 characters
- **Prices**: Must be non-negative
- **Expiration Dates**: Must be in the future
- **Status**: Must be one of defined enum values
- **User IDs**: Free-form text (validated against Employee service in future)

## Error Handling

All operations include error handling:

1. **Network Errors** (future): Displayed via snackbar
2. **Validation Errors**: Alert messages with specific field errors
3. **Business Logic Errors**: Descriptive error messages
4. **Storage Errors**: Logged to console, graceful degradation

## Performance

### Current Limitations

- localStorage limit: 5-10 MB
- No indexing or searching
- Full array refresh on updates

### Optimization Strategies

- Implement pagination for large datasets
- Add filtering/search functionality
- Cache frequently accessed items
- Archive old equipment records

See `SERVICE_ARCHITECTURE.md` for detailed performance considerations.

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Color contrast meets WCAG standards
- ✅ Semantic HTML structure
- ✅ Clear focus indicators

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Problem: No categories showing

**Solution:**

1. Check localStorage: `localStorage.getItem('storage_categories')`
2. Clear cache: Ctrl+Shift+Delete
3. Reload page: Ctrl+F5

### Problem: Equipment list empty after selecting category

**Solution:**

1. Verify category was actually selected (highlighted in blue)
2. Check equipment exists for this category
3. Open browser DevTools and check for errors

### Problem: Equipment assignment not working

**Solution:**

1. Ensure User ID is valid
2. Check that equipment status changed to "assigned_to"
3. Try refreshing the page

### Problem: Dates showing incorrectly

**Solution:**

1. Ensure browser date format is correct
2. Check system date/time settings
3. Use ISO 8601 format in localStorage

## Future Enhancements

- [ ] Real REST API integration
- [ ] File upload for equipment images
- [ ] Advanced filtering and search
- [ ] Bulk import/export (CSV)
- [ ] Equipment maintenance tracking
- [ ] Depreciation calculations
- [ ] Audit logging
- [ ] Multi-location support
- [ ] Barcode/QR code scanning
- [ ] Mobile app integration

## Migration Guide

To migrate from localStorage to REST API:

1. See `IMPLEMENTATION_GUIDE.md` section "Migration to Real API"
2. Update service methods to use HttpClient
3. Remove localStorage persistence
4. Update error handling for HTTP errors
5. Add authentication interceptor
6. Test all CRUD operations

## Support & Documentation

- **API Spec**: See `API_SPECIFICATION.md`
- **Architecture**: See `SERVICE_ARCHITECTURE.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Implementation**: See `IMPLEMENTATION_GUIDE.md`

## License

This feature is part of the Grace RWC application.

## Contributors

- Feature designed and implemented following Angular best practices
- Material Design for consistent UI
- RxJS patterns for reactive programming

