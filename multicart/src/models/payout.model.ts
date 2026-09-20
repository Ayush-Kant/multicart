import mongoose, { Document, Schema, Types } from "mongoose";

export type PayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export interface IPayout extends Document {
  order: Types.ObjectId;
  vendor: Types.ObjectId;

  grossAmount: number;
  platformFee: number;
  vendorAmount: number;

  status: PayoutStatus;
  mode: "demo" | "live";
  provider: "demo" | "razorpay";

  payoutReference: string;
  payoutDate?: Date;
  reversedAt?: Date;
  reversalAmount?: number;

  destination?: {
    accountHolderName?: string;
    bankName?: string;
    accountLast4?: string;
    ifscCode?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },

    vendorAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "reversed"],
      default: "pending",
      index: true,
    },

    mode: {
      type: String,
      enum: ["demo", "live"],
      default: "demo",
    },

    provider: {
      type: String,
      enum: ["demo", "razorpay"],
      default: "demo",
    },

    payoutReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    payoutDate: {
      type: Date,
    },

    reversedAt: {
      type: Date,
    },

    reversalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    destination: {
      accountHolderName: String,
      bankName: String,
      accountLast4: String,
      ifscCode: String,
    },
  },
  { timestamps: true }
);

const Payout =
  mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", PayoutSchema);

export default Payout;
