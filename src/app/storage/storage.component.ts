import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import {CategoryListComponent} from './components/category-list/category-list.component';
import {EquipmentListComponent} from './components/equipment-list/equipment-list.component';
import {Category} from './models/storage.models';
import {CategoryService} from './services/category.service';

@Component({
  selector: 'app-storage',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    CategoryListComponent,
    EquipmentListComponent
  ],
  templateUrl: './storage.component.html',
  styleUrl: './storage.component.scss'
})
export class StorageComponent implements OnInit {
  selectedCategory: Category | null = null;

  constructor(private categoryService: CategoryService) {
  }

  ngOnInit(): void {
  }

  onCategorySelected(category: Category | null): void {
    this.selectedCategory = category;
  }
}

