import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { Warehouse } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-transfer-create',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transfer-create.component.html',
  styleUrl: './transfer-create.component.scss'
})
export class TransferCreateComponent implements OnInit {
  warehouses: Warehouse[] = [];
  sourceWarehouse = '';
  destWarehouse = '';
  sku = '';
  quantity = 1;
  notes = '';
  loading = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.api.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res.data;
      },
      error: (err) => {
        this.error = err.message;
      }
    });
  }

  getAvailableSkus(): string[] {
    if (!this.sourceWarehouse) return [];
    const wh = this.warehouses.find(w => w._id === this.sourceWarehouse);
    if (!wh) return [];
    return Object.keys(wh.stock).filter(sku => wh.stock[sku] > 0);
  }

  getAvailableQuantity(): number {
    if (!this.sourceWarehouse || !this.sku) return 0;
    const wh = this.warehouses.find(w => w._id === this.sourceWarehouse);
    if (!wh) return 0;
    return wh.stock[this.sku] || 0;
  }

  submit() {
    if (!this.sourceWarehouse || !this.destWarehouse || !this.sku || this.quantity < 1) {
      this.error = 'All fields are required';
      return;
    }

    if (this.sourceWarehouse === this.destWarehouse) {
      this.error = 'Source and destination must be different';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.createTransfer({
      sourceWarehouse: this.sourceWarehouse,
      destWarehouse: this.destWarehouse,
      sku: this.sku.toUpperCase(),
      quantity: this.quantity,
      notes: this.notes || undefined
    }).subscribe({
      next: (res) => {
        this.router.navigate(['/transfers', res.data._id]);
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
