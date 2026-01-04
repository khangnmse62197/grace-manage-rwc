import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {Equipment, EquipmentStatus} from '../../models/storage.models';
import {EmployeeService, Employee} from '../../../employee.service';

interface DialogData {
  mode: 'create' | 'edit';
  equipment?: Equipment;
  categoryId?: string;
}

@Component({
  selector: 'app-equipment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>{{ mode === 'create' ? 'Create Equipment' : 'Edit Equipment' }}</h2>
    <mat-dialog-content>
      <mat-form-field class="full-width">
        <mat-label>Equipment Name</mat-label>
        <input matInput [(ngModel)]="form.name" placeholder="Enter equipment name">
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Price</mat-label>
        <input matInput [(ngModel)]="form.price" type="number" placeholder="0.00">
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="form.status">
          <mat-option value="new">New</mat-option>
          <mat-option value="in_use">In Use</mat-option>
          <mat-option value="expired">Expired</mat-option>
          <mat-option value="assigned_to">Assigned To</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Expiration Date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="expirationDate" placeholder="Choose a date">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Assigned To</mat-label>
        <mat-select [(ngModel)]="form.assignedTo">
          <mat-option value="">-- Not Assigned --</mat-option>
          <mat-option *ngFor="let emp of employees" [value]="emp.id.toString()">
            {{ emp.fullName }} (ID: {{ emp.id }})
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>Picture URL</mat-label>
        <input matInput [(ngModel)]="form.pictureUrl" placeholder="https://example.com/image.jpg">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!isFormValid()">
        {{ mode === 'create' ? 'Create' : 'Update' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      padding: 20px 24px;
      min-width: 400px;
      max-width: 500px;
    }
  `]
})
export class EquipmentFormDialogComponent implements OnInit {
  mode: 'create' | 'edit' = 'create';
  categoryId: string | null = null;
  employees: Employee[] = [];
  expirationDate: Date | null = null;

  form = {
    name: '',
    price: 0,
    status: EquipmentStatus.NEW,
    expirationDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    pictureUrl: ''
  };

  constructor(
    public dialogRef: MatDialogRef<EquipmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private employeeService: EmployeeService
  ) {
    this.mode = data.mode;
    this.categoryId = data.categoryId || null;

    if (data.mode === 'edit' && data.equipment) {
      const eq = data.equipment;
      this.form = {
        name: eq.name,
        price: eq.price,
        status: eq.status,
        expirationDate: new Date(eq.expirationDate).toISOString().split('T')[0],
        assignedTo: eq.assignedTo || '',
        pictureUrl: eq.pictureUrl || ''
      };
      this.expirationDate = new Date(eq.expirationDate);
    } else {
      this.expirationDate = new Date();
    }
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  isFormValid(): boolean {
    return this.form.name.trim() !== '' &&
      this.form.price >= 0 &&
      this.expirationDate !== null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.isFormValid() && this.expirationDate) {
      if (this.expirationDate <= new Date()) {
        alert('Expiration date must be in the future');
        return;
      }

      const result: any = {
        name: this.form.name.trim(),
        price: this.form.price,
        status: this.form.status,
        expirationDate: this.expirationDate,
        assignedTo: this.form.assignedTo || undefined,
        pictureUrl: this.form.pictureUrl.trim() || undefined
      };

      if (this.mode === 'create') {
        result.categoryId = this.categoryId;
      }

      this.dialogRef.close(result);
    }
  }

  private loadEmployees(): void {
    try {
      this.employees = this.employeeService.getAllEmployees();
    } catch (error) {
      console.error('Error loading employees:', error);
      this.employees = [];
    }
  }
}

