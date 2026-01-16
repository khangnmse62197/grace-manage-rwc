import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {CreateRoleRequest, Role, RoleService, UpdateRoleRequest} from './role.service';
import {environment} from '../environments/environment';

describe('RoleService', () => {
  let service: RoleService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1`;

  // Sample mock data
  const mockRoles: Role[] = [
    {
      id: 1,
      name: 'Admin',
      description: 'Full system access with all permissions',
      permissions: ['view_employees', 'create_employee', 'edit_employee', 'delete_employee'],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z')
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Can manage employees and view statistics',
      permissions: ['view_employees', 'create_employee', 'view_statistics'],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z')
    }
  ];

  const mockPermissions = [
    'view_employees',
    'create_employee',
    'edit_employee',
    'delete_employee',
    'view_roles',
    'create_role',
    'edit_role',
    'delete_role',
    'view_statistics',
    'view_check_in_out',
    'manage_check_in_out',
    'manage_inventory',
    'view_notifications',
    'manage_notifications',
    'export_data',
    'import_data',
    'system_settings',
    'user_management'
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoleService]
    });
    service = TestBed.inject(RoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRolesOnce', () => {
    it('should fetch roles from backend', (done) => {
      const apiResponse = {
        status: 'success',
        message: 'Roles retrieved successfully',
        data: mockRoles.map(r => ({...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()}))
      };

      service.getRolesOnce().subscribe(roles => {
        expect(roles.length).toBe(2);
        expect(roles[0].name).toBe('Admin');
        expect(roles[1].name).toBe('Manager');
        expect(roles[0].createdAt instanceof Date).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should handle error when fetching roles', (done) => {
      service.getRolesOnce().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('getRoleById', () => {
    it('should fetch a single role by ID', (done) => {
      const apiResponse = {
        status: 'success',
        message: 'Role retrieved successfully',
        data: {
          ...mockRoles[0],
          createdAt: mockRoles[0].createdAt.toISOString(),
          updatedAt: mockRoles[0].updatedAt.toISOString()
        }
      };

      service.getRoleById(1).subscribe(role => {
        expect(role).toBeDefined();
        expect(role?.name).toBe('Admin');
        expect(role?.id).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/1`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return null for non-existent role', (done) => {
      service.getRoleById(99999).subscribe(role => {
        expect(role).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/99999`);
      req.flush('Role not found', {status: 404, statusText: 'Not Found'});
    });
  });

  describe('createRole', () => {
    it('should create a new role', (done) => {
      const newRoleRequest: CreateRoleRequest = {
        name: 'Supervisor',
        description: 'Supervises team members and operations',
        permissions: ['view_employees', 'manage_check_in_out']
      };

      const createdRole = {
        id: 3,
        ...newRoleRequest,
        createdAt: '2026-01-16T00:00:00Z',
        updatedAt: '2026-01-16T00:00:00Z'
      };

      const apiResponse = {
        status: 'success',
        message: "Role 'Supervisor' created successfully",
        data: createdRole
      };

      service.createRole(newRoleRequest).subscribe(response => {
        expect(response.success).toBeTruthy();
        expect(response.message).toContain('Supervisor');
        expect(response.data).toBeDefined();
        if (response.data && 'id' in response.data) {
          expect((response.data as Role).id).toBe(3);
          expect((response.data as Role).name).toBe('Supervisor');
        }
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRoleRequest);
      req.flush(apiResponse);

      // Handle the refreshRoles call after create
      const refreshReq = httpMock.expectOne(`${baseUrl}/roles`);
      refreshReq.flush({
        status: 'success',
        data: [...mockRoles.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        })), createdRole],
        message: ''
      });
    });

    it('should handle error when creating role', (done) => {
      const newRoleRequest: CreateRoleRequest = {
        name: 'Duplicate',
        description: 'This role name already exists',
        permissions: ['view_employees']
      };

      service.createRole(newRoleRequest).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.message).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      req.flush({message: 'Role name already exists'}, {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', (done) => {
      const updates: UpdateRoleRequest = {
        name: 'Updated Admin',
        description: 'Updated admin description'
      };

      const updatedRole = {
        ...mockRoles[0],
        ...updates,
        createdAt: mockRoles[0].createdAt.toISOString(),
        updatedAt: new Date().toISOString()
      };

      const apiResponse = {
        status: 'success',
        message: "Role 'Updated Admin' updated successfully",
        data: updatedRole
      };

      service.updateRole(1, updates).subscribe(response => {
        expect(response.success).toBeTruthy();
        expect((response.data as Role).name).toBe('Updated Admin');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush(apiResponse);

      // Handle the refreshRoles call after update
      const refreshReq = httpMock.expectOne(`${baseUrl}/roles`);
      refreshReq.flush({
        status: 'success',
        data: mockRoles.map(r => ({...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()})),
        message: ''
      });
    });

    it('should handle error when updating non-existent role', (done) => {
      const updates: UpdateRoleRequest = {
        name: 'Nonexistent'
      };

      service.updateRole(99999, updates).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.message).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/99999`);
      req.flush({message: 'Role not found'}, {status: 404, statusText: 'Not Found'});
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', (done) => {
      const apiResponse = {
        status: 'success',
        message: "Role 'Manager' deleted successfully"
      };

      service.deleteRole(2).subscribe(response => {
        expect(response.success).toBeTruthy();
        expect(response.message).toContain('deleted');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/2`);
      expect(req.request.method).toBe('DELETE');
      req.flush(apiResponse);

      // Handle the refreshRoles call after delete
      const refreshReq = httpMock.expectOne(`${baseUrl}/roles`);
      refreshReq.flush({
        status: 'success',
        data: [mockRoles[0]].map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        })),
        message: ''
      });
    });

    it('should handle error when deleting non-existent role', (done) => {
      service.deleteRole(99999).subscribe(response => {
        expect(response.success).toBeFalsy();
        expect(response.message).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles/99999`);
      req.flush({message: 'Role not found'}, {status: 404, statusText: 'Not Found'});
    });
  });

  describe('getAvailablePermissions', () => {
    it('should fetch available permissions from backend', (done) => {
      const apiResponse = {
        status: 'success',
        message: 'Permissions retrieved successfully',
        data: mockPermissions
      };

      service.getAvailablePermissions().subscribe(permissions => {
        expect(permissions.length).toBe(18);
        expect(permissions).toContain('view_employees');
        expect(permissions).toContain('create_role');
        expect(permissions).toContain('manage_check_in_out');
        expect(permissions).toContain('user_management');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should handle error when fetching permissions', (done) => {
      service.getAvailablePermissions().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/permissions`);
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Observable Behavior', () => {
    it('should emit roles to subscribers', (done) => {
      const apiResponse = {
        status: 'success',
        message: 'Roles retrieved successfully',
        data: mockRoles.map(r => ({...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()}))
      };

      service.getRolesOnce().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      req.flush(apiResponse);

      service.roles$.subscribe(roles => {
        expect(roles.length).toBe(2);
        done();
      });
    });
  });

  describe('Response Format', () => {
    it('should return proper response format on create', (done) => {
      const newRoleRequest: CreateRoleRequest = {
        name: 'Response Format Test',
        description: 'Testing response format validation',
        permissions: ['view_employees']
      };

      const apiResponse = {
        status: 'success',
        message: 'Role created successfully',
        data: {
          id: 4,
          ...newRoleRequest,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      service.createRole(newRoleRequest).subscribe(response => {
        expect(response.success).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.data).toBeDefined();
        expect(typeof response.success).toBe('boolean');
        expect(typeof response.message).toBe('string');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      req.flush(apiResponse);

      // Handle the refreshRoles call
      const refreshReq = httpMock.expectOne(`${baseUrl}/roles`);
      refreshReq.flush({
        status: 'success',
        data: mockRoles.map(r => ({...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()})),
        message: ''
      });
    });

    it('should include timestamps in response', (done) => {
      const newRoleRequest: CreateRoleRequest = {
        name: 'Timestamp Test',
        description: 'Testing timestamp inclusion',
        permissions: ['view_employees']
      };

      const apiResponse = {
        status: 'success',
        message: 'Role created successfully',
        data: {
          id: 5,
          ...newRoleRequest,
          createdAt: '2026-01-16T10:00:00Z',
          updatedAt: '2026-01-16T10:00:00Z'
        }
      };

      service.createRole(newRoleRequest).subscribe(response => {
        if (response.data && 'createdAt' in response.data) {
          expect((response.data as Role).createdAt).toBeDefined();
          expect((response.data as Role).updatedAt).toBeDefined();
          expect((response.data as Role).createdAt instanceof Date).toBeTruthy();
        }
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/roles`);
      req.flush(apiResponse);

      // Handle the refreshRoles call
      const refreshReq = httpMock.expectOne(`${baseUrl}/roles`);
      refreshReq.flush({
        status: 'success',
        data: mockRoles.map(r => ({...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString()})),
        message: ''
      });
    });
  });
});
