import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Category} from '../../models/storage.models';

interface DialogData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ mode === 'create' ? 'Create Category' : 'Edit Category' }}</h2>
    <mat-dialog-content>
      <mat-form-field class="full-width">
        <mat-label>Category Name</mat-label>
        <input matInput [(ngModel)]="categoryName" placeholder="Enter category name">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!categoryName.trim()">
        {{ mode === 'create' ? 'Create' : 'Update' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      padding: 20px 24px;
      min-width: 300px;
    }

    mat-form-field {
      margin-bottom: 20px;
    }
  `]
})
export class CategoryFormDialogComponent {
  mode: 'create' | 'edit' = 'create';
  categoryName = '';

  constructor(
    public dialogRef: MatDialogRef<CategoryFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.mode = data.mode;
    if (data.mode === 'edit' && data.category) {
      this.categoryName = data.category.name;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.categoryName.trim()) {
      this.dialogRef.close(this.categoryName.trim());
    }
  }
}

