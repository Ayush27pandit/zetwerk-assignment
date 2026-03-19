import mongoose from "mongoose";
import { Transfer, ITransfer, TransferStatus, IStatusHistoryEntry } from "../models/Transfer.model";
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const source = await Warehouse.findById(transfer.sourceWarehouse).session(session);
      const dest = await Warehouse.findById(transfer.destWarehouse).session(session);

      if (!source || !dest) {
        throw new AppError("Warehouse not found during completion", 404, "NOT_FOUND");
      }

      const sourceStock = source.stock.get(transfer.sku) || 0;
      if (sourceStock < transfer.quantity) {
        throw new AppError(
          `Insufficient stock at completion. Available: ${sourceStock}, Required: ${transfer.quantity}`,
          409,
          "INSUFFICIENT_STOCK"
        );
      }

      source.stock.set(transfer.sku, sourceStock - transfer.quantity);
      await source.save({ session });

      const destStock = dest.stock.get(transfer.sku) || 0;
      dest.stock.set(transfer.sku, destStock + transfer.quantity);
      await dest.save({ session });

      transfer.status = TransferStatus.COMPLETED;
      transfer.completedAt = new Date();
      transfer.statusHistory.push({
        status: TransferStatus.COMPLETED,
        changedAt: new Date(),
        reason,
      });
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static getAllowedTransitions(currentStatus: TransferStatus): TransferStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
