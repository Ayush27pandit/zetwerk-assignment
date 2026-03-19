import mongoose, { Schema, Document } from "mongoose";

export interface IWarehouse extends Document {
  name: string;
  location: string;
  stock: Map<string, number>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    name: {
      type: String,
      required: [true, "Warehouse name is required"],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Warehouse location is required"],
      trim: true,
    },
    stock: {
      type: Map,
      of: Number,
      default: {},
      validate: {
        validator: function (stock: Map<string, number>) {
          for (const [_, qty] of stock) {
            if (qty < 0) return false;
          }
          return true;
        },
        message: "Stock quantities cannot be negative",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseSchema.index({ name: 1 });
warehouseSchema.index({ isActive: 1 });

export const Warehouse = mongoose.model<IWarehouse>("Warehouse", warehouseSchema);
