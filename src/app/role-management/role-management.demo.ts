import {RoleService} from '../role.service';

/**
 * Demo/Test file showing how to use the RoleService
 * This is for reference and testing purposes
 */

// Example 1: Basic Usage in a Component
export class RoleManagementDemo {
  constructor(private roleService: RoleService) {
  }

  // Get all roles as observable
  demoGetRoles() {
    this.roleService.getRoles().subscribe(roles => {
      console.log('All roles:', roles);
      roles.forEach(role => {
        console.log(`- ${role.name}: ${role.permissions.length} permissions`);
      });
    });
  }

  // Get all roles one-time
  demoGetRolesOnce() {
    this.roleService.getRolesOnce().subscribe(roles => {
      console.log('Fetched roles (one-time):', roles);
    });
  }

  // Get specific role by ID
  demoGetRoleById() {
    this.roleService.getRoleById(1).subscribe(role => {
      if (role) {
        console.log('Found role:', role.name);
      } else {
        console.log('Role not found');
      }
    });
  }

  // Create a new role
  demoCreateRole() {
    const newRole = {
      name: 'Department Lead',
      description: 'Leads a department with oversight of multiple teams',
      permissions: [
        'view_employees',
        'create_employee',
        'edit_employee',
        'view_statistics',
        'manage_check_in_out'
      ]
    };

    this.roleService.createRole(newRole).subscribe(response => {
      if (response.success) {
        console.log('Role created successfully:', response.data);
        console.log('Message:', response.message);
      } else {
        console.log('Error:', response.message);
      }
    });
  }

  // Update a role
  demoUpdateRole() {
    const roleId = 2; // Update Manager role
    const updates = {
      name: 'Senior Manager',
      description: 'Senior manager with full oversight',
      permissions: [
        'view_employees',
        'create_employee',
        'edit_employee',
        'delete_employee',
        'view_statistics',
        'view_check_in_out',
        'manage_check_in_out'
      ]
    };

    this.roleService.updateRole(roleId, updates).subscribe(response => {
      if (response.success) {
        console.log('Role updated:', response.data);
      } else {
        console.log('Update failed:', response.message);
      }
    });
  }

  // Delete a role
  demoDeleteRole() {
    const roleId = 4; // Delete a non-essential role
    this.roleService.deleteRole(roleId).subscribe(response => {
      if (response.success) {
        console.log('Role deleted successfully:', response.message);
      } else {
        console.log('Deletion failed:', response.message);
      }
    });
  }

  // Get available permissions
  demoGetPermissions() {
    this.roleService.getAvailablePermissions().subscribe(permissions => {
      console.log('Available permissions:');
      permissions.forEach((permission, index) => {
        console.log(`${index + 1}. ${permission}`);
      });
      console.log(`\nTotal: ${permissions.length} permissions`);
    });
  }
}

// Example 2: Working with Permission Assignment
export class PermissionAssignmentDemo {
  constructor(private roleService: RoleService) {
  }

  // Create role with specific permissions
  createManagerRole() {
    const managerRole = {
      name: 'Team Manager',
      description: 'Manages team members and monitors check-in/out',
      permissions: [
        'view_employees',
        'edit_employee',
        'view_check_in_out',
        'manage_check_in_out',
        'view_notifications'
      ]
    };

    this.roleService.createRole(managerRole).subscribe(response => {
      if (response.success) {
        console.log('Manager role created with permissions:');
        (response.data as any).permissions.forEach((p: any) => console.log(`  ✓ ${p}`));
      }
    });
  }

  // Create role with minimal permissions
  createEmployeeRole() {
    const employeeRole = {
      name: 'Basic Employee',
      description: 'Basic user with check-in/out access only',
      permissions: [
        'view_check_in_out',
        'manage_check_in_out'
      ]
    };

    this.roleService.createRole(employeeRole).subscribe(response => {
      if (response.success) {
        console.log('Employee role created');
      }
    });
  }

  // Add permissions to existing role
  addPermissionsToRole(roleId: number, newPermissions: string[]) {
    this.roleService.getRoleById(roleId).subscribe(role => {
      if (role) {
        const updatedPermissions = [...new Set([...role.permissions, ...newPermissions])];
        this.roleService.updateRole(roleId, {
          permissions: updatedPermissions
        }).subscribe(response => {
          if (response.success) {
            console.log(`Added ${newPermissions.length} new permissions to ${role.name}`);
          }
        });
      }
    });
  }

  // Remove specific permission from role
  removePermissionFromRole(roleId: number, permissionToRemove: string) {
    this.roleService.getRoleById(roleId).subscribe(role => {
      if (role) {
        const updatedPermissions = role.permissions.filter(p => p !== permissionToRemove);
        this.roleService.updateRole(roleId, {
          permissions: updatedPermissions
        }).subscribe(response => {
          if (response.success) {
            console.log(`Removed '${permissionToRemove}' from ${role.name}`);
          }
        });
      }
    });
  }
}

// Example 3: Advanced Patterns with RxJS
export class AdvancedRoleDemo {
  constructor(private roleService: RoleService) {
  }

  // Chain multiple operations
  demoChainedOperations() {
    // Get all roles, filter, and log
    this.roleService.getRolesOnce().subscribe(roles => {
      const rolesWithManyPermissions = roles.filter(r => r.permissions.length > 5);
      console.log(`Roles with more than 5 permissions: ${rolesWithManyPermissions.length}`);
      rolesWithManyPermissions.forEach(role => {
        console.log(`${role.name}: ${role.permissions.length} permissions`);
      });
    });
  }

  // Get permissions and compare with role
  demoComparePermissions(roleId: number) {
    // Get both roles and all available permissions
    Promise.all([
      this.roleService.getRoleById(roleId).toPromise(),
      this.roleService.getAvailablePermissions().toPromise()
    ]).then(([role, allPermissions]) => {
      if (role && allPermissions) {
        const missingPermissions = allPermissions.filter(
          p => !role.permissions.includes(p)
        );
        console.log(`${role.name} is missing ${missingPermissions.length} permissions`);
        console.log('Missing permissions:', missingPermissions);
      }
    });
  }

  // Calculate role statistics
  demoRoleStatistics() {
    this.roleService.getRolesOnce().subscribe(roles => {
      const totalRoles = roles.length;
      const avgPermissions = roles.reduce((sum, r) => sum + r.permissions.length, 0) / totalRoles;
      const maxPermissions = Math.max(...roles.map(r => r.permissions.length));
      const minPermissions = Math.min(...roles.map(r => r.permissions.length));

      console.log('=== Role Statistics ===');
      console.log(`Total Roles: ${totalRoles}`);
      console.log(`Average Permissions: ${avgPermissions.toFixed(2)}`);
      console.log(`Max Permissions: ${maxPermissions}`);
      console.log(`Min Permissions: ${minPermissions}`);
    });
  }
}

// Example 4: Form Integration Demo
export class RoleFormDemo {
  constructor(private roleService: RoleService) {
  }

  // Handle form submission (like in RoleManagementComponent)
  demoFormSubmission(formData: any, isEditMode: boolean, selectedPermissions: Set<string>) {
    if (!formData.name || !formData.description || selectedPermissions.size === 0) {
      console.log('Form validation failed');
      return;
    }

    const roleData = {
      name: formData.name,
      description: formData.description,
      permissions: Array.from(selectedPermissions)
    };

    if (isEditMode) {
      // Update mode
      this.roleService.updateRole(formData.id, roleData).subscribe(response => {
        if (response.success) {
          console.log('Role updated successfully');
        } else {
          console.log('Update failed:', response.message);
        }
      });
    } else {
      // Create mode
      this.roleService.createRole(roleData as any).subscribe(response => {
        if (response.success) {
          console.log('Role created successfully:', (response.data as any).id);
        } else {
          console.log('Creation failed:', response.message);
        }
      });
    }
  }
}

// Example 5: Error Handling Demo
export class ErrorHandlingDemo {
  constructor(private roleService: RoleService) {
  }

  // Handle errors gracefully
  demoErrorHandling() {
    this.roleService.createRole({
      name: 'Test Role',
      description: 'Testing error handling',
      permissions: ['view_employees']
    }).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Success:', response.message);
        } else {
          console.log('Business Logic Error:', response.message);
        }
      },
      error: (error) => {
        console.log('Network/HTTP Error:', error);
      },
      complete: () => {
        console.log('Observable completed');
      }
    });
  }

  // Delete with confirmation
  demoDeleteWithConfirmation(roleId: number, roleName: string) {
    const confirmed = confirm(`Are you sure you want to delete '${roleName}'?`);
    if (!confirmed) {
      console.log('Deletion cancelled');
      return;
    }

    this.roleService.deleteRole(roleId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Deleted successfully:', response.message);
        } else {
          console.log('Deletion failed:', response.message);
        }
      },
      error: (error) => {
        console.log('Error during deletion:', error);
      }
    });
  }
}

// Example 6: Testing Data Validation
export class ValidationDemo {
  getValidationRules() {
    return {
      roleName: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9\\s_-]+$'
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 500
      },
      permissions: {
        required: true,
        minCount: 1
      }
    };
  }

  demoValidation() {
    const rules = this.getValidationRules();

    // Test role name validation
    const testNames = ['A', 'Admin', 'Super Admin Role', 'x'.repeat(51)];
    testNames.forEach(name => {
      const isValid =
        name.length >= rules.roleName.minLength &&
        name.length <= rules.roleName.maxLength;
      console.log(`"${name}" is ${isValid ? 'valid' : 'invalid'}`);
    });

    // Test description validation
    const testDesc = 'Short', longDesc = 'x'.repeat(501);
    console.log(`Short description is ${testDesc.length >= rules.description.minLength ? 'valid' : 'invalid'}`);
    console.log(`Long description is ${longDesc.length <= rules.description.maxLength ? 'valid' : 'invalid'}`);
  }
}

/**
 * Usage Guide:
 *
 * 1. Inject RoleService into your component
 * 2. Call service methods with proper subscription handling
 * 3. Use unsubscribe patterns to prevent memory leaks
 * 4. Handle both success and error responses
 * 5. Update UI based on response data
 *
 * Example in component:
 * ```typescript
 * constructor(private roleService: RoleService) {}
 *
 * ngOnInit() {
 *   this.roleService.getRoles().subscribe(roles => {
 *     this.roles = roles;
 *   });
 * }
 * ```
 */

