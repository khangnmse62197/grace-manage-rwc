# Storage Management - Quick Reference

## File Structure

```
src/app/storage/
├── storage.component.ts              # Main component
├── storage.component.html            # Main template
├── storage.component.scss            # Main styles
│
├── models/
│   └── storage.models.ts             # Data models & interfaces
│
├── services/
│   ├── category.service.ts           # Category CRUD logic
│   └── equipment.service.ts          # Equipment CRUD logic
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
    ├── IMPLEMENTATION_GUIDE.md       # Architecture & migration guide
    ├── API_SPECIFICATION.md          # REST API endpoints
    ├── SERVICE_ARCHITECTURE.md       # Service design patterns
    ├── QUICK_REFERENCE.md            # This file
    └── README.md                     # Feature overview
```

## Quick Commands

### Development

```bash
# Start development server
npm start

# Build project
npm run build

# Run tests
npm test

# Check linting
npm run lint
```

## Key Classes & Interfaces

### Storage Models

```typescript
enum EquipmentStatus {
  NEW = 'new',
  IN_USE = 'in_use',
  EXPIRED = 'expired',
  ASSIGNED_TO = 'assigned_to'
}

interface Category {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Equipment {
  id: string;
  name: string;
  price: number;
  status: EquipmentStatus;
  expirationDate: Date;
  assignedTo?: string;
  pictureUrl?: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Service Methods Cheat Sheet

### CategoryService

| Method                     | Returns                        | Purpose             |
|----------------------------|--------------------------------|---------------------|
| `getAllCategories()`       | `Observable<Category[]>`       | Get all categories  |
| `getCategoryById(id)`      | `Observable<Category \| null>` | Get single category |
| `createCategory(name)`     | `Observable<CategoryResponse>` | Create category     |
| `updateCategory(id, name)` | `Observable<CategoryResponse>` | Update category     |
| `deleteCategory(id)`       | `Observable<CategoryResponse>` | Delete category     |

### EquipmentService

| Method                              | Returns                         | Purpose                |
|-------------------------------------|---------------------------------|------------------------|
| `getAllEquipment()`                 | `Observable<Equipment[]>`       | Get all equipment      |
| `getEquipmentByCategory(id)`        | `Observable<Equipment[]>`       | Get category equipment |
| `getEquipmentById(id)`              | `Observable<Equipment \| null>` | Get single equipment   |
| `getEquipmentByUser(userId)`        | `Observable<Equipment[]>`       | Get user's equipment   |
| `createEquipment(data)`             | `Observable<EquipmentResponse>` | Create equipment       |
| `updateEquipment(id, updates)`      | `Observable<EquipmentResponse>` | Update equipment       |
| `deleteEquipment(id)`               | `Observable<EquipmentResponse>` | Delete equipment       |
| `assignEquipmentToUser(id, userId)` | `Observable<EquipmentResponse>` | Assign to user         |
| `unassignEquipment(id)`             | `Observable<EquipmentResponse>` | Remove assignment      |

## Component Inputs & Outputs

### CategoryListComponent

**Outputs:**

- `selectedCategoryId: string | null` - Currently selected category ID
- `categories: Category[]` - List of categories

### EquipmentListComponent

**Inputs:**

- `@Input() selectedCategoryId: string | null` - Category to display
- `@Input() categoryName: string | null` - Display name of category

## localStorage Keys

| Key                  | Contents       | Structure               |
|----------------------|----------------|-------------------------|
| `storage_categories` | All categories | JSON array of Category  |
| `storage_equipment`  | All equipment  | JSON array of Equipment |

## Common Tasks

### Clear All Data from localStorage

```typescript
localStorage.removeItem('storage_categories');
localStorage.removeItem('storage_equipment');
location.reload();
```

### Add Sample Data (for testing)

```typescript
const sampleCategories = [
  {id: 'cat_1', name: 'Computers', createdAt: new Date(), updatedAt: new Date()},
  {id: 'cat_2', name: 'Furniture', createdAt: new Date(), updatedAt: new Date()}
];
localStorage.setItem('storage_categories', JSON.stringify(sampleCategories));
location.reload();
```

### Debug Storage Data

```typescript
// In browser console
console.log(JSON.parse(localStorage.getItem('storage_categories')));
console.log(JSON.parse(localStorage.getItem('storage_equipment')));
```

## API Migration Checklist

- [ ] Create backend endpoints following API_SPECIFICATION.md
- [ ] Update CategoryService to use HttpClient
- [ ] Update EquipmentService to use HttpClient
- [ ] Remove localStorage persistence code
- [ ] Remove mock delay operators
- [ ] Remove ID generation logic
- [ ] Add proper error handling
- [ ] Add authentication interceptor
- [ ] Test all CRUD operations
- [ ] Test equipment assignment workflow
- [ ] Verify data persistence on backend
- [ ] Load test with realistic data volumes

## Troubleshooting

### Data Not Appearing

1. Check browser localStorage: `F12 → Application → Storage → Local Storage`
2. Verify JSON format in localStorage
3. Clear cache and reload: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`

### Dialog Not Opening

1. Check MatDialog import in component
2. Verify dialog component is declared as standalone
3. Check browser console for errors

### Equipment Not Showing

1. Ensure a category is selected
2. Check equipment.categoryId matches selected category
3. Verify equipment has valid expiration date

### Assignment Not Working

1. Verify User ID exists
2. Check equipment status is updated to 'assigned_to'
3. Verify assignedTo field is populated

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- Angular 18+
- Angular Material 18+
- RxJS 7+
- TypeScript 5+

## Performance Tips

1. **Limit table rows**: Implement pagination for >100 items
2. **Debounce searches**: Add search with debounce operator
3. **Lazy load images**: Use CDN for pictureUrl
4. **Optimize localStorage**: Archive old equipment records
5. **Use ChangeDetectionStrategy.OnPush** for components

## Security Considerations

1. Validate all user inputs before creating/updating
2. Sanitize image URLs
3. Implement proper authentication
4. Add role-based access control (admin only)
5. Audit all equipment assignments
6. Never store sensitive data in localStorage

## Related Files

- User authentication: `src/app/auth.guard.ts`
- Admin authorization: `src/app/admin.guard.ts`
- Shared utilities: `src/app/shared/`
- Employee service: `src/app/employee.service.ts`

