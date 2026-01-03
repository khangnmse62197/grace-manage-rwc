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
import {Employee, EmployeeService} from '../employee.service';

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
    MatTooltipModule
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.scss'
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [];
  displayedColumns: string[] = ['fullName', 'age', 'workPosition', 'lastCheckInTime', 'lastCheckOutTime', 'actions'];

  showDialog: boolean = false;
  isEditMode: boolean = false;
  currentEmployeeId: number | null = null;
  employeeForm: FormGroup;

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      workPosition: ['', Validators.required],
      lastCheckInTime: [''],
      lastCheckOutTime: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(employees => {
      this.employees = employees;
    });
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.currentEmployeeId = null;
    this.employeeForm.reset();
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
      workPosition: employee.workPosition,
      lastCheckInTime: formatDateTimeLocal(employee.lastCheckInTime),
      lastCheckOutTime: formatDateTimeLocal(employee.lastCheckOutTime)
    });

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.employeeForm.reset();
    this.currentEmployeeId = null;
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      return;
    }

    const formValue = this.employeeForm.value;
    const employeeData = {
      fullName: formValue.fullName,
      age: formValue.age,
      workPosition: formValue.workPosition,
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
