import { Request, Response, NextFunction } from "express";
import { WarehouseService } from "../services/warehouse.service";

const warehouseService = new WarehouseService();

export const createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouse = await warehouseService.create(req.body);
    res.status(201).json({
      success: true,
      data: warehouse,
      message: "Warehouse created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const listWarehouses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await warehouseService.list();
    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouse = await warehouseService.getById(req.params.id as string);
    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku, quantity } = req.body;
    const warehouse = await warehouseService.adjustStock(req.params.id as string, sku, quantity);
    res.json({
      success: true,
      data: warehouse,
      message: "Stock adjusted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await warehouseService.softDelete(req.params.id as string);
    res.json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
