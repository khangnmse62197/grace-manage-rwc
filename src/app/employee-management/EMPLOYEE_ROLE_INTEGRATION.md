# Employee-Role Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Grace Team Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │ Role Management      │         │ Employee Management  │  │
│  │                      │         │                      │  │
│  │ • Create roles       │    ◄────┤ • Assign roles       │  │
│  │ • Add permissions    │    ────►│ • View employee roles│  │
│  │ • Edit/Delete roles  │         │ • Edit employee role │  │
│  │                      │         │ • Display role names │  │
│  └──────────┬───────────┘         └──────────┬───────────┘  │
│             │                                 │               │
│             │ RoleService                     │               │
│             └────────────┬────────────────────┘               │
│                          ▼                                    │
│              ┌────────────────────────┐                       │
│              │   Available Roles      │                       │
│              │ (from RoleService)     │                       │
│              │                        │                       │
│              │ 1. Admin               │                       │
│              │ 2. Manager             │                       │
│              │ 3. Employee            │                       │
│              │ 4. (Custom roles)      │                       │
│              └────────────────────────┘                       │
│                          ▲                                    │
│                          │                                    │
│                    localStorage                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Adding an Employee

```
1. Admin Opens Form
   │
   ├─► loadRoles()
   │   └─► Load all roles from RoleService
   │       └─► Display in dropdown
   │
2. Admin Enters Data
   ├─► Full Name: "Jane Doe"
   ├─► Age: "28"
   └─► Role: Select "Manager" (roleId: 2)
   │
3. Submit Form
   │
   └─► saveEmployee()
       ├─► Create employee data
       │   {
       │     fullName: "Jane Doe",
       │     age: 28,
       │     roleId: 2,  ◄─── Role reference
       │     lastCheckInTime: null,
       │     lastCheckOutTime: null
       │   }
       │
       ├─► addEmployee() via EmployeeService
       │
       └─► Save to localStorage
           └─► BehaviorSubject emits update
               └─► Table refreshes
```

### Displaying Employees in Table

```
getAllEmployees()
    │
    ├─► Load from localStorage
    │
    ├─► For each employee:
    │   ├─► Get roleId (e.g., 2)
    │   ├─► Call getRoleName(2)
    │   │   └─► Look up in rolesMap
    │   │       └─► Return "Manager"
    │   │
    │   └─► Display in table row:
    │       { fullName: "Jane Doe", role: "Manager", ... }
    │
    └─► Render table
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│     EmployeeManagementComponent                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Properties:                                            │
│  ├─ employees: Employee[]                              │
│  ├─ roles: Role[]                  ◄─── From RoleService
│  └─ rolesMap: Map<number, string>                      │
│                                                          │
│  Methods:                                               │
│  ├─ loadRoles()                                        │
│  │  └─► roleService.getRolesOnce()                    │
│  │      └─► Populate rolesMap                         │
│  │                                                     │
│  ├─ loadEmployees()                                   │
│  │  └─► employeeService.getEmployees()               │
│  │      └─► Subscribe to employees$                  │
│  │                                                     │
│  ├─ getRoleName(roleId: number)                       │
│  │  └─► rolesMap.get(roleId)                         │
│  │      └─► Return role name for display             │
│  │                                                     │
│  ├─ openAddDialog()                                   │
│  │  └─► Reset form                                   │
│  │      └─► Show dialog                              │
│  │                                                     │
│  ├─ openEditDialog(employee)                          │
│  │  └─► Populate form with employee data             │
│  │      ├─► fullName, age                            │
│  │      └─► roleId (for dropdown)  ◄─── Key change  │
│  │          └─► Show dialog                          │
│  │                                                     │
│  └─ saveEmployee()                                    │
│     ├─► Get form values                              │
│     │   ├─ fullName                                  │
│     │   ├─ age                                       │
│     │   └─ roleId  ◄─── From dropdown               │
│     │                                                │
│     └─► employeeService.addEmployee() or update()   │
│         └─► Close dialog & refresh table             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Form Field Changes

```
BEFORE (Text Input):
┌──────────────────────────────────────┐
│ Work Position                        │
│ ┌──────────────────────────────────┐ │
│ │ [software engineer      ] ← Free text   │
│ └──────────────────────────────────┘ │
│ Problem: No validation, can't query,  │
│          inconsistent data            │
└──────────────────────────────────────┘

AFTER (Dropdown Select):
┌──────────────────────────────────────┐
│ Role                                 │
│ ┌──────────────────────────────────┐ │
│ │ ▼ Manager                        │ │
│ ├──────────────────────────────────┤ │
│ │ Admin                            │ │
│ │ Manager           ◄─── Selected  │ │
│ │ Employee                         │ │
│ │ (Custom roles...)                │ │
│ └──────────────────────────────────┘ │
│ Benefits: Validated, consistent,     │
│           queryable, linked to roles  │
└──────────────────────────────────────┘
```

## Service Integration

```
RoleService          EmployeeService
     │                    │
     ├─ getRolesOnce()   │
     │                    │
     ├─ roles[] ────────►│ Loaded by EmployeeManagementComponent
     │                    │
     └─ Load from      │   └─ Load from
        localStorage       localStorage
```

## Data Relationship

```
ROLE TABLE (RoleService)
┌────┬─────────┬──────────────────┬────────────┐
│ ID │ Name    │ Description      │Permissions│
├────┼─────────┼──────────────────┼────────────┤
│ 1  │ Admin   │ Full access      │ [18 perms] │
│ 2  │ Manager │ Employee mgmt    │ [7 perms]  │
│ 3  │ Employee│ Basic access     │ [3 perms]  │
└────┴─────────┴──────────────────┴────────────┘
        ▲
        │ Referenced by
        │
EMPLOYEE TABLE (EmployeeService)
┌────┬──────────┬─────┬────────┬─────────┐
│ ID │ Name     │ Age │ RoleID │ Check In│
├────┼──────────┼─────┼────────┼─────────┤
│ 1  │ John Doe │ 30  │   1    │ ...     │
│ 2  │ Jane Sm. │ 28  │   2    │ ...     │
│ 3  │ Mike J.  │ 35  │   2    │ ...     │
└────┴──────────┴─────┴────────┴─────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────┐
│ Component Init                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ngOnInit()                                              │
│   │                                                     │
│   ├─► loadRoles()                                      │
│   │   └─► RoleService.getRolesOnce()                  │
│   │       └─► roles = [...]                           │
│   │       └─► rolesMap = Map {                        │
│   │            1 → "Admin"                            │
│   │            2 → "Manager"                          │
│   │            3 → "Employee"                         │
│   │           }                                       │
│   │                                                     │
│   └─► loadEmployees()                                  │
│       └─► EmployeeService.getEmployees()              │
│           └─► employees$ observable                   │
│               └─► employees = [...]                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ User Interaction                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Add/Edit Employee                                       │
│   │                                                     │
│   ├─► Open dialog                                      │
│   │   └─► Load roles dropdown from roles[]             │
│   │                                                     │
│   ├─► Select role from dropdown                        │
│   │   └─► Get roleId                                   │
│   │                                                     │
│   └─► Submit form                                      │
│       └─► Save employee with roleId                    │
│           └─► Emit employees$ observable               │
│               └─► Table updates                        │
│                   └─► Display role name via getRoleName()
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Key Methods

```typescript
// Load roles at component init
loadRoles()
:
void {
  this.roleService.getRolesOnce().subscribe(roles => {
    this.roles = roles;
    this.rolesMap.clear();
    roles.forEach(role => {
      this.rolesMap.set(role.id, role.name);  // Map for quick lookup
    });
  });
}

// Display role name in table
getRoleName(roleId
:
number
):
string
{
  return this.rolesMap.get(roleId) || 'Unknown';
}

// Save employee with roleId
saveEmployee()
:
void {
  const employeeData = {
    fullName: formValue.fullName,
    age: formValue.age,
    roleId: parseInt(formValue.roleId, 10),  // From dropdown
    lastCheckInTime: formValue.lastCheckInTime ? new Date(...) : null,
    lastCheckOutTime: formValue.lastCheckOutTime ? new Date(...) : null
  };
  this.employeeService.addEmployee(employeeData);
}
```

## Benefits of This Architecture

✅ **Separation of Concerns**
└─ Role management and employee management are separate

✅ **Single Source of Truth**
└─ Roles defined in RoleService, referenced in employees

✅ **Scalability**
└─ Easy to add new roles without code changes

✅ **Data Consistency**
└─ No duplicate role definitions, validated selections

✅ **Query-friendly**
└─ Can easily filter employees by role

✅ **Role-based Access Control**
└─ Ready for permission-based UI features

✅ **Maintainability**
└─ Clear relationships between roles and employees

