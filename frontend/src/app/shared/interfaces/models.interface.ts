export interface Warehouse {
  _id: string;
  name: string;
  location: string;
  stock: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  _id: string;
  transferCode: string;
  sourceWarehouse: Warehouse | string;
  destWarehouse: Warehouse | string;
  sku: string;
  quantity: number;
  status: TransferStatus;
  notes?: string;
  statusHistory: StatusHistoryEntry[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface StatusHistoryEntry {
  status: TransferStatus;
  changedAt: string;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TransferFilters {
  status?: TransferStatus;
  warehouseId?: string;
  sku?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
