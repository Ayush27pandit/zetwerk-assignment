import { Router } from "express";
import { body, param } from "express-validator";
import { validate } from "../middleware/validate";
import {
  createWarehouse,
  listWarehouses,
  getWarehouse,
  adjustStock,
  deleteWarehouse,
} from "../controllers/warehouse.controller";

const router = Router();

router.post(
  "/",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("stock").optional().isObject().withMessage("Stock must be an object"),
    body("stock.*")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stock quantities must be non-negative integers"),
  ]),
  createWarehouse
);

router.get("/", listWarehouses);

router.get(
  "/:id",
  validate([param("id").isMongoId().withMessage("Invalid warehouse ID")]),
  getWarehouse
);

router.patch(
  "/:id/stock",
  validate([
    param("id").isMongoId().withMessage("Invalid warehouse ID"),
    body("sku").trim().notEmpty().withMessage("SKU is required"),
    body("quantity")
      .isInt()
      .withMessage("Quantity must be an integer"),
  ]),
  adjustStock
);

router.delete(
  "/:id",
  validate([param("id").isMongoId().withMessage("Invalid warehouse ID")]),
  deleteWarehouse
);

export default router;
