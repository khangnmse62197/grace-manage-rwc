import {TestBed} from '@angular/core/testing';
import {Role, RoleService} from './role.service';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Role Management', () => {
    it('should load default roles on initialization', (done) => {
      service.getRolesOnce().subscribe(roles => {
        expect(roles.length).toBeGreaterThan(0);
        expect(roles.some(r => r.name === 'Admin')).toBeTruthy();
        expect(roles.some(r => r.name === 'Manager')).toBeTruthy();
        expect(roles.some(r => r.name === 'Employee')).toBeTruthy();
        done();
      });
    });

    it('should create a new role', (done) => {
      const newRole = {
        name: 'Supervisor',
        description: 'Supervises team members',
        permissions: ['view_employees', 'manage_check_in_out']
      };

      service.createRole(newRole).subscribe(response => {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
        if (response.data && 'id' in response.data) {
          expect((response.data as Role).id).toBeGreaterThan(0);
          expect((response.data as Role).name).toBe('Supervisor');
        }
        done();
      });
    });

    it('should retrieve created role by ID', (done) => {
      const newRole = {
        name: 'Test Role',
        description: 'Test description for testing',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;
          service.getRoleById(roleId).subscribe(role => {
            expect(role).toBeDefined();
            expect(role?.name).toBe('Test Role');
            done();
          });
        }
      });
    });

    it('should update an existing role', (done) => {
      const newRole = {
        name: 'Original Name',
        description: 'Original description text',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;
          const updates = {
            name: 'Updated Name',
            description: 'Updated description text'
          };

          service.updateRole(roleId, updates).subscribe(updateResponse => {
            expect(updateResponse.success).toBeTruthy();
            expect((updateResponse.data as Role).name).toBe('Updated Name');
            done();
          });
        }
      });
    });

    it('should delete a role', (done) => {
      const newRole = {
        name: 'Role to Delete',
        description: 'This role will be deleted',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;
          service.deleteRole(roleId).subscribe(deleteResponse => {
            expect(deleteResponse.success).toBeTruthy();
            // Verify role is actually deleted
            service.getRoleById(roleId).subscribe(role => {
              expect(role).toBeNull();
              done();
            });
          });
        }
      });
    });
  });

  describe('Permissions', () => {
    it('should return available permissions', (done) => {
      service.getAvailablePermissions().subscribe(permissions => {
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions).toContain('view_employees');
        expect(permissions).toContain('create_role');
        expect(permissions).toContain('manage_check_in_out');
        done();
      });
    });

    it('should allow assigning permissions to roles', (done) => {
      const newRole = {
        name: 'Test Permission Role',
        description: 'Test permission assignment functionality',
        permissions: ['view_employees', 'create_employee', 'edit_employee']
      };

      service.createRole(newRole).subscribe(response => {
        if (response.data && 'id' in response.data) {
          const role = response.data as Role;
          expect(role.permissions.length).toBe(3);
          expect(role.permissions).toContain('view_employees');
          done();
        }
      });
    });

    it('should require at least one permission', (done) => {
      const newRole = {
        name: 'No Permission Role',
        description: 'This role has no permissions',
        permissions: []
      };

      // This should be validated on the component level
      service.createRole(newRole).subscribe(response => {
        // Service will still create it, validation should happen in component
        expect(response.success).toBeTruthy();
        done();
      });
    });
  });

  describe('Local Storage Persistence', () => {
    it('should persist roles to localStorage', (done) => {
      const newRole = {
        name: 'Persistent Role',
        description: 'This role should persist',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(() => {
        const stored = localStorage.getItem('roles');
        expect(stored).toBeTruthy();
        const parsedRoles = JSON.parse(stored!);
        expect(parsedRoles.some((r: Role) => r.name === 'Persistent Role')).toBeTruthy();
        done();
      });
    });

    it('should load roles from localStorage on next initialization', (done) => {
      const newRole = {
        name: 'Stored Role',
        description: 'Role stored in localStorage',
        permissions: ['view_employees']
      };

      // Create and store role
      service.createRole(newRole).subscribe(() => {
        // Create new service instance to test loading from storage
        const newService = new RoleService();
        newService.getRolesOnce().subscribe(roles => {
          expect(roles.some(r => r.name === 'Stored Role')).toBeTruthy();
          done();
        });
      });
    });
  });

  describe('Observable Behavior', () => {
    it('should emit roles as observable', (done) => {
      let emissionCount = 0;
      service.roles$.subscribe(roles => {
        emissionCount++;
        expect(Array.isArray(roles)).toBeTruthy();
      });

      const newRole = {
        name: 'Observable Test',
        description: 'Testing observable emissions',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(() => {
        service.roles$.subscribe(() => {
          expect(emissionCount).toBeGreaterThan(0);
          done();
        });
      });
    });

    it('should emit updated data after create', (done) => {
      const newRole = {
        name: 'Create Observable Test',
        description: 'Testing create observable emission',
        permissions: ['view_employees']
      };

      service.roles$.subscribe(roles => {
        if (roles.some(r => r.name === 'Create Observable Test')) {
          expect(true).toBeTruthy();
          done();
        }
      });

      service.createRole(newRole).subscribe();
    });

    it('should emit updated data after update', (done) => {
      const newRole = {
        name: 'Update Observable Test',
        description: 'Testing update observable emission',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;

          service.roles$.subscribe(roles => {
            const updatedRole = roles.find(r => r.id === roleId);
            if (updatedRole && updatedRole.name === 'Updated Observable Test') {
              expect(true).toBeTruthy();
              done();
            }
          });

          service.updateRole(roleId, {name: 'Updated Observable Test'}).subscribe();
        }
      });
    });

    it('should emit updated data after delete', (done) => {
      const newRole = {
        name: 'Delete Observable Test',
        description: 'Testing delete observable emission',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;

          service.roles$.subscribe(roles => {
            if (!roles.some(r => r.id === roleId)) {
              expect(true).toBeTruthy();
              done();
            }
          });

          service.deleteRole(roleId).subscribe();
        }
      });
    });
  });

  describe('Response Format', () => {
    it('should return proper response format on create', (done) => {
      const newRole = {
        name: 'Response Format Test',
        description: 'Testing response format validation',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(response => {
        expect(response.success).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.data).toBeDefined();
        expect(typeof response.success).toBe('boolean');
        expect(typeof response.message).toBe('string');
        done();
      });
    });

    it('should include timestamps in response', (done) => {
      const newRole = {
        name: 'Timestamp Test',
        description: 'Testing timestamp inclusion',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(response => {
        if (response.data && 'createdAt' in response.data) {
          expect((response.data as Role).createdAt).toBeDefined();
          expect((response.data as Role).updatedAt).toBeDefined();
          expect((response.data as Role).createdAt instanceof Date).toBeTruthy();
        }
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle getting non-existent role', (done) => {
      service.getRoleById(99999).subscribe(role => {
        expect(role).toBeNull();
        done();
      });
    });

    it('should handle updating non-existent role', (done) => {
      service.updateRole(99999, {name: 'Nonexistent'}).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.message).toContain('not found');
        done();
      });
    });

    it('should handle deleting non-existent role', (done) => {
      service.deleteRole(99999).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.message).toContain('not found');
        done();
      });
    });

    it('should generate unique IDs', (done) => {
      const role1 = {
        name: 'ID Test 1',
        description: 'First role for ID testing',
        permissions: ['view_employees']
      };
      const role2 = {
        name: 'ID Test 2',
        description: 'Second role for ID testing',
        permissions: ['view_employees']
      };

      let id1: number;
      service.createRole(role1).subscribe(response => {
        if (response.data && 'id' in response.data) {
          id1 = (response.data as Role).id;
          service.createRole(role2).subscribe(response2 => {
            if (response2.data && 'id' in response2.data) {
              const id2 = (response2.data as Role).id;
              expect(id1).not.toBe(id2);
              expect(id2).toBeGreaterThan(id1);
              done();
            }
          });
        }
      });
    });
  });

  describe('Data Validation', () => {
    it('should preserve all role data correctly', (done) => {
      const newRole = {
        name: 'Data Integrity Test',
        description: 'This test validates data preservation',
        permissions: ['view_employees', 'create_employee', 'edit_employee']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const createdRole = createResponse.data as Role;
          service.getRoleById(createdRole.id).subscribe(fetchedRole => {
            expect(fetchedRole?.name).toBe(newRole.name);
            expect(fetchedRole?.description).toBe(newRole.description);
            expect(fetchedRole?.permissions).toEqual(newRole.permissions);
            expect(fetchedRole?.permissions.length).toBe(3);
            done();
          });
        }
      });
    });

    it('should update only specified fields', (done) => {
      const newRole = {
        name: 'Partial Update Test',
        description: 'Original description',
        permissions: ['view_employees']
      };

      service.createRole(newRole).subscribe(createResponse => {
        if (createResponse.data && 'id' in createResponse.data) {
          const roleId = (createResponse.data as Role).id;
          const partialUpdate = {
            name: 'Updated Name Only'
          };

          service.updateRole(roleId, partialUpdate).subscribe(updateResponse => {
            if (updateResponse.data && 'description' in updateResponse.data) {
              expect((updateResponse.data as Role).name).toBe('Updated Name Only');
              expect((updateResponse.data as Role).description).toBe('Original description');
              done();
            }
          });
        }
      });
    });
  });
});

