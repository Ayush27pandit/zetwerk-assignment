import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { Transfer, TransferStatus, Warehouse, StatusHistoryEntry } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-transfer-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './transfer-detail.component.html',
  styleUrl: './transfer-detail.component.scss'
})
export class TransferDetailComponent implements OnInit {
  transfer: Transfer | null = null;
  loading = true;
  error = '';
  success = '';

  allowedTransitions: TransferStatus[] = [];
  reason = '';
  updating = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransfer(id);
    }
  }

  loadTransfer(id: string) {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.api.getTransfer(id).subscribe({
      next: (res) => {
        this.transfer = res.data;
        this.loadTransitions(id);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  loadTransitions(id: string) {
    this.api.getTransitions(id).subscribe({
      next: (res) => {
        this.allowedTransitions = res.data.allowedTransitions as TransferStatus[];
      }
    });
  }

  updateStatus(status: TransferStatus) {
    if (!this.transfer) return;

    this.updating = true;
    this.error = '';
    this.success = '';

    this.api.updateTransferStatus(this.transfer._id, status, this.reason || undefined).subscribe({
      next: (res) => {
        this.transfer = res.data;
        this.success = `Status updated to ${status}`;
        this.reason = '';
        this.updating = false;
        this.loadTransitions(this.transfer._id);
      },
      error: (err) => {
        this.error = err.message;
        this.updating = false;
      }
    });
  }

  getWarehouseName(warehouse: Warehouse | string): string {
    if (typeof warehouse === 'string') return 'Unknown';
    return `${warehouse.name} - ${warehouse.location}`;
  }

  getStatusColor(status: TransferStatus): string {
    const colors: Record<TransferStatus, string> = {
      [TransferStatus.PENDING]: '#ffc107',
      [TransferStatus.APPROVED]: '#17a2b8',
      [TransferStatus.IN_TRANSIT]: '#6610f2',
      [TransferStatus.COMPLETED]: '#28a745',
      [TransferStatus.CANCELLED]: '#dc3545'
    };
    return colors[status] || '#666';
  }

  getNextActionLabel(status: TransferStatus): string {
    const labels: Record<TransferStatus, string> = {
      [TransferStatus.APPROVED]: 'Approve',
      [TransferStatus.IN_TRANSIT]: 'Mark In Transit',
      [TransferStatus.COMPLETED]: 'Complete Transfer',
      [TransferStatus.CANCELLED]: 'Cancel Transfer',
      [TransferStatus.PENDING]: ''
    };
    return labels[status] || status;
  }
}
