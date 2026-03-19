import { Request, Response, NextFunction } from "express";
import { TransferService } from "../services/transfer.service";
import { TransferStatus } from "../models/Transfer.model";

const transferService = new TransferService();

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transfer = await transferService.create(req.body);
    res.status(201).json({
      success: true,
      data: transfer,
      message: "Transfer request created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const listTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as TransferStatus | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
      sku: req.query.sku as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await transferService.list(filters);
    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transfer = await transferService.getById(req.params.id as string);
    res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransferStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;
    const transfer = await transferService.updateStatus(req.params.id as string, status, reason);
    res.json({
      success: true,
      data: transfer,
      message: `Transfer status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transfer = await transferService.getById(req.params.id as string);
    const allowed = TransferService.getAllowedTransitions(transfer.status);
    res.json({
      success: true,
      data: { currentStatus: transfer.status, allowedTransitions: allowed },
    });
  } catch (error) {
    next(error);
  }
};
