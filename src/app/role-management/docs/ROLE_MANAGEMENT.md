# Role Management System Documentation

## Overview

This document describes the Role Management system that has been added to the Employee Management application. The system provides complete CRUD (Create, Read, Update, Delete) functionality for managing roles with permissions.

## Architecture

### Components

#### 1. **RoleManagementComponent** (`role-management.component.ts`)

- **Location**: `src/app/role-management/`
- **Purpose**: Main component for managing roles
- **Features**:
  - Display list of roles in a table
  - Create new roles
  - Edit existing roles
  - Delete roles
  - Assign/revoke permissions
  - Loading states and error handling
  - Responsive design for mobile devices

### Services

#### 1. **RoleService** (`role.service.ts`)

- **Location**: `src/app/role.service.ts`
- **Purpose**: Handles all role-related operations and API communication
- **Features**:
  - Mock API calls with configurable delay (300ms)
  - Local storage persistence
  - Observable-based reactive architecture
  - CRUD operations:
    - `createRole(roleData)` - Create new role with mock API call
    - `updateRole(id, updates)` - Update existing role
    - `deleteRole(id)` - Delete a role
    - `getRoles()` - Get all roles as observable
    - `getRoleById(id)` - Get specific role
  - Permission management:
    - `getAvailablePermissions()` - Get list of available permissions

### Data Models

```typescript
interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoleResponse {
  success: boolean;
  data?: Role | Role[];
  message: string;
}
```

### Available Permissions

The system includes 18 predefined permissions:

- `view_employees` - View employee information
- `create_employee` - Create new employees
- `edit_employee` - Edit employee details
- `delete_employee` - Delete employees
- `view_roles` - View role information
- `create_role` - Create new roles
- `edit_role` - Edit role details
- `delete_role` - Delete roles
- `view_statistics` - View system statistics
- `view_check_in_out` - View check-in/out records
- `manage_check_in_out` - Manage check-in/out operations
- `manage_inventory` - Manage inventory/stock
- `view_notifications` - View notifications
- `manage_notifications` - Manage notifications
- `export_data` - Export system data
- `import_data` - Import system data
- `system_settings` - Access system settings
- `user_management` - Manage users

### Pre-defined Roles

Three default roles are provided:

1. **Admin**
  - Full system access with all 18 permissions
  - Can manage all system features

2. **Manager**
  - Can manage employees and view statistics
  - 7 permissions assigned
  - Can manage check-in/out operations

3. **Employee**
  - Basic user with limited access
  - 3 permissions assigned
  - Can only view and manage their own check-in/out

## Data Storage

### Local Storage

The system uses browser's localStorage for data persistence:

- **Key**: `roles`
- **Format**: JSON array of Role objects
- **Persistence**: Automatic save on every CRUD operation
- **Initialization**: If no data exists, default roles are created

```typescript
// Example storage structure
localStorage.getItem('roles')
// Returns: JSON stringified array of Role objects
```

## API Integration (Mock)

### Mock Delay

All API calls simulate a 300ms network delay to mimic real API behavior:

```typescript
private
mockDelay = 300; // milliseconds
```

### Response Format

All API methods return Observable<RoleResponse>:

```typescript
{
  success: boolean,
    data ? : Role | Role[], // Provided on success
    message
:
  string       // Status message
}
```

### Example Usage

```typescript
// Create a new role
this.roleService.createRole({
  name: 'Supervisor',
  description: 'Supervises team activities',
  permissions: ['view_employees', 'manage_check_in_out']
}).subscribe(response => {
  if (response.success) {
    console.log('Role created:', response.data);
  }
});

// Update a role
this.roleService.updateRole(roleId, {
  name: 'Senior Manager',
  permissions: [...newPermissions]
}).subscribe(response => {
  if (response.success) {
    console.log('Role updated');
  }
});

// Delete a role
this.roleService.deleteRole(roleId).subscribe(response => {
  if (response.success) {
    console.log('Role deleted');
  }
});
```

## UI Features

### Role List View

- **Table Display**: Shows all roles with columns:
  - Role Name
  - Description
  - Permission Count
  - Created Date
  - Actions (Edit, Delete)

- **Features**:
  - Loading spinner during data fetch
  - Empty state message when no roles exist
  - Hover effects on table rows
  - Action buttons with tooltips

### Create/Edit Dialog

- **Modal Dialog**: Opens when creating or editing roles
- **Form Fields**:
  - Role Name (required, 3-50 characters)
  - Description (required, 10-500 characters)
  - Permission Multi-selector (at least 1 required)

- **Features**:
  - Form validation with error messages
  - Permission grid layout (2 columns on desktop)
  - Selected permission count display
  - Cancel and Save buttons
  - Loading state during submission

### Permission Selection

- **Grid Layout**: Responsive grid of permission checkboxes
- **Features**:
  - Visual feedback on selection
  - Count of selected permissions
  - Error message if no permissions selected
  - Hover effects for better UX

## Routing

### Route Configuration

The role management route has been added to the main routes:

```typescript
{
  path: 'role-management',
    component
:
  RoleManagementComponent,
    canActivate
:
  [adminGuard]  // Admin-only access
}
```

- **Access**: Admin users only (protected by `adminGuard`)
- **URL**: `/home/role-management`
- **Navigation**: Added to sidebar menu with security icon

## Styling

### SCSS Features

- **Material Design**: Follows Angular Material design patterns
- **Responsive**: Mobile-first design with media queries
- **Accessibility**: Proper contrast ratios and focus states
- **Animations**: Smooth transitions on interactions
- **Breakpoints**:
  - Desktop: Full layout
  - Tablet: Adjusted spacing
  - Mobile: Collapsed menu, optimized grid

### CSS Classes

- `.page-container` - Main page container
- `.dialog-backdrop` - Modal overlay
- `.dialog-container` - Modal content
- `.permissions-grid` - Permission checkbox grid
- `.table-container` - Table wrapper with scrolling

## Testing the Feature

### Steps to Test

1. **Navigate to Role Management**
  - Login as admin user
  - Click "Role Management" in sidebar menu

2. **View Existing Roles**
  - See the list of default roles (Admin, Manager, Employee)
  - Observe role details and permission counts

3. **Create New Role**
  - Click "Add Role" button
  - Fill in role name and description
  - Select permissions from the grid
  - Click "Create Role"
  - Verify new role appears in list

4. **Edit Role**
  - Click edit icon on any role
  - Modify name, description, or permissions
  - Click "Update Role"
  - Verify changes are saved

5. **Delete Role**
  - Click delete icon on any non-default role
  - Confirm deletion in dialog
  - Verify role is removed from list

6. **Persistence**
  - Refresh the page
  - Verify all roles and changes persist
  - Check localStorage in browser DevTools

## Integration with Employee Management

The role management can be integrated with the Employee Management component to:

- Assign roles to employees
- Filter employees by role
- Display role-based employee information
- Manage role-specific employee groups

### Future Integration Example

```typescript
// In employee.service.ts
interface Employee {
  id: number;
  fullName: string;
  roleId: number;  // Reference to Role
  // ... other properties
}
```

## Performance Considerations

1. **Local Storage**: Suitable for small to medium data (< 5MB per domain)
2. **Lazy Loading**: Roles are loaded on component initialization
3. **Unsubscribe**: Proper cleanup using `takeUntil` pattern
4. **Change Detection**: OnPush strategy can be added for optimization
5. **Mock Delay**: Can be adjusted in RoleService for testing

## Security Notes

### Current Implementation

- Uses local storage (client-side only)
- Admin guard protects the route
- Suitable for demonstration and local development

### Production Considerations

When migrating to a real backend API:

1. Replace mock methods with actual HTTP calls
2. Implement proper authentication/authorization
3. Add CSRF protection
4. Validate all inputs on server
5. Implement role-based access control (RBAC)
6. Use HTTPS for data transmission
7. Implement audit logging

## File Structure

```
src/app/
├── role.service.ts                    # Role service with mock API
├── role-management/
│   ├── role-management.component.ts   # Main component
│   ├── role-management.component.html # Template
│   └── role-management.component.scss # Styles
├── shared/
│   └── pipes/
│       └── replace.pipe.ts            # Text replacement pipe
├── home/
│   └── home.component.html            # Updated with role-management link
└── app.routes.ts                      # Updated with role-management route
```

## Dependencies

The feature uses the following Angular Material components:

- `MatCardModule` - Card container
- `MatIconModule` - Icons
- `MatButtonModule` - Buttons
- `MatTableModule` - Table
- `MatFormFieldModule` - Form fields
- `MatInputModule` - Text inputs
- `MatTooltipModule` - Tooltips
- `MatChipsModule` - Chips for permission count
- `MatCheckboxModule` - Permission checkboxes
- `MatProgressSpinnerModule` - Loading spinner

## Future Enhancements

1. **Search & Filter**: Add role search by name
2. **Sorting**: Add column sorting in the table
3. **Pagination**: Add pagination for large role lists
4. **Bulk Operations**: Select multiple roles for bulk actions
5. **Role Hierarchy**: Create role inheritance structure
6. **Audit Logs**: Track all role changes
7. **Role Analytics**: Dashboard showing role usage statistics
8. **Permission Groups**: Group related permissions
9. **Role Templates**: Quick create from templates
10. **Export/Import**: Backup and restore roles

## Troubleshooting

### Roles not persisting

- Check if localStorage is enabled in browser
- Check browser's Application tab in DevTools
- Verify localStorage key 'roles' exists

### Dialog not appearing

- Check if component imports are correct
- Verify template syntax for @if directives
- Check browser console for errors

### Permissions not saving

- Ensure at least one permission is selected
- Check form validation state
- Verify RoleService is injected correctly

## Support

For issues or questions about the role management system, refer to:

- Angular Material documentation: https://material.angular.io
- RxJS documentation: https://rxjs.dev
- Angular documentation: https://angular.io

---

**Last Updated**: 2026-01-04
**Version**: 1.0.0

