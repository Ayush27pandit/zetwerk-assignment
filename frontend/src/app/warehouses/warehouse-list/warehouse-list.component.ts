import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { Warehouse } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-warehouse-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './warehouse-list.component.html',
  styleUrl: './warehouse-list.component.scss'
})
export class WarehouseListComponent implements OnInit {
  warehouses: Warehouse[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.loading = true;
    this.error = '';
    this.api.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  getStockSummary(stock: Record<string, number>): number {
    return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
  }

  getSkuCount(stock: Record<string, number>): number {
    return Object.keys(stock).length;
  }

  deleteWarehouse(id: string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.api.deleteWarehouse(id).subscribe({
        next: () => {
          this.warehouses = this.warehouses.filter(w => w._id !== id);
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    }
  }
}
