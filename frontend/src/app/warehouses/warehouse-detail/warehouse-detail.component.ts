import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { Warehouse } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-warehouse-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './warehouse-detail.component.html',
  styleUrl: './warehouse-detail.component.scss'
})
export class WarehouseDetailComponent implements OnInit {
  warehouse: Warehouse | null = null;
  loading = true;
  error = '';
  success = '';

  showStockModal = false;
  adjustSku = '';
  adjustQuantity = 0;
  adjusting = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWarehouse(id);
    }
  }

  loadWarehouse(id: string) {
    this.loading = true;
    this.error = '';
    this.api.getWarehouse(id).subscribe({
      next: (res) => {
        this.warehouse = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  openStockModal() {
    this.showStockModal = true;
    this.adjustSku = '';
    this.adjustQuantity = 0;
    this.error = '';
    this.success = '';
  }

  closeStockModal() {
    this.showStockModal = false;
  }

  adjustStock() {
    if (!this.warehouse || !this.adjustSku.trim()) {
      this.error = 'SKU is required';
      return;
    }

    this.adjusting = true;
    this.error = '';
    this.success = '';

    this.api.adjustStock(this.warehouse._id, this.adjustSku.trim().toUpperCase(), this.adjustQuantity).subscribe({
      next: (res) => {
        this.warehouse = res.data;
        this.success = `Stock adjusted successfully`;
        this.adjusting = false;
        this.showStockModal = false;
      },
      error: (err) => {
        this.error = err.message;
        this.adjusting = false;
      }
    });
  }

  getStockEntries(): { sku: string; quantity: number }[] {
    if (!this.warehouse) return [];
    return Object.entries(this.warehouse.stock).map(([sku, quantity]) => ({ sku, quantity }));
  }

  getTotalStock(): number {
    if (!this.warehouse) return 0;
    return Object.values(this.warehouse.stock).reduce((sum, qty) => sum + qty, 0);
  }
}
