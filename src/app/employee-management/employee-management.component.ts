import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Employee, EmployeeService} from '../employee.service';
import {Role, RoleService} from '../role.service';
import {CredentialValidatorService} from '../shared/services/credential-validator.service';
import {generateTemporaryPassword, hashPassword} from '../shared/utils/password-hasher.util';

@Component({
  selector: 'app-employee-management',
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
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.scss'
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [];
  roles: Role[] = [];
  rolesMap: Map<number, string> = new Map();
  displayedColumns: string[] = ['fullName', 'age', 'username', 'role', 'lastCheckInTime', 'lastCheckOutTime', 'actions'];

  showDialog: boolean = false;
  isEditMode: boolean = false;
  currentEmployeeId: number | null = null;
  employeeForm: FormGroup;
  showPassword: boolean = false;
  generatedPassword: string | null = null;
  usernameValidationError: string = '';
  passwordValidationErrors: string[] = [];

  constructor(
    private employeeService: EmployeeService,
    private roleService: RoleService,
    private credentialValidator: CredentialValidatorService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      roleId: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      lastCheckInTime: [''],
      lastCheckOutTime: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadEmployees();
  }

  loadRoles(): void {
    this.roleService.getRolesOnce().subscribe(roles => {
      this.roles = roles;
      // Create a map for quick lookup of role name by ID
      this.rolesMap.clear();
      roles.forEach(role => {
        this.rolesMap.set(role.id, role.name);
      });
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(employees => {
      this.employees = employees;
    });
  }

  getRoleName(roleId: number): string {
    return this.rolesMap.get(roleId) || 'Unknown';
  }

  /**
   * Validate username and check if available
   */
  validateUsername(): void {
    const username = this.employeeForm.get('username')?.value;
    const excludeId = this.isEditMode ? this.currentEmployeeId : undefined;
    const result = this.credentialValidator.validateUsername(username, excludeId);

    this.usernameValidationError = result.errors.length > 0 ? result.errors[0] : '';
    if (!result.isAvailable) {
      this.employeeForm.get('username')?.setErrors({invalid: true});
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(): void {
    const password = this.employeeForm.get('password')?.value;
    const result = this.credentialValidator.validatePasswordStrength(password);

    this.passwordValidationErrors = result.errors;
    if (!result.isValid) {
      this.employeeForm.get('password')?.setErrors({invalid: true});
    }
  }

  /**
   * Generate a temporary password
   */
  generatePassword(): void {
    this.generatedPassword = generateTemporaryPassword();
    this.employeeForm.patchValue({password: this.generatedPassword});
    this.validatePassword();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.currentEmployeeId = null;
    this.employeeForm.reset();
    this.showPassword = false;
    this.generatedPassword = null;
    this.usernameValidationError = '';
    this.passwordValidationErrors = [];
    this.showDialog = true;
  }

  openEditDialog(employee: Employee): void {
    this.isEditMode = true;
    this.currentEmployeeId = employee.id;

    // Convert Date objects to datetime-local format
    const formatDateTimeLocal = (date: Date | null): string => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    this.employeeForm.patchValue({
      fullName: employee.fullName,
      age: employee.age,
      roleId: employee.roleId,
      username: employee.username || '',
      password: employee.password || '',
      lastCheckInTime: formatDateTimeLocal(employee.lastCheckInTime),
      lastCheckOutTime: formatDateTimeLocal(employee.lastCheckOutTime)
    });

    // Make password optional for edit mode (can update without changing password)
    this.employeeForm.get('password')?.setValidators([Validators.required]);
    this.employeeForm.get('password')?.updateValueAndValidity();

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.employeeForm.reset();
    this.currentEmployeeId = null;
    this.showPassword = false;
    this.generatedPassword = null;
    this.usernameValidationError = '';
    this.passwordValidationErrors = [];
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      return;
    }

    const formValue = this.employeeForm.value;
    const employeeData = {
      fullName: formValue.fullName,
      age: formValue.age,
      roleId: parseInt(formValue.roleId, 10),
      username: formValue.username,
      password: hashPassword(formValue.password),
      lastCheckInTime: formValue.lastCheckInTime ? new Date(formValue.lastCheckInTime) : null,
      lastCheckOutTime: formValue.lastCheckOutTime ? new Date(formValue.lastCheckOutTime) : null
    };

    if (this.isEditMode && this.currentEmployeeId !== null) {
      // Update existing employee
      this.employeeService.updateEmployee(this.currentEmployeeId, employeeData);
    } else {
      // Add new employee
      this.employeeService.addEmployee(employeeData);
    }

    this.closeDialog();
  }

  deleteEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
      this.employeeService.deleteEmployee(employee.id);
    }
  }

  viewDetails(employee: Employee): void {
    this.router.navigate(['/home/employee-detail', employee.id]);
  }
}
