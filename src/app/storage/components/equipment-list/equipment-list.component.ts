import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Equipment} from '../../models/storage.models';
import {EquipmentService} from '../../services/equipment.service';
import {EquipmentFormDialogComponent} from '../equipment-form-dialog/equipment-form-dialog.component';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="equipment-list-container">
      <div class="header">
        <h2>Equipment{{ categoryName ? ' - ' + categoryName : '' }}</h2>
        <button mat-raised-button color="primary" (click)="openAddDialog()" [disabled]="!selectedCategoryId">
          <mat-icon>add</mat-icon>
          Add Equipment
        </button>
      </div>

      <div *ngIf="!selectedCategoryId" class="select-category">
        <mat-icon>arrow_left</mat-icon>
        <p>Select a category to view equipment</p>
      </div>

      <div *ngIf="selectedCategoryId && isLoading" class="loading">
        <mat-spinner></mat-spinner>
      </div>

      <table mat-table [dataSource]="equipment" class="equipment-table" *ngIf="selectedCategoryId && !isLoading">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Price</th>
          <td mat-cell *matCellDef="let element">{{ element.price | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let element">
            <mat-chip [ngClass]="'status-' + element.status">
              {{ element.status | titlecase }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="expirationDate">
          <th mat-header-cell *matHeaderCellDef>Expiration</th>
          <td mat-cell *matCellDef="let element">
            {{ element.expirationDate | date: 'short' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="assignedTo">
          <th mat-header-cell *matHeaderCellDef>Assigned To</th>
          <td mat-cell *matCellDef="let element">
            {{ element.assignedTo ? element.assignedTo : '-' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button (click)="openEditDialog(element)" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deleteEquipment(element.id)" matTooltip="Delete" color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div *ngIf="selectedCategoryId && !isLoading && equipment.length === 0" class="empty-state">
        <mat-icon>inbox</mat-icon>
        <p>No equipment in this category. Add one to get started!</p>
      </div>
    </div>
  `,
  styles: [`
    .equipment-list-container {
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

    .select-category {
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

    .equipment-table {
      width: 100%;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      th {
        background-color: #f5f5f5;
        font-weight: 600;
        color: #333;
      }

      tr:hover:not(.mat-header-row) {
        background-color: #f9f9f9;
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

    ::ng-deep {
      .status-new {
        background-color: #c8e6c9 !important;
        color: #2e7d32 !important;
      }

      .status-in_use {
        background-color: #bbdefb !important;
        color: #1565c0 !important;
      }

      .status-expired {
        background-color: #ffccbc !important;
        color: #d84315 !important;
      }

      .status-assigned_to {
        background-color: #f8bbd0 !important;
        color: #c2185b !important;
      }
    }
  `]
})
export class EquipmentListComponent implements OnInit {
  @Input() selectedCategoryId: string | null | undefined = null;
  @Input() categoryName: string | null | undefined = null;

  equipment: Equipment[] = [];
  displayedColumns: string[] = ['name', 'price', 'status', 'expirationDate', 'assignedTo', 'actions'];
  isLoading = false;

  constructor(
    private equipmentService: EquipmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.loadEquipment();
  }

  ngOnChanges(): void {
    if (this.selectedCategoryId) {
      this.loadEquipment();
    }
  }

  openAddDialog(): void {
    if (!this.selectedCategoryId) return;

    const dialogRef = this.dialog.open(EquipmentFormDialogComponent, {
      width: '500px',
      data: {mode: 'create', categoryId: this.selectedCategoryId}
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.createEquipment(result);
      }
    });
  }

  openEditDialog(equipment: Equipment): void {
    const dialogRef = this.dialog.open(EquipmentFormDialogComponent, {
      width: '500px',
      data: {mode: 'edit', equipment}
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.updateEquipment(equipment.id, result);
      }
    });
  }

  deleteEquipment(equipmentId: string): void {
    if (confirm('Are you sure you want to delete this equipment?')) {
      this.equipmentService.deleteEquipment(equipmentId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open('Equipment deleted successfully', 'Close', {duration: 3000});
            this.loadEquipment();
          } else {
            this.snackBar.open(response.message || 'Error deleting equipment', 'Close', {duration: 5000});
          }
        },
        error: (error: any) => {
          console.error('Error deleting equipment:', error);
          this.snackBar.open('Error deleting equipment', 'Close', {duration: 5000});
        }
      });
    }
  }

  private loadEquipment(): void {
    if (!this.selectedCategoryId) {
      this.equipment = [];
      return;
    }

    this.isLoading = true;
    this.equipmentService.getEquipmentByCategory(this.selectedCategoryId).subscribe({
      next: (equipment: Equipment[]) => {
        this.equipment = equipment;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading equipment:', error);
        this.snackBar.open('Error loading equipment', 'Close', {duration: 5000});
        this.isLoading = false;
      }
    });
  }

  private createEquipment(equipmentData: any): void {
    this.equipmentService.createEquipment(equipmentData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Equipment created successfully', 'Close', {duration: 3000});
          this.loadEquipment();
        } else {
          this.snackBar.open(response.message || 'Error creating equipment', 'Close', {duration: 5000});
        }
      },
      error: (error: any) => {
        console.error('Error creating equipment:', error);
        this.snackBar.open('Error creating equipment', 'Close', {duration: 5000});
      }
    });
  }

  private updateEquipment(equipmentId: string, updates: any): void {
    this.equipmentService.updateEquipment(equipmentId, updates).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Equipment updated successfully', 'Close', {duration: 3000});
          this.loadEquipment();
        } else {
          this.snackBar.open(response.message || 'Error updating equipment', 'Close', {duration: 5000});
        }
      },
      error: (error: any) => {
        console.error('Error updating equipment:', error);
        this.snackBar.open('Error updating equipment', 'Close', {duration: 5000});
      }
    });
  }
}

