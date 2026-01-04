# Storage Management - Service Architecture

## Overview

This document describes the architectural patterns, design principles, and data flow within the Storage Management system services.

## Design Patterns Used

### 1. BehaviorSubject Pattern

Both services use RxJS `BehaviorSubject` to manage application state:

```typescript
private
categoriesSubject = new BehaviorSubject<Category[]>([]);
public
categories$ = this.categoriesSubject.asObservable();
```

**Benefits:**

- Single source of truth for data
- Reactive updates throughout application
- Easy to subscribe to changes
- Automatic unsubscription with `async` pipe in templates

### 2. Observable Pattern

All public methods return Observables:

```typescript
getAllCategories()
:
Observable < Category[] > {
  return this.categoriesSubject.asObservable().pipe(
    delay(300),
    map(categories => [...categories])
  );
}
```

**Benefits:**

- Composable asynchronous operations
- Can chain multiple operations with `pipe`
- Lazy evaluation
- Better memory management with unsubscription

### 3. Separation of Concerns

Services handle only:

- Data retrieval and persistence
- CRUD operations
- State management

Components handle:

- UI rendering
- User interaction
- Service orchestration

### 4. Dependency Injection

Services are provided at root level:

```typescript
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // ...
}
```

**Benefits:**

- Single instance shared across application
- Easy testing with mock services
- No circular dependencies
- Automatic cleanup

## Data Flow Architecture

### Write Flow (Create/Update/Delete)

```
User Action
    ↓
Component
    ↓
Service.method()
    ↓
Update BehaviorSubject
    ↓
Persist to localStorage
    ↓
Return Observable with response
    ↓
Component receives response
    ↓
Update UI (table refresh)
```

### Read Flow (Get)

```
Component.ngOnInit()
    ↓
Service.method() called
    ↓
Query BehaviorSubject
    ↓
Apply operators (delay, map, filter)
    ↓
Return Observable
    ↓
Component subscribes
    ↓
Render UI with data
```

## localStorage as Database

### Persistence Strategy

Data is stored in localStorage with simple JSON serialization:

```typescript
private persistToStorage(data: T[]): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
}

private loadFromStorage(): T[] {
  const data = localStorage.getItem(this.STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
```

### Schema

**storage_categories**

```json
[
  {
    "id": "cat_unique_id",
    "name": "Category Name",
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
]
```

**storage_equipment**

```json
[
  {
    "id": "eq_unique_id",
    "name": "Equipment Name",
    "price": 1200.00,
    "status": "in_use",
    "expirationDate": "2025-12-31T23:59:59.000Z",
    "assignedTo": "user_id",
    "pictureUrl": "https://...",
    "categoryId": "cat_unique_id",
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
]
```

### Limitations & Workarounds

| Limitation            | Workaround                                |
|-----------------------|-------------------------------------------|
| 5-10 MB storage limit | Implement pagination, archive old records |
| No transactions       | Implement optimistic locking              |
| No indexing           | Keep data volume reasonable               |
| No relationships      | Enforce referential integrity in code     |
| Synchronous API       | Add mock delay() for realistic behavior   |

## Mock API Simulation

### Delay Operator

Services add artificial delays to simulate network latency:

```typescript
return this.categoriesSubject.asObservable().pipe(
  delay(300),  // Simulate 300ms network request
  map(categories => [...categories])
);
```

**Realistic delays:**

- GET: 300ms
- POST/PUT: 500ms
- DELETE: 500ms

### Migration Path

To replace with real API:

1. **Remove delay operator:**

```typescript
// Before
.pipe(delay(300), map(...))

// After
// No delay needed with real HTTP
```

2. **Replace with HttpClient:**

```typescript
// Before
return this.categoriesSubject.asObservable();

// After
return this.http.get<Category[]>('/api/categories');
```

3. **Handle server-generated IDs:**

```typescript
// Before
id: this.generateId(),

// After
  id
:
response.id,  // From server
```

## State Management Strategy

### Single BehaviorSubject Pattern

Each service maintains ONE source of truth:

```typescript
private categoriesSubject = new BehaviorSubject<Category[]>([]);

// All reads come from this subject
getAllCategories() { return this.categoriesSubject.asObservable(); }

// All writes update this subject
createCategory(name) {
  // ... create logic
  this.categoriesSubject.next(updatedArray);
}
```

**Advantages:**

- Easy to debug (single place to inspect state)
- Consistent across application
- Simple to test
- No race conditions

**Disadvantages:**

- Replaces entire array on each change
- No granular updates
- Large datasets may cause performance issues

### Future Enhancement: NgRx

For complex state management, consider NgRx:

```typescript
// Instead of BehaviorSubject
store.dispatch(new LoadCategories());
store.select(selectCategories).subscribe(categories => {
});
```

## Error Handling Pattern

### Service Level

```typescript
private loadCategoriesFromStorage(): void {
  try {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const categories = data ? JSON.parse(data) : [];
    this.categoriesSubject.next(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    this.categoriesSubject.next([]);
  }
}
```

### Component Level

```typescript
this.categoryService.getAllCategories().subscribe({
  next: (categories) => {
    this.categories = categories;
  },
  error: (error) => {
    console.error('Error:', error);
    this.snackBar.open('Error loading categories', 'Close');
  }
});
```

### Response Wrapper

Operations return response objects for error handling:

```typescript
interface CategoryResponse {
  success: boolean;
  data?: Category;
  message?: string;
}
```

## Validation Pattern

### Input Validation

Services validate data before operations:

```typescript
createEquipment(equipment
:
Omit<Equipment, 'id'>
):
Observable < EquipmentResponse > {
  return of(this.equipmentSubject.value).pipe(
    delay(500),
    map(allEquipment => {
      // Validate expiration date
      if (new Date(equipment.expirationDate) <= new Date()) {
        return {
          success: false,
          message: 'Expiration date must be in the future'
        };
      }
      // ... continue with creation
    })
  );
}
```

### Business Logic Rules

1. **Expiration dates** must be in the future
2. **Equipment IDs** are globally unique
3. **Category names** should be unique (enforced by UI)
4. **Prices** must be non-negative
5. **Status** must be one of the defined enum values

## Concurrency Considerations

### Current Implementation

Services assume single-user operation. localStorage is synchronous, so:

- No race conditions within single browser tab
- Multiple tabs/windows can cause conflicts
- No optimistic locking

### Future Enhancements

For multi-user scenarios:

```typescript
// Implement conflict resolution
if (equipmentSubject.value.updatedAt >
  receivedEquipment.updatedAt) {
  // Local version is newer, reject server update
  return;
}
```

## Performance Considerations

### Current Limitations

| Issue               | Impact              | Solution                    |
|---------------------|---------------------|-----------------------------|
| Full array updates  | O(n) time           | Implement pagination        |
| JSON serialization  | Memory usage        | Limit data in localStorage  |
| No indexing         | O(n) searches       | Implement in-memory indexes |
| Synchronous storage | Blocking operations | Add Web Workers             |

### Optimization Strategies

1. **Pagination:**

```typescript
getEquipmentByCategory(categoryId
:
string, page
:
number = 1
):
Observable < Equipment[] > {
  const pageSize = 20;
  return this.equipmentSubject.asObservable().pipe(
    map(equipment => equipment
      .filter(e => e.categoryId === categoryId)
      .slice((page - 1) * pageSize, page * pageSize)
    )
  );
}
```

2. **Memoization:**

```typescript
private
categoryCache = new Map<string, Category>();

getCategoryById(id
:
string
):
Observable < Category | null > {
  if(this.categoryCache.has(id)
)
{
  return of(this.categoryCache.get(id) || null);
}
// ... fetch and cache
}
```

3. **Lazy Loading:**

```typescript
loadCategoriesLazy()
:
Observable < Category[] > {
  return this.categoriesSubject.asObservable().pipe(
    skipWhile(categories => categories.length === 0),
    take(1)
  );
}
```

## Testing Strategy

### Service Testing

```typescript
describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
  });

  it('should create category', (done) => {
    service.createCategory('Test').subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data?.name).toBe('Test');
      done();
    });
  });
});
```

### Component Testing

```typescript
describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

  beforeEach(() => {
    mockCategoryService = jasmine.createSpyObj('CategoryService', [
      'getAllCategories'
    ]);
    TestBed.configureTestingModule({
      providers: [
        {provide: CategoryService, useValue: mockCategoryService}
      ]
    });
    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
  });

  it('should display categories', () => {
    mockCategoryService.getAllCategories.and.returnValue(
      of([{id: '1', name: 'Test'}])
    );
    fixture.detectChanges();
    expect(component.categories.length).toBe(1);
  });
});
```

## Security Considerations

1. **localStorage is NOT secure:**

- Vulnerable to XSS attacks
- No encryption by default
- Accessible by JavaScript

2. **Recommendations:**

- Never store sensitive data
- Sanitize user inputs
- Use authentication for API calls
- Implement HTTPS

3. **Future:** Replace localStorage with secure backend storage

## Conclusion

The Service Architecture uses proven Angular patterns (BehaviorSubject, RxJS Observables, Dependency Injection) combined with localStorage for mock persistence. This design allows easy migration to a real REST API while maintaining clean, testable code.

Key points:

- Single source of truth per service
- Reactive updates via Observables
- Error handling at both service and component levels
- Easy to test with mock services
- Ready for API migration with minimal changes

