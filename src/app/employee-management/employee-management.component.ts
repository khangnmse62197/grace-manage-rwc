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
import {generateTemporaryPassword} from '../shared/utils/password-hasher.util';

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
  private initialFormValues: any = {};

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
    const result = this.credentialValidator.validateUsername(username, this.employees, excludeId);

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

    // In edit mode, empty password is valid (means no change)
    if (this.isEditMode && !password) {
      this.passwordValidationErrors = [];
      this.employeeForm.get('password')?.setErrors(null);
      return;
    }

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
    this.employeeForm.get('password')?.setValidators([Validators.required]);
    this.employeeForm.get('password')?.updateValueAndValidity();
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
      password: '', // Clear password field for edit
      lastCheckInTime: formatDateTimeLocal(employee.lastCheckInTime),
      lastCheckOutTime: formatDateTimeLocal(employee.lastCheckOutTime)
    });

    // Capture initial values for dirty check
    this.initialFormValues = this.employeeForm.getRawValue();

    // Make password optional for edit mode (can update without changing password)
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('password')?.updateValueAndValidity();

    // Explicitly clear errors to be sure
    this.employeeForm.get('password')?.setErrors(null);

    this.showDialog = true;
  }

  findInvalidControls() {
    const invalid = [];
    const controls = this.employeeForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  hasChanges(): boolean {
    const currentValues = this.employeeForm.getRawValue();
    const initial = this.initialFormValues;

    // Check specific fields
    if (currentValues.fullName !== initial.fullName) return true;
    if (currentValues.age !== initial.age) return true;
    if (currentValues.roleId !== initial.roleId) return true;
    if (currentValues.username !== initial.username) return true;
    if (currentValues.lastCheckInTime !== initial.lastCheckInTime) return true;
    if (currentValues.lastCheckOutTime !== initial.lastCheckOutTime) return true;

    // Password check: if it has value (and we are in edit mode), it means it changed
    // In add mode, everything is a change effectively, but this method is mostly for edit
    if (this.isEditMode && currentValues.password) return true;

    return false;
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

    // Split Full Name into First and Last Name
    const nameParts = formValue.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    // Calculate Date of Birth from Age
    const today = new Date();
    const birthYear = today.getFullYear() - formValue.age;
    const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0]; // Jan 1st of birth year

    // Generate Email
    const email = `${formValue.username}@grace.local`;

    const employeeData = {
      firstName: firstName,
      lastName: lastName,
      fullName: formValue.fullName, // Keep for frontend if needed, but backend uses first/last
      email: email,
      age: formValue.age,
      dateOfBirth: dateOfBirth,
      roleId: parseInt(formValue.roleId, 10),
      username: formValue.username,
      password: this.isEditMode && !formValue.password ? undefined : formValue.password,
      lastCheckInTime: formValue.lastCheckInTime ? new Date(formValue.lastCheckInTime) : null,
      lastCheckOutTime: formValue.lastCheckOutTime ? new Date(formValue.lastCheckOutTime) : null
    };

    if (this.isEditMode && this.currentEmployeeId !== null) {
      // Update existing employee
      const updateData = {...employeeData};
      if (!formValue.password) {
        delete updateData.password;
      }

      this.employeeService.updateEmployee(this.currentEmployeeId, updateData).subscribe({
        next: () => {
          this.loadEmployees();
          this.closeDialog();
        },
        error: (err) => console.error('Error updating employee:', err)
      });
    } else {
      // Add new employee
      this.employeeService.addEmployee(employeeData as any).subscribe({
        next: () => {
          this.loadEmployees();
          this.closeDialog();
        },
        error: (err) => console.error('Error adding employee:', err)
      });
    }
  }

  deleteEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (err) => console.error('Error deleting employee:', err)
      });
    }
  }

  viewDetails(employee: Employee): void {
    this.router.navigate(['/home/employee-detail', employee.id]);
  }
}
