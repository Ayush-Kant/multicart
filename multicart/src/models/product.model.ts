import mongoose from "mongoose";
import { IUser } from "./user.model";

export interface IProduct {
  _id?: mongoose.Types.ObjectId;

  title: string;
  description: string;
  price: number;

  stock: number;                 
  isStockAvailable?: boolean;    

  image1: string;
  image2: string;
  image3: string;
  image4: string;

  category: string;

  // ✅ Wearable Product
  isWearable?: boolean;          
  sizes?: string[];              

  // ✅ Vendor
  vendor: IUser

  // ✅ Admin Verification
  verificationStatus?: "pending" | "approved" | "rejected";
  rejectedReason?: string;
  approvedAt?: Date;

  isActive?: boolean;

  // ✅ Policies
  replacementDays?: number;     
  freeDelivery?: boolean;       
  warranty?: string;            
  payOnDelivery?: boolean;      

  // ✅ ✅ NEW: PRODUCT DETAIL POINTS (HIGHLIGHTS)
  detailsPoints?: string[];     // ✅ ["100% Cotton", "Water Resistant", "Made in India"]

  reviews?: {
  user: IUser;              // ✅ Review dene wala user
  rating: number;          // ✅ 1–5 stars
  comment?: string;        // ✅ Text review
  image?: string;       // ✅ Review images
  createdAt?: Date;
}[];


  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    title: { type: String, required: true },

    description: { type: String, required: true },

    price: { type: Number, required: true },

    stock: { type: Number, required: true },

    isStockAvailable: {
      type: Boolean,
      default: true,
    },

    image1: { type: String, required: true },
    image2: { type: String, required: true },
    image3: { type: String, required: true },
    image4: { type: String, required: true },

    category: { type: String, required: true },

    isWearable: {
      type: Boolean,
      default: false,
    },

    sizes: {
      type: [String],
      default: [],
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectedReason: { type: String },

    approvedAt: { type: Date },

    isActive: {
      type: Boolean,
      default: false,
    },

    // ✅ Replacement Policy
    replacementDays: {
      type: Number,
      default: 0,
    },

    // ✅ Free Delivery
    freeDelivery: {
      type: Boolean,
      default: false,
    },

    // ✅ Warranty Info
    warranty: {
      type: String,
      default: "No Warranty",
    },

    // ✅ Cash on Delivery
    payOnDelivery: {
      type: Boolean,
      default: false,
    },

    // ✅ ✅ NEW: Product Detail Points
   detailsPoints: {
  type: [String],
  default: [],
},

// ✅ ✅ PRODUCT REVIEWS
reviews: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
    },

    image: {
      type: String
    },

   
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

  },
  { timestamps: true }
);

const Product =
  mongoose.models?.Product ||
  mongoose.model<IProduct>("Product", productSchema);

export default Product;
