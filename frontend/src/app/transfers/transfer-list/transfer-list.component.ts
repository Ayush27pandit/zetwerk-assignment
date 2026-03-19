import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { Transfer, TransferStatus, Warehouse, TransferFilters } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-transfer-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './transfer-list.component.html',
  styleUrl: './transfer-list.component.scss'
})
export class TransferListComponent implements OnInit {
  transfers: Transfer[] = [];
  warehouses: Warehouse[] = [];
  loading = true;
  error = '';

  statusFilter: TransferStatus | '' = '';
  warehouseFilter = '';

  statuses = Object.values(TransferStatus);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadWarehouses();
    this.loadTransfers();
  }

  loadWarehouses() {
    this.api.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res.data;
      }
    });
  }

  loadTransfers() {
    this.loading = true;
    this.error = '';

    const filters: TransferFilters = {};
    if (this.statusFilter) filters.status = this.statusFilter as TransferStatus;
    if (this.warehouseFilter) filters.warehouseId = this.warehouseFilter;

    this.api.getTransfers(filters).subscribe({
      next: (res) => {
        this.transfers = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.loadTransfers();
  }

  clearFilters() {
    this.statusFilter = '';
    this.warehouseFilter = '';
    this.loadTransfers();
  }

  getWarehouseName(warehouse: Warehouse | string): string {
    if (typeof warehouse === 'string') return 'Unknown';
    return warehouse.name;
  }
}
