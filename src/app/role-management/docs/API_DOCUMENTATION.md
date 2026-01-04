# Role Management API Documentation

## Overview

The Role Service provides a complete REST-like API interface for managing roles and permissions. All operations use observables and return structured responses with success indicators.

## Base URL

```
Mock API with 300ms simulated latency
Backed by Browser LocalStorage
```

## Data Types

### Role Object

```typescript
{
  id: number,                    // Unique identifier (auto-generated)
  name: string,                  // Role name (3-50 characters)
  description: string,           // Role description (10-500 characters)
  permissions: string[],         // Array of permission identifiers
  createdAt: Date,               // ISO 8601 timestamp
  updatedAt: Date                // ISO 8601 timestamp
}
```

### Response Object

```typescript
{
  success: boolean,              // Indicates operation success
  data?: Role | Role[],          // Response data (if applicable)
  message: string                // Status message or error description
}
```

## Endpoints

### 1. Get All Roles

#### Observable Stream (Reactive)

```typescript
getRoles(): Observable<Role[]>
```

**Description**: Returns an observable that emits the latest roles array and re-emits whenever roles change.

**Returns**: Observable<Role[]>

**Example**:

```typescript
roleService.getRoles().subscribe(roles => {
  console.log('Current roles:', roles);
});
```

**Response**:

```json
[
  {
    "id": 1,
    "name": "Admin",
    "description": "Full system access with all permissions",
    "permissions": ["view_employees", "create_employee", ...],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  },
  ...
]
```

#### One-Time Fetch

```typescript
getRolesOnce(): Observable<Role[]>
```

**Description**: Fetches roles once with simulated API delay (300ms).

**Returns**: Observable<Role[]>

**Example**:

```typescript
roleService.getRolesOnce().subscribe(roles => {
  this.roles = roles;
});
```

---

### 2. Get Role by ID

```typescript
getRoleById(id: number): Observable<Role | null>
```

**Description**: Retrieves a specific role by its ID.

**Parameters**:

- `id` (number): The role ID to fetch

**Returns**: Observable<Role | null> - Returns the role or null if not found

**Example**:

```typescript
roleService.getRoleById(1).subscribe(role => {
  if (role) {
    console.log('Found role:', role.name);
  } else {
    console.log('Role not found');
  }
});
```

**Response (Success)**:

```json
{
  "id": 1,
  "name": "Admin",
  "description": "Full system access",
  "permissions": [...],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

**Response (Not Found)**:

```
null
```

---

### 3. Create Role

```typescript
createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Observable<RoleResponse>
```

**Description**: Creates a new role with the provided data.

**Parameters**:

- `roleData` (object):
  - `name` (string, required): 3-50 characters
  - `description` (string, required): 10-500 characters
  - `permissions` (string[], required): Array of permission identifiers, minimum 1

**Returns**: Observable<RoleResponse>

**Example**:

```typescript
const newRole = {
  name: 'Manager',
  description: 'Manages employees and monitors operations',
  permissions: ['view_employees', 'edit_employee', 'manage_check_in_out']
};

roleService.createRole(newRole).subscribe(response => {
  if (response.success) {
    console.log('Created:', response.data);
  } else {
    console.log('Error:', response.message);
  }
});
```

**Request Body**:

```json
{
  "name": "Manager",
  "description": "Manages employees and monitors operations",
  "permissions": ["view_employees", "edit_employee", "manage_check_in_out"]
}
```

**Response (Success)**:

```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Manager",
    "description": "Manages employees and monitors operations",
    "permissions": ["view_employees", "edit_employee", "manage_check_in_out"],
    "createdAt": "2026-01-04T10:30:00Z",
    "updatedAt": "2026-01-04T10:30:00Z"
  },
  "message": "Role 'Manager' created successfully"
}
```

---

### 4. Update Role

```typescript
updateRole(id: number, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Observable<RoleResponse>
```

**Description**: Updates an existing role with partial data.

**Parameters**:

- `id` (number): The role ID to update
- `updates` (object): Partial role object with fields to update:
  - `name?` (string): Updated role name
  - `description?` (string): Updated description
  - `permissions?` (string[]): Updated permissions array

**Returns**: Observable<RoleResponse>

**Example**:

```typescript
const updates = {
  name: 'Senior Manager',
  permissions: ['view_employees', 'edit_employee', 'delete_employee', 'manage_check_in_out']
};

roleService.updateRole(4, updates).subscribe(response => {
  if (response.success) {
    console.log('Updated:', response.data);
  }
});
```

**Request Body**:

```json
{
  "name": "Senior Manager",
  "permissions": ["view_employees", "edit_employee", "delete_employee", "manage_check_in_out"]
}
```

**Response (Success)**:

```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Senior Manager",
    "description": "Manages employees and monitors operations",
    "permissions": ["view_employees", "edit_employee", "delete_employee", "manage_check_in_out"],
    "createdAt": "2026-01-04T10:30:00Z",
    "updatedAt": "2026-01-04T10:35:00Z"
  },
  "message": "Role 'Senior Manager' updated successfully"
}
```

**Response (Not Found)**:

```json
{
  "success": false,
  "message": "Role with ID 999 not found"
}
```

---

### 5. Delete Role

```typescript
deleteRole(id
:
number
):
Observable<RoleResponse>
```

**Description**: Deletes a role by its ID.

**Parameters**:

- `id` (number): The role ID to delete

**Returns**: Observable<RoleResponse>

**Example**:

```typescript
roleService.deleteRole(4).subscribe(response => {
  if (response.success) {
    console.log('Deleted:', response.message);
  }
});
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Role 'Manager' deleted successfully"
}
```

**Response (Not Found)**:

```json
{
  "success": false,
  "message": "Role with ID 999 not found"
}
```

---

### 6. Get Available Permissions

```typescript
getAvailablePermissions(): Observable<string[]>
```

**Description**: Returns list of all available permissions in the system.

**Returns**: Observable<string[]>

**Example**:

```typescript
roleService.getAvailablePermissions().subscribe(permissions => {
  this.availablePermissions = permissions;
});
```

**Response**:

```json
[
  "view_employees",
  "create_employee",
  "edit_employee",
  "delete_employee",
  "view_roles",
  "create_role",
  "edit_role",
  "delete_role",
  "view_statistics",
  "view_check_in_out",
  "manage_check_in_out",
  "manage_inventory",
  "view_notifications",
  "manage_notifications",
  "export_data",
  "import_data",
  "system_settings",
  "user_management"
]
```

---

## Available Permissions Reference

| Permission             | Description                 | Category            |
|------------------------|-----------------------------|---------------------|
| `view_employees`       | View employee information   | Employee Management |
| `create_employee`      | Create new employees        | Employee Management |
| `edit_employee`        | Modify employee details     | Employee Management |
| `delete_employee`      | Remove employees            | Employee Management |
| `view_roles`           | View role information       | Role Management     |
| `create_role`          | Create new roles            | Role Management     |
| `edit_role`            | Modify role details         | Role Management     |
| `delete_role`          | Remove roles                | Role Management     |
| `view_statistics`      | Access statistics dashboard | Analytics           |
| `view_check_in_out`    | View check-in/out records   | Attendance          |
| `manage_check_in_out`  | Process check-in/out        | Attendance          |
| `manage_inventory`     | Manage stock/inventory      | Inventory           |
| `view_notifications`   | View system notifications   | Notifications       |
| `manage_notifications` | Send/edit notifications     | Notifications       |
| `export_data`          | Export system data          | Data Management     |
| `import_data`          | Import system data          | Data Management     |
| `system_settings`      | Access system settings      | Administration      |
| `user_management`      | Manage user accounts        | Administration      |

---

## Default Roles

### Admin

```json
{
  "id": 1,
  "name": "Admin",
  "description": "Full system access with all permissions",
  "permissions": [
    "view_employees", "create_employee", "edit_employee", "delete_employee",
    "view_roles", "create_role", "edit_role", "delete_role",
    "view_statistics",
    "view_check_in_out", "manage_check_in_out",
    "manage_inventory",
    "view_notifications", "manage_notifications",
    "export_data", "import_data",
    "system_settings", "user_management"
  ]
}
```

### Manager

```json
{
  "id": 2,
  "name": "Manager",
  "description": "Can manage employees and view statistics",
  "permissions": [
    "view_employees", "create_employee", "edit_employee",
    "view_statistics",
    "view_check_in_out", "manage_check_in_out",
    "view_notifications"
  ]
}
```

### Employee

```json
{
  "id": 3,
  "name": "Employee",
  "description": "Basic user with limited access",
  "permissions": [
    "view_check_in_out", "manage_check_in_out",
    "view_notifications"
  ]
}
```

---

## Error Handling

### Success Response

All successful operations return a response with `success: true`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

Failed operations return `success: false`:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Observable Error Handling

```typescript
roleService.createRole(newRole).subscribe({
  next: (response) => {
    if (response.success) {
      // Handle success
    } else {
      // Handle business logic error
      console.log('Error:', response.message);
    }
  },
  error: (error) => {
    // Handle network/subscription error
    console.log('Network error:', error);
  }
});
```

---

## Request/Response Examples

### Example 1: Complete CRUD Flow

```typescript
// 1. Create a role
const newRole = {
  name: 'Supervisor',
  description: 'Supervises team activities',
  permissions: ['view_employees', 'edit_employee']
};

roleService.createRole(newRole).subscribe(createRes => {
  if (createRes.success && createRes.data && 'id' in createRes.data) {
    const roleId = (createRes.data as Role).id;

    // 2. Retrieve the role
    roleService.getRoleById(roleId).subscribe(role => {
      console.log('Created role:', role);

      // 3. Update the role
      roleService.updateRole(roleId, {
        description: 'Updated supervises team activities and monitor attendance'
      }).subscribe(updateRes => {
        if (updateRes.success) {
          // 4. Delete the role
          roleService.deleteRole(roleId).subscribe(deleteRes => {
            console.log('Deleted:', deleteRes.message);
          });
        }
      });
    });
  }
});
```

### Example 2: Batch Operations

```typescript
// Get all roles and get available permissions simultaneously
Promise.all([
  roleService.getRolesOnce().toPromise(),
  roleService.getAvailablePermissions().toPromise()
]).then(([roles, permissions]) => {
  console.log('Total roles:', roles?.length);
  console.log('Available permissions:', permissions?.length);
});
```

### Example 3: Reactive Updates

```typescript
// Subscribe to role changes
roleService.roles$.subscribe(roles => {
  console.log('Roles updated:', roles.length);
  // Update UI here
});

// Create a new role - subscription will automatically emit updated list
roleService.createRole({
  name: 'New Role',
  description: 'Automatically triggers roles$ update',
  permissions: ['view_employees']
}).subscribe();
```

---

## API Specifications

### Request/Response Timing

- **Simulated API Delay**: 300ms (configurable via `mockDelay` property)
- **Suitable for**: Development, testing, prototyping
- **Production**: Replace with actual HTTP calls using HttpClient

### Data Validation (Component-level)

- **Role Name**: Required, 3-50 characters
- **Description**: Required, 10-500 characters
- **Permissions**: Required, minimum 1 permission

### Data Persistence

- **Storage**: Browser localStorage
- **Key**: `'roles'`
- **Format**: JSON array
- **Limit**: ~5MB per domain (varies by browser)

### Observable Behavior

- **Subjects**: BehaviorSubject for reactive updates
- **Unsubscription**: Use `takeUntil` pattern to prevent memory leaks
- **Change Detection**: OnPush strategy compatible

---

## Integration Examples

### In a Component with Form

```typescript
export class RoleFormComponent {
  roleForm: FormGroup;

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      permissions: [[], [Validators.required]]
    });
  }

  submitForm() {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      this.roleService.createRole({
        name: formValue.name,
        description: formValue.description,
        permissions: formValue.permissions
      }).subscribe(response => {
        if (response.success) {
          // Handle success
        }
      });
    }
  }
}
```

### In a Service Layer

```typescript
export class RoleManagerService {
  constructor(private roleService: RoleService) {
  }

  createOrUpdateRole(roleId: number | null, roleData: any) {
    if (roleId) {
      return this.roleService.updateRole(roleId, roleData);
    } else {
      return this.roleService.createRole(roleData);
    }
  }
}
```

---

## Changelog

### Version 1.0.0 (2026-01-04)

- Initial release with CRUD operations
- Mock API with 300ms latency
- LocalStorage persistence
- 18 predefined permissions
- 3 default roles (Admin, Manager, Employee)
- Observable-based architecture
- Form validation support

---

## Support & Documentation

- **Angular Material**: https://material.angular.io
- **RxJS**: https://rxjs.dev
- **Angular**: https://angular.io

---

**Last Updated**: 2026-01-04  
**API Version**: 1.0.0  
**Status**: Production Ready

