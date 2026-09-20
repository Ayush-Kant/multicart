import crypto from "crypto";
import Order from "@/models/order.model";
import Payout, { IPayout, PayoutStatus } from "@/models/payout.model";
import User from "@/models/user.model";
import { calculateMarketplaceSplit } from "@/lib/marketplace-finance";
import {
  VendorOnboardingInput,
  validateVendorOnboardingInput,
} from "@/lib/vendor-validation";

export const isPayoutDemoMode = () =>
  process.env.PAYOUT_DEMO_MODE !== "false";

export type PayoutVerificationResult = {
  verified: boolean;
  mode: "demo" | "live";
  reason?: string;
};

export const verifyVendorPayoutDetails = (
  details: VendorOnboardingInput
): PayoutVerificationResult => {
  const validationErrors = validateVendorOnboardingInput(details);

  if (Object.keys(validationErrors).length > 0) {
    return {
      verified: false,
      mode: isPayoutDemoMode() ? "demo" : "live",
      reason: "Payout details failed local validation.",
    };
  }

  if (isPayoutDemoMode()) {
    return {
      verified: true,
      mode: "demo",
    };
  }

  return {
    verified: false,
    mode: "live",
    reason: "Live bank/PAN verification is not configured yet.",
  };
};

const maskAccountNumber = (accountNumber?: string) => {
  if (!accountNumber) return undefined;
  return accountNumber.slice(-4);
};

const buildPayoutReference = (orderId: string) =>
  `MC-${orderId.slice(-10).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const syncOrderPayoutFields = async (
  order: any,
  payout: IPayout
) => {
  order.platformFee = payout.platformFee;
  order.vendorAmount = payout.vendorAmount;
  order.payoutStatus = payout.status;
  order.payoutId = payout._id;

  if (payout.payoutDate) {
    order.payoutDate = payout.payoutDate;
  }

  await order.save();
};

export const createOrGetVendorPayout = async (
  orderId: string
): Promise<IPayout | null> => {
  const order = await Order.findById(orderId);

  if (!order || !order.isPaid) {
    return null;
  }

  if (order.orderStatus === "cancelled") {
    return null;
  }

  const existingPayout = await Payout.findOne({ order: order._id });

  if (existingPayout) {
    await syncOrderPayoutFields(order, existingPayout);
    return existingPayout;
  }

  const vendor = await User.findById(order.productVendor);

  if (!vendor) {
    throw new Error("Vendor account not found for payout settlement");
  }

  if (!isPayoutDemoMode()) {
    throw new Error(
      "Live payout provider is not configured. Enable demo payout mode or configure the provider."
    );
  }

  const storedSplitIsAvailable =
    typeof order.platformFee === "number" &&
    typeof order.vendorAmount === "number";

  const split = storedSplitIsAvailable
    ? {
        platformFee: order.platformFee,
        vendorAmount: order.vendorAmount,
      }
    : calculateMarketplaceSplit(order.productsTotal);

  const payoutData = {
    order: order._id,
    vendor: vendor._id,
    grossAmount: split.vendorAmount + split.platformFee,
    platformFee: split.platformFee,
    vendorAmount: split.vendorAmount,
    status: "paid" as PayoutStatus,
    mode: "demo" as const,
    provider: "demo" as const,
    payoutReference: buildPayoutReference(order._id.toString()),
    payoutDate: new Date(),
    destination: {
      accountHolderName: vendor.payoutDetails?.accountHolderName,
      bankName: vendor.payoutDetails?.bankName,
      accountLast4: maskAccountNumber(
        vendor.payoutDetails?.accountNumber
      ),
      ifscCode: vendor.payoutDetails?.ifscCode,
    },
  };

  let payout: IPayout;

  try {
    payout = await Payout.create(payoutData);
  } catch (error: any) {
    if (error?.code !== 11000) {
      throw error;
    }

    const concurrentPayout = await Payout.findOne({ order: order._id });

    if (!concurrentPayout) {
      throw error;
    }

    payout = concurrentPayout;
  }

  await syncOrderPayoutFields(order, payout);

  return payout;
};

export const settlePaidOrder = async (orderId: string) => {
  return createOrGetVendorPayout(orderId);
};

export const reverseVendorPayout = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const payout = await Payout.findOne({ order: order._id });

  if (!payout) {
    return null;
  }

  if (payout.status === "reversed") {
    return payout;
  }

  payout.status = "reversed";
  payout.reversalAmount = payout.vendorAmount;
  payout.reversedAt = new Date();

  await payout.save();

  order.payoutStatus = "reversed";
  await order.save();

  return payout;
};
