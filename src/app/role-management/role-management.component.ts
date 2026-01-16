import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Role, RoleService} from '../role.service';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatChipsModule} from '@angular/material/chips';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ReplacePipe} from '../shared/pipes/replace.pipe';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ReplacePipe
  ],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss'
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  displayedColumns: string[] = ['name', 'description', 'permissionCount', 'createdAt', 'actions'];

  showDialog: boolean = false;
  isEditMode: boolean = false;
  currentRoleId: number | null = null;
  roleForm: FormGroup;
  availablePermissions: string[] = [];
  selectedPermissions: Set<string> = new Set();
  loading: boolean = false;
  actionLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadAvailablePermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getRolesOnce()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadAvailablePermissions(): void {
    this.roleService.getAvailablePermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          this.availablePermissions = permissions;
        }
      });
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.currentRoleId = null;
    this.selectedPermissions.clear();
    this.roleForm.reset();
    this.showDialog = true;
  }

  openEditDialog(role: Role): void {
    this.isEditMode = true;
    this.currentRoleId = role.id;
    this.selectedPermissions = new Set(role.permissions);

    this.roleForm.patchValue({
      name: role.name,
      description: role.description
    });

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.roleForm.reset();
    this.selectedPermissions.clear();
    this.currentRoleId = null;
  }

  togglePermission(permission: string): void {
    if (this.selectedPermissions.has(permission)) {
      this.selectedPermissions.delete(permission);
    } else {
      this.selectedPermissions.add(permission);
    }
  }

  isPermissionSelected(permission: string): boolean {
    return this.selectedPermissions.has(permission);
  }

  saveRole(): void {
    if (this.roleForm.invalid || this.selectedPermissions.size === 0) {
      if (this.selectedPermissions.size === 0) {
        alert('Please select at least one permission');
      }
      return;
    }

    this.actionLoading = true;
    const formValue = this.roleForm.value;
    const roleData = {
      name: formValue.name,
      description: formValue.description,
      permissions: Array.from(this.selectedPermissions)
    };

    if (this.isEditMode && this.currentRoleId !== null) {
      // Update existing role
      this.roleService.updateRole(this.currentRoleId, roleData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadRoles();
              this.closeDialog();
            }
            this.actionLoading = false;
          },
          error: () => {
            this.actionLoading = false;
          }
        });
    } else {
      // Create new role
      this.roleService.createRole(roleData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadRoles();
              this.closeDialog();
            }
            this.actionLoading = false;
          },
          error: () => {
            this.actionLoading = false;
          }
        });
    }
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role '${role.name}'?`)) {
      this.actionLoading = true;
      this.roleService.deleteRole(role.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadRoles();
            }
            this.actionLoading = false;
          },
          error: () => {
            this.actionLoading = false;
          }
        });
    }
  }

  getPermissionCount(role: Role): number {
    return role.permissions.length;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}

