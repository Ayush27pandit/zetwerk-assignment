import mongoose from "mongoose";
import { Warehouse, IWarehouse } from "../models/Warehouse.model";
import { Transfer, TransferStatus } from "../models/Transfer.model";
import { AppError } from "../middleware/errorHandler";

export class WarehouseService {
  async create(data: { name: string; location: string; stock?: Record<string, number> }): Promise<IWarehouse> {
    const warehouse = new Warehouse({
      name: data.name,
      location: data.location,
      stock: data.stock || {},
    });
    return warehouse.save();
  }

  async list(): Promise<IWarehouse[]> {
    return Warehouse.find({ isActive: true }).select("name location stock createdAt");
  }

  async getById(id: string): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse || !warehouse.isActive) {
      throw new AppError("Warehouse not found", 404, "NOT_FOUND");
    }
    return warehouse;
  }

  async adjustStock(id: string, sku: string, quantity: number): Promise<IWarehouse> {
    const warehouse = await this.getById(id);

    const currentQty = warehouse.stock.get(sku) || 0;
    const newQty = currentQty + quantity;

    if (newQty < 0) {
      throw new AppError(
        `Insufficient stock. Current: ${currentQty}, Attempted change: ${quantity}`,
        422,
        "INSUFFICIENT_STOCK"
      );
    }

    warehouse.stock.set(sku, newQty);
    return warehouse.save();
  }

  async softDelete(id: string): Promise<void> {
    const warehouse = await this.getById(id);

    const pendingTransfers = await Transfer.countDocuments({
      $or: [{ sourceWarehouse: id }, { destWarehouse: id }],
      status: { $in: [TransferStatus.PENDING, TransferStatus.APPROVED, TransferStatus.IN_TRANSIT] },
    });

    if (pendingTransfers > 0) {
      throw new AppError(
        "Cannot delete warehouse with pending transfers",
        409,
        "PENDING_TRANSFERS_EXIST"
      );
    }

    warehouse.isActive = false;
    await warehouse.save();
  }
}
