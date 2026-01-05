# Role Management Quick Start Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Usage Examples](#usage-examples)
5. [File Structure](#file-structure)
6. [Testing](#testing)

## Overview

The Role Management system allows administrators to:

- **Create** new roles with custom permissions
- **Read** and view all roles and their details
- **Update** existing roles and their permissions
- **Delete** roles from the system
- **Assign** permissions to roles from a predefined list of 18 permissions

### Key Features

✅ Complete CRUD operations  
✅ Mock API with 300ms latency simulation  
✅ Local storage persistence  
✅ Responsive Material Design UI  
✅ Form validation  
✅ Permission management  
✅ Admin-only access control

## Quick Start

### 1. Navigate to Role Management

After logging in as an admin user:

1. Click on the **"Grace Team"** menu (top-left)
2. Select **"Role Management"** from the admin menu
3. You'll see a list of existing roles

### 2. View Existing Roles

The Role List displays:

- **Role Name** - Name of the role
- **Description** - What the role does
- **Permissions** - Number of permissions assigned
- **Created Date** - When the role was created
- **Actions** - Edit or Delete buttons

### 3. Create a New Role

**Step 1: Click "Add Role"**

```
Button location: Top-right of the role management card
```

**Step 2: Fill in the form**

```
Role Name: [Enter 3-50 characters]
Description: [Enter 10-500 characters]
```

**Step 3: Select Permissions**

```
Check the permissions you want to assign:
- view_employees
- create_employee
- edit_employee
- delete_employee
- view_roles
- create_role
- edit_role
- delete_role
- view_statistics
- view_check_in_out
- manage_check_in_out
- manage_inventory
- view_notifications
- manage_notifications
- export_data
- import_data
- system_settings
- user_management
```

**Step 4: Click "Create Role"**

```
The new role will appear in the list immediately
```

### 4. Edit a Role

**Step 1: Click the edit icon (pencil) on the role**

```
Location: In the Actions column
```

**Step 2: Modify the details**

```
- Change the role name
- Update the description
- Add/remove permissions
```

**Step 3: Click "Update Role"**

```
Changes are saved immediately
```

### 5. Delete a Role

**Step 1: Click the delete icon (trash) on the role**

```
Location: In the Actions column (next to edit button)
```

**Step 2: Confirm deletion**

```
A confirmation dialog will appear
Click "OK" to confirm or "Cancel" to abort
```

## Features

### Role Management Features

| Feature                   | Description                                  |
|---------------------------|----------------------------------------------|
| **Create Role**           | Add new roles with custom permissions        |
| **Edit Role**             | Modify existing role details and permissions |
| **Delete Role**           | Remove roles from the system                 |
| **View Roles**            | See all roles in a detailed table            |
| **Permission Assignment** | Select from 18 available permissions         |
| **Form Validation**       | Validates all inputs before saving           |
| **Responsive Design**     | Works on desktop, tablet, and mobile         |
| **Loading States**        | Visual feedback during operations            |
| **Error Handling**        | Clear error messages for issues              |

### UI Components

1. **Role List Table**
  - Sortable columns (if needed)
  - Hover effects
  - Action buttons
  - No data message when empty

2. **Add/Edit Dialog**
  - Modal overlay
  - Form fields with validation
  - Permission selector grid
  - Submit and cancel buttons

3. **Permission Grid**
  - Multi-column layout
  - Checkboxes for selection
  - Count of selected permissions
  - Validation message if none selected

## Usage Examples

### Example 1: Create a Manager Role

```
1. Click "Add Role"
2. Enter Name: "Manager"
3. Enter Description: "Can manage employees and check-in/out records"
4. Select permissions:
   ✓ view_employees
   ✓ create_employee
   ✓ edit_employee
   ✓ view_check_in_out
   ✓ manage_check_in_out
5. Click "Create Role"
```

### Example 2: Create a Read-Only Viewer Role

```
1. Click "Add Role"
2. Enter Name: "Viewer"
3. Enter Description: "Can only view data without making changes"
4. Select permissions:
   ✓ view_employees
   ✓ view_statistics
   ✓ view_check_in_out
   ✓ view_notifications
5. Click "Create Role"
```

### Example 3: Create an HR Manager Role

```
1. Click "Add Role"
2. Enter Name: "HR Manager"
3. Enter Description: "Manages employee records and check-in/out operations"
4. Select permissions:
   ✓ view_employees
   ✓ create_employee
   ✓ edit_employee
   ✓ delete_employee
   ✓ view_check_in_out
   ✓ manage_check_in_out
   ✓ export_data
   ✓ import_data
5. Click "Create Role"
```

## File Structure

```
src/app/
├── role.service.ts                      # Service with CRUD logic
├── role.service.spec.ts                 # Unit tests
├── role-management/
│   ├── role-management.component.ts     # Main component
│   ├── role-management.component.html   # Template
│   ├── role-management.component.scss   # Styles
│   └── role-management.demo.ts          # Usage examples
├── shared/pipes/
│   └── replace.pipe.ts                  # Text transformation pipe
└── app.routes.ts                        # Route configuration (updated)

Documentation/
├── ROLE_MANAGEMENT.md                   # Detailed documentation
├── API_DOCUMENTATION.md                 # API reference
└── QUICK_START.md                       # This file
```

## Testing

### Manual Testing Checklist

#### Create Role

- [ ] Click "Add Role" button
- [ ] Form appears with empty fields
- [ ] Can type role name
- [ ] Can type description
- [ ] Can select permissions
- [ ] Cannot submit without selecting permissions
- [ ] Cannot submit with invalid data
- [ ] Role appears in list after creation
- [ ] Data persists after page refresh

#### Edit Role

- [ ] Click edit button on existing role
- [ ] Form fills with role data
- [ ] Can modify name and description
- [ ] Can change permissions
- [ ] Changes save successfully
- [ ] Updated data appears in list
- [ ] Data persists after page refresh

#### Delete Role

- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Role removed from list after confirmation
- [ ] Deletion persists after page refresh

#### Data Persistence

- [ ] Create a role
- [ ] Refresh the page (F5)
- [ ] Role still appears in list
- [ ] Open browser DevTools
- [ ] Check Application > Local Storage
- [ ] Find 'roles' key
- [ ] Data is valid JSON
- [ ] All created roles are in storage

#### Responsive Design

- [ ] Desktop: Full layout works
- [ ] Tablet: Table is readable
- [ ] Mobile: Dialog is usable
- [ ] Menu collapses on mobile
- [ ] Buttons are clickable on mobile

#### Form Validation

- [ ] Empty name shows error
- [ ] Name too short (< 3 chars) shows error
- [ ] Name too long (> 50 chars) shows error
- [ ] Empty description shows error
- [ ] Description too short (< 10 chars) shows error
- [ ] Description too long (> 500 chars) shows error
- [ ] No permissions selected shows error
- [ ] All permissions can be selected/deselected

### Automated Testing

Run the test suite:

```bash
npm test
```

Run specific test file:

```bash
npm test -- --include='**/role.service.spec.ts'
```

Generate coverage:

```bash
npm test -- --code-coverage
```

## Common Tasks

### Task 1: Reset to Default Roles

Open browser DevTools:

```javascript
// In Console tab:
localStorage.removeItem('roles');
location.reload();
```

### Task 2: Export All Roles

```javascript
// In Console tab:
const roles = JSON.parse(localStorage.getItem('roles'));
console.log(JSON.stringify(roles, null, 2));
// Copy the output to a file
```

### Task 3: Import/Restore Roles

```javascript
// In Console tab:
const rolesData = [/* paste your JSON data here */];
localStorage.setItem('roles', JSON.stringify(rolesData));
location.reload();
```

### Task 4: Check Specific Role

```javascript
// In Console tab:
const roles = JSON.parse(localStorage.getItem('roles'));
const role = roles.find(r => r.name === 'Admin');
console.log(role);
```

## Troubleshooting

### Roles not appearing

**Issue**: You don't see any roles in the list
**Solution**:

1. Open DevTools (F12)
2. Go to Application > Local Storage
3. Check if 'roles' key exists
4. If not, refresh the page
5. Default roles should be created

### Cannot create role

**Issue**: "Create Role" button is disabled
**Solution**:

1. Check that role name is valid (3-50 chars)
2. Check that description is valid (10-500 chars)
3. Check that at least one permission is selected
4. All form errors should be resolved

### Changes not saving

**Issue**: Role created but disappears after refresh
**Solution**:

1. Check if localStorage is enabled
2. Check browser storage limits
3. Clear cache and try again
4. Check browser console for errors

### Dialog not closing

**Issue**: Dialog stays open after saving
**Solution**:

1. Check for JavaScript errors in console
2. Verify role was actually created in storage
3. Try refreshing the page
4. Clear browser cache

### Permission list empty

**Issue**: No permissions appear in the selection grid
**Solution**:

1. Check browser console for errors
2. Verify RoleService is injected correctly
3. Ensure permissions array is loading
4. Try clearing cache and refresh

## Performance Tips

1. **Large role lists**: The current implementation is suitable for up to 100+ roles
2. **Local storage limit**: ~5MB per domain, sufficient for thousands of roles
3. **UI responsiveness**: 300ms API delay is configurable if needed slower/faster
4. **Memory**: Proper unsubscription prevents memory leaks

## Next Steps

After mastering role management:

1. **Integrate with employees**: Assign roles to employee records
2. **Implement role-based access**: Use roles to control feature access
3. **Create role hierarchy**: Define role inheritance relationships
4. **Add role templates**: Quick-create roles from templates
5. **Setup audit logging**: Track all role changes

## Resources

- [Full Documentation](./ROLE_MANAGEMENT.md)
- [API Reference](./API_DOCUMENTATION.md)
- [Demo Examples](./src/app/role-management/role-management.demo.ts)
- [Unit Tests](./src/app/role.service.spec.ts)
- [Angular Material](https://material.angular.io)
- [RxJS Operators](https://rxjs.dev/guide/operators)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the full documentation
3. Check browser console for error messages
4. Verify localStorage has the correct data
5. Test in different browser if needed

---

**Last Updated**: 2026-01-04  
**Version**: 1.0.0  
**Status**: Production Ready

Happy role managing! 🚀

