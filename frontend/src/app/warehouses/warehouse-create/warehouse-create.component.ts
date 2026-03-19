import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-warehouse-create',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './warehouse-create.component.html',
  styleUrl: './warehouse-create.component.scss'
})
export class WarehouseCreateComponent {
  name = '';
  location = '';
  stockEntries: { sku: string; quantity: number }[] = [];
  loading = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {
    this.addStockEntry();
  }

  addStockEntry() {
    this.stockEntries.push({ sku: '', quantity: 0 });
  }

  removeStockEntry(index: number) {
    this.stockEntries.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  submit() {
    if (!this.name.trim() || !this.location.trim()) {
      this.error = 'Name and location are required';
      return;
    }

    this.loading = true;
    this.error = '';

    const stock: Record<string, number> = {};
    for (const entry of this.stockEntries) {
      if (entry.sku.trim() && entry.quantity > 0) {
        stock[entry.sku.toUpperCase()] = entry.quantity;
      }
    }

    this.api.createWarehouse({
      name: this.name.trim(),
      location: this.location.trim(),
      stock
    }).subscribe({
      next: (res) => {
        this.router.navigate(['/warehouses', res.data._id]);
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
