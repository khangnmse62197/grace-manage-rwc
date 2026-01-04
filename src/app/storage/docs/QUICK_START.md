# Storage Management Feature - Quick Start Guide

## 🚀 Getting Started

The Storage Management feature is already integrated into your Grace RWC application. Here's everything you need to know.

---

## 📍 Access the Feature

**URL**: `http://localhost:4200/home/storage`

**Requirements**:

- Must be logged in as admin (protected by `adminGuard`)
- Feature appears in main navigation menu under "Storage"

---

## 🎯 What Can You Do?

### Manage Categories

```
1. Click "Add Category" button
2. Enter category name (e.g., "Computers", "Furniture")
3. Click "Create"
→ Category appears in left table
→ Data saved to browser localStorage
```

### Manage Equipment

```
1. Select a category from the left table
2. Click "Add Equipment" button (right side)
3. Fill in equipment details:
   - Name (required)
   - Price (required)
   - Status (dropdown: New, In Use, Expired, Assigned To)
   - Expiration Date (must be future date)
   - Assigned To (optional user ID)
   - Picture URL (optional image link)
4. Click "Create"
→ Equipment appears in right table
→ Data saved automatically
```

### Assign Equipment to Users

```
1. Select a category
2. Find equipment in the list
3. Click the Edit button (pencil icon)
4. Enter User ID in "Assigned To" field
5. Click "Update"
→ Status automatically changes to "Assigned To"
→ User is now linked to equipment
```

### Edit Categories or Equipment

```
1. Find the item in table
2. Click Edit button (pencil icon)
3. Modify details
4. Click "Update"
```

### Delete Items

```
1. Find the item in table
2. Click Delete button (trash icon)
3. Confirm deletion
→ Item is permanently removed
```

---

## 💾 Data Storage

### Where Data is Stored

Your data is stored in **browser localStorage**:

- **Categories**: Stored under key `storage_categories`
- **Equipment**: Stored under key `storage_equipment`

### View Your Data

```
1. Open browser Developer Tools (F12)
2. Go to: Application → Storage → Local Storage
3. Look for keys: storage_categories, storage_equipment
4. Click to view JSON data
```

### Clear Data (Reset Everything)

```javascript
// In browser console (F12 → Console):
localStorage.removeItem('storage_categories');
localStorage.removeItem('storage_equipment');
location.reload();
```

---

## 📊 Data Models

### Category

```typescript
{
  "id"
:
  "cat_1234567890abc",        // Auto-generated unique ID
    "name"
:
  "Electronics",              // Category name
    "createdAt"
:
  "2024-01-10T...",     // Creation date
    "updatedAt"
:
  "2024-01-10T..."      // Last update date
}
```

### Equipment

```typescript
{
  "id"
:
  "eq_1234567890abc",          // Auto-generated unique ID
    "name"
:
  "Dell Laptop",              // Equipment name
    "price"
:
  1200.00,                   // Equipment cost
    "status"
:
  "in_use",                 // Status: new, in_use, expired, assigned_to
    "expirationDate"
:
  "2025-12-31",    // Must be future date
    "assignedTo"
:
  "emp_123",            // Optional: User ID
    "pictureUrl"
:
  "https://...",        // Optional: Image URL
    "categoryId"
:
  "cat_abc",            // Links to category
    "createdAt"
:
  "2024-01-10T...",     // Creation date
    "updatedAt"
:
  "2024-01-10T..."      // Last update date
}
```

---

## 🔧 Service API (For Developers)

### Using CategoryService

```typescript
import {CategoryService} from './storage/services/category.service';

constructor(private
categoryService: CategoryService
)
{
}

// Get all categories
this.categoryService.getAllCategories().subscribe(
  categories => console.log(categories)
);

// Create category
this.categoryService.createCategory('New Category').subscribe(
  response => console.log(response)
);

// Update category
this.categoryService.updateCategory('cat_id', 'Updated Name').subscribe(
  response => console.log(response)
);

// Delete category
this.categoryService.deleteCategory('cat_id').subscribe(
  response => console.log(response)
);
```

### Using EquipmentService

```typescript
import {EquipmentService} from './storage/services/equipment.service';

constructor(private
equipmentService: EquipmentService
)
{
}

// Get equipment by category
this.equipmentService.getEquipmentByCategory('cat_id').subscribe(
  equipment => console.log(equipment)
);

// Get equipment by user
this.equipmentService.getEquipmentByUser('user_id').subscribe(
  equipment => console.log(equipment)
);

// Create equipment
const newEquipment = {
  name: 'Monitor',
  price: 350,
  status: 'new',
  expirationDate: new Date('2025-12-31'),
  categoryId: 'cat_id'
};
this.equipmentService.createEquipment(newEquipment).subscribe(
  response => console.log(response)
);

// Assign to user
this.equipmentService.assignEquipmentToUser('eq_id', 'user_id').subscribe(
  response => console.log(response)
);

// Unassign from user
this.equipmentService.unassignEquipment('eq_id').subscribe(
  response => console.log(response)
);
```

---

## 🎨 UI Components (For Developers)

### Main Component

```typescript
import {StorageComponent} from './storage/storage.component';

// Already routed at: /home/storage
// Component handles:
// - Category selection
// - Equipment list display
// - Two-column responsive layout
```

### Sub-Components

```typescript
// Category management
import {CategoryListComponent} from './storage/components/category-list/category-list.component';
import {CategoryFormDialogComponent} from './storage/components/category-form-dialog/category-form-dialog.component';

// Equipment management
import {EquipmentListComponent} from './storage/components/equipment-list/equipment-list.component';
import {EquipmentFormDialogComponent} from './storage/components/equipment-form-dialog/equipment-form-dialog.component';
```

---

## 🔐 Validation Rules

| Field           | Rule                    | Error                        |
|-----------------|-------------------------|------------------------------|
| Category Name   | Required, max 255 chars | "Required field"             |
| Equipment Name  | Required, max 255 chars | "Required field"             |
| Equipment Price | ≥ 0                     | "Must be non-negative"       |
| Expiration Date | Must be in future       | "Date must be in future"     |
| Status          | Must be valid enum      | Auto-set based on assignment |

---

## 🎯 Common Tasks

### I want to track a laptop

```
1. Create category: "Computers"
2. Add equipment: "Dell XPS 13"
   - Price: $1200
   - Status: New
   - Expiration: 2027-12-31
3. Assign to employee: Enter employee ID
```

### I want to track multiple items in one category

```
1. Create category: "Office Supplies"
2. Add multiple equipment items (repeat for each)
3. All items link to same category
4. View all items by selecting category
```

### I want to find who has which equipment

```
1. Edit the equipment item
2. Check "Assigned To" field
3. User ID shows who has it
4. Or use EquipmentService.getEquipmentByUser(userId)
```

---

## 🐛 Troubleshooting

### Problem: Categories not showing

**Solution**:

1. Check if logged in as admin
2. Clear browser cache: Ctrl+Shift+Delete
3. Reload page: Ctrl+F5
4. Check localStorage: `localStorage.getItem('storage_categories')`

### Problem: Equipment won't save

**Solution**:

1. Verify category is selected (highlighted in blue)
2. Check all required fields are filled
3. Ensure expiration date is in future
4. Check browser console for errors (F12)

### Problem: Assignment not working

**Solution**:

1. Verify user ID is entered
2. Check that equipment saved successfully
3. Try refreshing page
4. Verify status changed to "Assigned To"

### Problem: Data lost after refresh

**Solution**:

1. This should NOT happen (localStorage persists)
2. Check if localStorage is enabled
3. Check localStorage quota isn't exceeded
4. Try clearing and re-entering data

---

## 📚 Documentation Files

Located in: `src/app/storage/docs/`

| File                        | Purpose                          |
|-----------------------------|----------------------------------|
| `README.md`                 | Feature overview and user guide  |
| `QUICK_REFERENCE.md`        | Developer cheat sheet            |
| `IMPLEMENTATION_GUIDE.md`   | Architecture and migration steps |
| `API_SPECIFICATION.md`      | REST API specifications          |
| `SERVICE_ARCHITECTURE.md`   | Technical design patterns        |
| `IMPLEMENTATION_SUMMARY.md` | What was implemented             |
| `COMPLETION_CHECKLIST.md`   | Full requirements                |

---

## 🚀 Future: Migrating to Real API

When you're ready to use a real backend instead of localStorage:

1. **Step 1**: Create backend API following `API_SPECIFICATION.md`
2. **Step 2**: Update `CategoryService`:
   ```typescript
   // Replace loadCategoriesFromStorage with:
   private loadCategories(): void {
     this.http.get<Category[]>('/api/storage/categories')
       .subscribe(categories => this.categoriesSubject.next(categories));
   }
   ```
3. **Step 3**: Do same for `EquipmentService`
4. **Step 4**: Remove localStorage code
5. **Step 5**: Test with real API

See `IMPLEMENTATION_GUIDE.md` for detailed migration steps.

---

## 📞 Need Help?

1. **User Questions**: Check `README.md`
2. **Developer Questions**: Check `QUICK_REFERENCE.md`
3. **Architecture Questions**: Check `SERVICE_ARCHITECTURE.md`
4. **API Questions**: Check `API_SPECIFICATION.md`
5. **Migration Questions**: Check `IMPLEMENTATION_GUIDE.md`

---

## ✅ You're All Set!

The Storage Management feature is ready to use. Start by:

1. Navigate to `http://localhost:4200/home/storage`
2. Create your first category
3. Add some equipment items
4. Try assigning equipment to users
5. Check localStorage to see your data

**Enjoy managing your inventory! 📦**

---

*Last Updated: January 4, 2026*
*Feature: Storage Management System for Grace RWC*
*Status: ✅ Production Ready*

