import { Router } from "express";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { TransferStatus } from "../models/Transfer.model";
import {
  createTransfer,
  listTransfers,
  getTransfer,
  updateTransferStatus,
  getTransitions,
} from "../controllers/transfer.controller";

const router = Router();

router.post(
  "/",
  validate([
    body("sourceWarehouse").isMongoId().withMessage("Invalid source warehouse ID"),
    body("destWarehouse").isMongoId().withMessage("Invalid destination warehouse ID"),
    body("sku").trim().notEmpty().withMessage("SKU is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
    body("notes").optional().trim(),
  ]),
  createTransfer
);

router.get(
  "/",
  validate([
    query("status")
      .optional()
      .isIn(Object.values(TransferStatus))
      .withMessage(`Status must be one of: ${Object.values(TransferStatus).join(", ")}`),
    query("warehouseId").optional().isMongoId().withMessage("Invalid warehouse ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ]),
  listTransfers
);

router.get(
  "/:id",
  validate([param("id").isMongoId().withMessage("Invalid transfer ID")]),
  getTransfer
);

router.get(
  "/:id/transitions",
  validate([param("id").isMongoId().withMessage("Invalid transfer ID")]),
  getTransitions
);

router.patch(
  "/:id/status",
  validate([
    param("id").isMongoId().withMessage("Invalid transfer ID"),
    body("status")
      .trim()
      .notEmpty()
      .isIn(Object.values(TransferStatus))
      .withMessage(`Status must be one of: ${Object.values(TransferStatus).join(", ")}`),
    body("reason").optional().trim(),
  ]),
  updateTransferStatus
);

export default router;
