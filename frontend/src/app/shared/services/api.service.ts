import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Warehouse,
  Transfer,
  ApiResponse,
  TransferFilters
} from '../interfaces/models.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Warehouse API
  createWarehouse(data: { name: string; location: string; stock?: Record<string, number> }): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.baseUrl}/warehouses`, data);
  }

  getWarehouses(): Observable<ApiResponse<Warehouse[]>> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${this.baseUrl}/warehouses`);
  }

  getWarehouse(id: string): Observable<ApiResponse<Warehouse>> {
    return this.http.get<ApiResponse<Warehouse>>(`${this.baseUrl}/warehouses/${id}`);
  }

  adjustStock(id: string, sku: string, quantity: number): Observable<ApiResponse<Warehouse>> {
    return this.http.patch<ApiResponse<Warehouse>>(`${this.baseUrl}/warehouses/${id}/stock`, { sku, quantity });
  }

  deleteWarehouse(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/warehouses/${id}`);
  }

  // Transfer API
  createTransfer(data: { sourceWarehouse: string; destWarehouse: string; sku: string; quantity: number; notes?: string }): Observable<ApiResponse<Transfer>> {
    return this.http.post<ApiResponse<Transfer>>(`${this.baseUrl}/transfers`, data);
  }

  getTransfers(filters?: TransferFilters): Observable<ApiResponse<Transfer[]>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.sku) params = params.set('sku', filters.sku);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<ApiResponse<Transfer[]>>(`${this.baseUrl}/transfers`, { params });
  }

  getTransfer(id: string): Observable<ApiResponse<Transfer>> {
    return this.http.get<ApiResponse<Transfer>>(`${this.baseUrl}/transfers/${id}`);
  }

  updateTransferStatus(id: string, status: string, reason?: string): Observable<ApiResponse<Transfer>> {
    return this.http.patch<ApiResponse<Transfer>>(`${this.baseUrl}/transfers/${id}/status`, { status, reason });
  }

  getTransitions(id: string): Observable<ApiResponse<{ currentStatus: string; allowedTransitions: string[] }>> {
    return this.http.get<ApiResponse<{ currentStatus: string; allowedTransitions: string[] }>>(`${this.baseUrl}/transfers/${id}/transitions`);
  }
}
