import { Transfer, ITransfer, TransferStatus } from "../models/Transfer.model";
import { Warehouse } from "../models/Warehouse.model";
import { AppError } from "../middleware/errorHandler";

export interface TransferFilters {
  status?: TransferStatus;
  warehouseId?: string;
  sku?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult {
  data: ITransfer[];
  meta: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

const ALLOWED_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.PENDING]: [TransferStatus.APPROVED],
  [TransferStatus.APPROVED]: [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
  [TransferStatus.IN_TRANSIT]: [TransferStatus.COMPLETED],
  [TransferStatus.COMPLETED]: [],
  [TransferStatus.CANCELLED]: [],
};

export class TransferService {
  async create(data: {
    sourceWarehouse: string;
    destWarehouse: string;
    sku: string;
    quantity: number;
    notes?: string;
  }): Promise<ITransfer> {
    if (data.sourceWarehouse === data.destWarehouse) {
      throw new AppError("Source and destination warehouses must be different", 400, "SAME_WAREHOUSE");
    }

    const [sourceWarehouse, destWarehouse] = await Promise.all([
      Warehouse.findById(data.sourceWarehouse),
      Warehouse.findById(data.destWarehouse),
    ]);

    if (!sourceWarehouse || !sourceWarehouse.isActive) {
      throw new AppError("Source warehouse not found or inactive", 404, "SOURCE_NOT_FOUND");
    }
    if (!destWarehouse || !destWarehouse.isActive) {
      throw new AppError("Destination warehouse not found or inactive", 404, "DEST_NOT_FOUND");
    }

    const sourceStock = sourceWarehouse.stock.get(data.sku) || 0;
    if (sourceStock < data.quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${sourceStock}, Requested: ${data.quantity}`,
        422,
        "INSUFFICIENT_STOCK"
      );
    }

    const transfer = new Transfer({
      sourceWarehouse: data.sourceWarehouse,
      destWarehouse: data.destWarehouse,
      sku: data.sku,
      quantity: data.quantity,
      notes: data.notes,
    });

    return transfer.save();
  }

  async list(filters: TransferFilters): Promise<PaginatedResult> {
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.sku) query.sku = filters.sku.toUpperCase();
    if (filters.warehouseId) {
      query.$or = [
        { sourceWarehouse: filters.warehouseId },
        { destWarehouse: filters.warehouseId },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      Transfer.find(query)
        .populate("sourceWarehouse", "name location")
        .populate("destWarehouse", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transfer.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  }

  async getById(id: string): Promise<ITransfer> {
    const transfer = await Transfer.findById(id)
      .populate("sourceWarehouse", "name location")
      .populate("destWarehouse", "name location");

    if (!transfer) {
      throw new AppError("Transfer not found", 404, "NOT_FOUND");
    }
    return transfer;
  }

  async updateStatus(
    id: string,
    newStatus: TransferStatus,
    reason?: string
  ): Promise<ITransfer> {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      throw new AppError("Transfer not found", 404, "NOT_FOUND");
    }

    const allowed = ALLOWED_TRANSITIONS[transfer.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${transfer.status} to ${newStatus}`,
        400,
        "INVALID_TRANSITION"
      );
    }

    if (newStatus === TransferStatus.COMPLETED) {
      return this.completeTransfer(transfer, reason);
    }

    transfer.status = newStatus;
    transfer.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      reason,
    });

    return transfer.save();
  }

  private async completeTransfer(transfer: ITransfer, reason?: string): Promise<ITransfer> {
    const stockField = `stock.${transfer.sku}`;

    // ATOMIC DEBIT: Only succeeds if stock >= quantity (race-condition safe)
    // findOneAndUpdate with $inc + $gte is atomic at MongoDB level
    const debitedSource = await Warehouse.findOneAndUpdate(
      {
        _id: transfer.sourceWarehouse,
        [stockField]: { $gte: transfer.quantity },
      },
      {
        $inc: { [stockField]: -transfer.quantity },
      },
      { new: true }
    );

    if (!debitedSource) {
      throw new AppError(
        "Insufficient stock or concurrent modification detected",
        409,
        "INSUFFICIENT_STOCK"
      );
    }

    // ATOMIC CREDIT: Add stock to destination
    const creditedDest = await Warehouse.findOneAndUpdate(
      { _id: transfer.destWarehouse },
      {
        $inc: { [stockField]: transfer.quantity },
      },
      { new: true }
    );

    if (!creditedDest) {
      // Rollback: restore source stock
      await Warehouse.findByIdAndUpdate(transfer.sourceWarehouse, {
        $inc: { [stockField]: transfer.quantity },
      });
      throw new AppError("Destination warehouse not found", 404, "NOT_FOUND");
    }

    // Update transfer status
    transfer.status = TransferStatus.COMPLETED;
    transfer.completedAt = new Date();
    transfer.statusHistory.push({
      status: TransferStatus.COMPLETED,
      changedAt: new Date(),
      reason,
    });
    await transfer.save();

    return transfer;
  }

  static getAllowedTransitions(currentStatus: TransferStatus): TransferStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
