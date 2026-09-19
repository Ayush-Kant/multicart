import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrder extends Document {
  products: {
    product: Types.ObjectId;
    quantity: number;
    price: number;
  }[];

  buyer: Types.ObjectId;
  productVendor: Types.ObjectId;

  productsTotal: number;
  deliveryCharge: number;
  serviceCharge: number;
  totalAmount: number;

  paymentMethod: "cod" | "stripe";
  isPaid: boolean;

  orderStatus:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "returned"
    | "cancelled";

    cancelledAt?:Date;
  // ✅ NEW: RETURNED AMOUNT
  returnedAmount?: number;

  address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };

  paymentDetails?: {
    stripePaymentId?: string;
    stripeSessionId?: string;
  };
 deliveryDate?:Date;
  deliveryOtp?:string;

  otpExpiresAt?:Date;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productVendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productsTotal: {
      type: Number,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
    },

    serviceCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"],
      required: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "returned",
        "cancelled"
      ],
      default: "pending",
    },
    cancelledAt: {
  type: Date,
},


    // ✅ NEW: Returned Amount for Refund Accounting
    returnedAmount: {
      type: Number,
      default: 0,
    },

    address: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },

    paymentDetails: {
      stripePaymentId: String,
      stripeSessionId: String,
    },

     deliveryDate: {
  type: Date,
},
    deliveryOtp: {
  type: String,
},
otpExpiresAt: {
  type: Date,
},

  },
  { timestamps: true }
);

const Order =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
