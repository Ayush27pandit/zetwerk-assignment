import mongoose, { Schema, Document, Types } from "mongoose";

export enum TransferStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface IStatusHistoryEntry {
  status: TransferStatus;
  changedAt: Date;
  reason?: string;
}

export interface ITransfer extends Document {
  transferCode: string;
  sourceWarehouse: Types.ObjectId;
  destWarehouse: Types.ObjectId;
  sku: string;
  quantity: number;
  status: TransferStatus;
  notes?: string;
  statusHistory: IStatusHistoryEntry[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const transferSchema = new Schema<ITransfer>(
  {
    transferCode: {
      type: String,
      unique: true,
    },
    sourceWarehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Source warehouse is required"],
    },
    destWarehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Destination warehouse is required"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
    },
    notes: {
      type: String,
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

transferSchema.index({ transferCode: 1 });
transferSchema.index({ sourceWarehouse: 1 });
transferSchema.index({ destWarehouse: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ createdAt: -1 });

transferSchema.pre("validate", function () {
  if (this.isNew && !this.transferCode) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 9000) + 1000;
    this.transferCode = `TXF-${dateStr}-${random}`;

    this.statusHistory.push({
      status: TransferStatus.PENDING,
      changedAt: now,
      reason: "Transfer created",
    });
  }
});

export const Transfer = mongoose.model<ITransfer>("Transfer", transferSchema);
