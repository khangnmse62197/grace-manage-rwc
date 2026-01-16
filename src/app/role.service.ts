import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {ApiResponse} from './shared/models/api-response.model';
import {environment} from '../environments/environment';

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

/**
 * Request payload for creating a new role
 */
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

/**
 * Request payload for updating an existing role
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private baseUrl = `${environment.apiUrl}/api/v1`;
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Components are responsible for calling getRolesOnce() or refreshRoles() when needed
  }

  /**
   * Get all roles as observable (from cache)
   */
  getRoles(): Observable<Role[]> {
    return this.roles$;
  }

  /**
   * Get all roles from backend (one-time fetch)
   */
  getRolesOnce(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/roles`).pipe(
      map(response => this.mapRolesFromApi(response.data)),
      tap(roles => this.rolesSubject.next(roles)),
      catchError(error => {
        console.error('Error fetching roles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh roles from server and update cache
   */
  refreshRoles(): void {
    this.getRolesOnce().subscribe();
  }

  /**
   * Get role by ID from backend
   */
  getRoleById(id: number): Observable<Role | null> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/roles/${id}`).pipe(
      map(response => this.mapRoleFromApi(response.data)),
      catchError(error => {
        console.error(`Error fetching role ${id}:`, error);
        if (error.status === 404) {
          return [null];
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new role via backend API
   */
  createRole(roleData: CreateRoleRequest): Observable<RoleResponse> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}/roles`, roleData).pipe(
      map(response => ({
        success: response.status === 'success',
        data: this.mapRoleFromApi(response.data),
        message: response.message
      })),
      tap(response => {
        if (response.success) {
          this.refreshRoles();
        }
      }),
      catchError(error => {
        console.error('Error creating role:', error);
        return [{
          success: false,
          message: error.error?.message || 'Failed to create role'
        }];
      })
    );
  }

  /**
   * Update an existing role via backend API (PATCH)
   */
  updateRole(id: number, updates: UpdateRoleRequest): Observable<RoleResponse> {
    return this.http.patch<ApiResponse<Role>>(`${this.baseUrl}/roles/${id}`, updates).pipe(
      map(response => ({
        success: response.status === 'success',
        data: this.mapRoleFromApi(response.data),
        message: response.message
      })),
      tap(response => {
        if (response.success) {
          this.refreshRoles();
        }
      }),
      catchError(error => {
        console.error(`Error updating role ${id}:`, error);
        return [{
          success: false,
          message: error.error?.message || 'Failed to update role'
        }];
      })
    );
  }

  /**
   * Delete a role via backend API
   */
  deleteRole(id: number): Observable<RoleResponse> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/roles/${id}`).pipe(
      map(response => ({
        success: response.status === 'success',
        message: response.message
      })),
      tap(response => {
        if (response.success) {
          this.refreshRoles();
        }
      }),
      catchError(error => {
        console.error(`Error deleting role ${id}:`, error);
        return [{
          success: false,
          message: error.error?.message || 'Failed to delete role'
        }];
      })
    );
  }

  /**
   * Get available permissions from backend
   */
  getAvailablePermissions(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/permissions`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching permissions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map a single role from API response to Role interface
   * Converts ISO timestamp strings to Date objects
   */
  private mapRoleFromApi(role: any): Role {
    return {
      ...role,
      createdAt: new Date(role.createdAt),
      updatedAt: new Date(role.updatedAt)
    };
  }

  /**
   * Map array of roles from API response to Role[] interface
   */
  private mapRolesFromApi(roles: any[]): Role[] {
    return roles.map(role => this.mapRoleFromApi(role));
  }
}

