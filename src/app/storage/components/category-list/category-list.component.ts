import {Component, OnInit, ViewChild, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Category} from '../../models/storage.models';
import {CategoryService} from '../../services/category.service';
import {CategoryFormDialogComponent} from '../category-form-dialog/category-form-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="category-list-container">
      <div class="header">
        <h2>Categories</h2>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          Add Category
        </button>
      </div>

      <div *ngIf="isLoading" class="loading">
        <mat-spinner></mat-spinner>
      </div>

      <table mat-table [dataSource]="categories" class="category-table" *ngIf="!isLoading">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Category Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let element">
            {{ element.createdAt | date: 'short' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button (click)="openEditDialog(element)" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deleteCategory(element.id)" matTooltip="Delete" color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            [class.selected]="selectedCategoryId === row.id"
            (click)="selectCategory(row)"></tr>
      </table>

      <div *ngIf="!isLoading && categories.length === 0" class="empty-state">
        <mat-icon>folder_open</mat-icon>
        <p>No categories found. Create one to get started!</p>
      </div>
    </div>
  `,
  styles: [`
    .category-list-container {
      padding: 20px;
      height: 100%;
      overflow-y: auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
        color: #333;
      }
    }

    .category-table {
      width: 100%;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      th {
        background-color: #f5f5f5;
        font-weight: 600;
        color: #333;
      }

      tr {
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover:not(.mat-header-row) {
          background-color: #f9f9f9;
        }

        &.selected {
          background-color: #e3f2fd;

          td {
            color: #1976d2;
          }
        }
      }

      td, th {
        padding: 16px;
        text-align: left;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ddd;
        margin-bottom: 20px;
      }

      p {
        font-size: 16px;
        margin: 0;
      }
    }
  `]
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns: string[] = ['name', 'createdAt', 'actions'];
  isLoading = false;
  selectedCategoryId: string | null = null;

  @Output() selectedCategoryChange = new EventEmitter<Category | null>();

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '400px',
      data: {mode: 'create'}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createCategory(result);
      }
    });
  }

  openEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '400px',
      data: {mode: 'edit', category}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateCategory(category.id, result);
      }
    });
  }

  selectCategory(category: Category): void {
    this.selectedCategoryId = category.id;
    this.selectedCategoryChange.emit(category);
  }

  deleteCategory(categoryId: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open('Category deleted successfully', 'Close', {duration: 3000});
            if (this.selectedCategoryId === categoryId) {
              this.selectedCategoryId = null;
              this.selectedCategoryChange.emit(null);
            }
            this.loadCategories();
          } else {
            this.snackBar.open(response.message || 'Error deleting category', 'Close', {duration: 5000});
          }
        },
        error: (error: any) => {
          console.error('Error deleting category:', error);
          this.snackBar.open('Error deleting category', 'Close', {duration: 5000});
        }
      });
    }
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Error loading categories', 'Close', {duration: 5000});
        this.isLoading = false;
      }
    });
  }

  private createCategory(name: string): void {
    this.categoryService.createCategory(name).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Category created successfully', 'Close', {duration: 3000});
          this.loadCategories();
        } else {
          this.snackBar.open(response.message || 'Error creating category', 'Close', {duration: 5000});
        }
      },
      error: (error: any) => {
        console.error('Error creating category:', error);
        this.snackBar.open('Error creating category', 'Close', {duration: 5000});
      }
    });
  }

  private updateCategory(categoryId: string, name: string): void {
    this.categoryService.updateCategory(categoryId, name).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Category updated successfully', 'Close', {duration: 3000});
          this.loadCategories();
        } else {
          this.snackBar.open(response.message || 'Error updating category', 'Close', {duration: 5000});
        }
      },
      error: (error: any) => {
        console.error('Error updating category:', error);
        this.snackBar.open('Error updating category', 'Close', {duration: 5000});
      }
    });
  }
}

