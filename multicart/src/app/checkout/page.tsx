"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { FaCheckCircle, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import AddressBook from "@/component/AddressBook";
import { SavedAddress } from "@/lib/address-validation";
import { calculateOrderCharges } from "@/lib/marketplace-finance";
import AuthGate from "@/component/auth/AuthGate";

export default function CartCheckoutPage() {\n  return (\n    <AuthGate\n      callbackUrl="/checkout"\n      title="Sign in to checkout"\n      description="You need an account to use saved addresses, place orders, and securely complete payment."\n    >\n      <CartCheckoutContent />\n    </AuthGate>\n  );\n}\n\nfunction CartCheckoutContent() {
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<SavedAddress | null>(null);
  const [paymentMode, setPaymentMode] =
    useState<"cod" | "razorpay">("cod");
  const [submitError, setSubmitError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const activeCheckoutGroupId = useRef<string | null>(null);
  const paymentCompleted = useRef(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await axios.get("/api/cart/get");
        const items = response.data.cart || [];

        if (!items.length) {
          router.replace("/cart");
          return;
        }

        setCart(items);

        if (items.some((item: any) => !item.product.payOnDelivery)) {
          setPaymentMode("razorpay");
        }
      } catch (error: any) {
        setSubmitError(
          error?.response?.data?.message ||
            "Unable to load your cart."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [router]);

  const summary = useMemo(() => {
    return cart.reduce(
      (totals, item) => {
        const charges = calculateOrderCharges({
          productPrice: Number(item.product?.price || 0),
          quantity: Number(item.quantity || 0),
          freeDelivery: Boolean(item.product?.freeDelivery),
        });

        totals.productsTotal += charges.productsTotal;
        totals.deliveryCharge += charges.deliveryCharge;
        totals.serviceCharge += charges.serviceCharge;
        totals.totalAmount += charges.totalAmount;

        return totals;
      },
      {
        productsTotal: 0,
        deliveryCharge: 0,
        serviceCharge: 0,
        totalAmount: 0,
      }
    );
  }, [cart]);

  const codDisabled = cart.some(
    (item) => item.product?.payOnDelivery === false
  );

  const handlePlaceOrder = async () => {
    if (!selectedAddress?._id) {
      setSubmitError(
        "Please select a saved delivery address before placing the order."
      );
      return;
    }

    if (!cart.length) {
      setSubmitError("Your cart is empty.");
      return;
    }

    setSubmitError("");
    setPlacingOrder(true);

    try {
      if (paymentMode === "cod") {
        const response = await axios.post(
          "/api/order/cart/create-cod",
          {
            addressId: String(selectedAddress._id),
          }
        );

        router.replace(
          "/order-success?checkoutGroupId=" +
            encodeURIComponent(response.data.checkoutGroupId)
        );
        return;
      }

      if (!razorpayLoaded || !(window as any).Razorpay) {
        setSubmitError(
          "Razorpay Checkout is still loading. Please try again in a moment."
        );
        setPlacingOrder(false);
        return;
      }

      const response = await axios.post(
        "/api/order/cart/online-pay",
        {
          addressId: String(selectedAddress._id),
        }
      );

      activeCheckoutGroupId.current =
        response.data.checkoutGroupId;
      paymentCompleted.current = false;

      const cancelPendingCheckout = async () => {
        const checkoutGroupId =
          activeCheckoutGroupId.current;

        if (!checkoutGroupId || paymentCompleted.current) {
          return;
        }

        try {
          await axios.post(
            "/api/order/cart/cancel-pending",
            { checkoutGroupId }
          );
        } catch (cancelError) {
          console.error(
            "Unable to rollback failed cart checkout:",
            cancelError
          );
        }
      };

      const options = {
        key: response.data.keyId,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "MultiCart",
        description:
          "MultiCart cart checkout (" +
          cart.length +
          " products)",
        order_id: response.data.razorpayOrderId,
        prefill: {
          name: selectedAddress.recipientName,
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (paymentResponse: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await axios.post(
              "/api/order/cart/razorpay/verify",
              {
                checkoutGroupId:
                  response.data.checkoutGroupId,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }
            );

            paymentCompleted.current = true;
            activeCheckoutGroupId.current = null;

            router.replace(
              "/order-success?checkoutGroupId=" +
                encodeURIComponent(
                  response.data.checkoutGroupId
                )
            );
          } catch (error: any) {
            setSubmitError(
              error?.response?.data?.message ||
                "Payment verification failed. The cart orders were not marked as paid."
            );
            setPlacingOrder(false);
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on(
        "payment.failed",
        async (paymentFailure: any) => {
          await cancelPendingCheckout();

          setSubmitError(
            paymentFailure?.error?.description ||
              "Payment failed. Your cart has been kept intact. Please try again."
          );
          setPlacingOrder(false);
          activeCheckoutGroupId.current = null;
        }
      );

      razorpay.open();
    } catch (error: any) {
      setSubmitError(
        error?.response?.data?.message ||
          "Unable to place the complete cart order."
      );
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading cart checkout...
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 px-4 sm:px-6 py-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 transition"
            >
              <FaArrowLeft size={12} />
              Back to Cart
            </button>

            <div>
              <p className="text-blue-400 text-xs uppercase tracking-[0.2em]">
                Cart Checkout
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Review & Place Order
              </h1>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
            <div className="space-y-6">
              <AddressBook
                selectable
                selectedAddressId={
                  selectedAddress
                    ? String(selectedAddress._id)
                    : null
                }
                onSelect={(address) => {
                  setSelectedAddress(address);
                  setSubmitError("");
                }}
              />

              {selectedAddress && (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5">
                  <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold">
                    <FaMapMarkerAlt />
                    Delivering to selected address
                  </div>

                  <p className="mt-2 font-semibold">
                    {selectedAddress.recipientName}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {selectedAddress.addressLine}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedAddress.phone} · Pincode{" "}
                    {selectedAddress.pincode}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {cart.map((item) => {
                  const total =
                    Number(item.product.price || 0) *
                    Number(item.quantity || 0);

                  return (
                    <motion.div
                      key={item.product._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex gap-4"
                    >
                      <img
                        src={item.product.image1}
                        alt={item.product.title}
                        className="w-24 h-24 rounded-xl bg-white object-contain p-2 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-lg truncate">
                          {item.product.title}
                        </h2>
                        <p className="text-sm text-gray-400">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          ₹{" "}
                          {Number(item.product.price).toLocaleString(
                            "en-IN"
                          )}{" "}
                          each
                        </p>
                      </div>

                      <p className="font-bold text-green-400 whitespace-nowrap">
                        ₹ {total.toLocaleString("en-IN")}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:sticky xl:top-24 rounded-2xl border border-white/10 bg-white/[0.045] p-6"
            >
              <h2 className="text-xl font-semibold">
                Order Summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Products ({cart.length})</span>
                  <span>
                    ₹{" "}
                    {summary.productsTotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-gray-300">
                  <span>Delivery</span>
                  <span>
                    ₹{" "}
                    {summary.deliveryCharge.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-gray-300">
                  <span>Service Charge</span>
                  <span>
                    ₹{" "}
                    {summary.serviceCharge.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-400">
                    ₹{" "}
                    {summary.totalAmount.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <p className="font-semibold mb-3">
                  Payment Method
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={codDisabled}
                    onClick={() => setPaymentMode("cod")}
                    className={
                      "rounded-xl px-3 py-3 text-sm font-semibold transition " +
                      (paymentMode === "cod"
                        ? "bg-blue-600 text-white"
                        : "bg-white/10") +
                      (codDisabled
                        ? " opacity-40 cursor-not-allowed"
                        : "")
                    }
                  >
                    Cash on Delivery
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("razorpay")}
                    className={
                      "rounded-xl px-3 py-3 text-sm font-semibold transition " +
                      (paymentMode === "razorpay"
                        ? "bg-blue-600 text-white"
                        : "bg-white/10")
                    }
                  >
                    Razorpay
                  </button>
                </div>

                {codDisabled && (
                  <p className="mt-2 text-xs text-yellow-300">
                    Cash on Delivery is unavailable because at least one
                    cart product does not support it.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={
                  !selectedAddress ||
                  placingOrder ||
                  (paymentMode === "razorpay" &&
                    !razorpayLoaded)
                }
                onClick={handlePlaceOrder}
                className="w-full mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {placingOrder
                  ? "Processing..."
                  : !selectedAddress
                  ? "Select Delivery Address"
                  : paymentMode === "cod"
                  ? "Place Complete Order"
                  : "Proceed to Secure Payment"}
              </button>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Products from different vendors are created as separate
                vendor orders under one cart checkout and one payment.
              </p>
            </motion.aside>
          </div>
        </div>
      </main>
    </>
  );
}
