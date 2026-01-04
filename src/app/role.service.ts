import {Injectable} from '@angular/core';
import {BehaviorSubject, delay, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleResponse {
  success: boolean;
  data?: Role | Role[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private roles: Role[] = [];
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  private mockDelay = 300; // Simulate API call delay in ms

  constructor() {
    this.loadRoles();
  }

  /**
   * Get all roles as observable
   */
  getRoles(): Observable<Role[]> {
    return this.roles$;
  }

  /**
   * Get all roles (one-time fetch)
   */
  getRolesOnce(): Observable<Role[]> {
    return of(this.roles).pipe(delay(this.mockDelay));
  }

  /**
   * Get role by ID
   */
  getRoleById(id: number): Observable<Role | null> {
    return of(this.roles.find(role => role.id === id) || null).pipe(
      delay(this.mockDelay)
    );
  }

  /**
   * Create a new role (mock API call)
   */
  createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Observable<RoleResponse> {
    return of(null).pipe(
      delay(this.mockDelay),
      map(() => {
        const newRole: Role = {
          ...roleData,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.roles.push(newRole);
        this.saveRoles();
        return {
          success: true,
          data: newRole,
          message: `Role '${newRole.name}' created successfully`
        };
      })
    );
  }

  /**
   * Update an existing role (mock API call)
   */
  updateRole(id: number, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Observable<RoleResponse> {
    return of(null).pipe(
      delay(this.mockDelay),
      map(() => {
        const index = this.roles.findIndex(role => role.id === id);
        if (index !== -1) {
          this.roles[index] = {
            ...this.roles[index],
            ...updates,
            updatedAt: new Date()
          };
          this.saveRoles();
          return {
            success: true,
            data: this.roles[index],
            message: `Role '${this.roles[index].name}' updated successfully`
          };
        }
        return {
          success: false,
          message: `Role with ID ${id} not found`
        };
      })
    );
  }

  /**
   * Delete a role (mock API call)
   */
  deleteRole(id: number): Observable<RoleResponse> {
    return of(null).pipe(
      delay(this.mockDelay),
      map(() => {
        const index = this.roles.findIndex(role => role.id === id);
        if (index !== -1) {
          const deletedRole = this.roles.splice(index, 1)[0];
          this.saveRoles();
          return {
            success: true,
            message: `Role '${deletedRole.name}' deleted successfully`
          };
        }
        return {
          success: false,
          message: `Role with ID ${id} not found`
        };
      })
    );
  }

  /**
   * Get available permissions (mock data)
   */
  getAvailablePermissions(): Observable<string[]> {
    const permissions = [
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
    return of(permissions).pipe(delay(this.mockDelay));
  }

  /**
   * Private method to load roles from localStorage
   */
  private loadRoles(): void {
    const stored = localStorage.getItem('roles');
    if (stored) {
      this.roles = JSON.parse(stored).map((role: any) => ({
        ...role,
        createdAt: new Date(role.createdAt),
        updatedAt: new Date(role.updatedAt)
      }));
    } else {
      // Initialize with sample data
      this.roles = [
        {
          id: 1,
          name: 'Admin',
          description: 'Full system access with all permissions',
          permissions: [
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
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01')
        },
        {
          id: 2,
          name: 'Manager',
          description: 'Can manage employees and view statistics',
          permissions: [
            'view_employees',
            'create_employee',
            'edit_employee',
            'view_statistics',
            'view_check_in_out',
            'manage_check_in_out',
            'view_notifications'
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01')
        },
        {
          id: 3,
          name: 'Employee',
          description: 'Basic user with limited access',
          permissions: [
            'view_check_in_out',
            'manage_check_in_out',
            'view_notifications'
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01')
        }
      ];
      this.saveRoles();
    }
    this.rolesSubject.next([...this.roles]);
  }

  /**
   * Private method to save roles to localStorage
   */
  private saveRoles(): void {
    localStorage.setItem('roles', JSON.stringify(this.roles));
    this.rolesSubject.next([...this.roles]);
  }

  /**
   * Private method to generate unique role IDs
   */
  private generateId(): number {
    return this.roles.length > 0
      ? Math.max(...this.roles.map(role => role.id)) + 1
      : 1;
  }
}

