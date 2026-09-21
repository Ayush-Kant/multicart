"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import AddressBook from "@/component/AddressBook";
import { SavedAddress } from "@/lib/address-validation";
import { calculateOrderCharges } from "@/lib/marketplace-finance";
import AuthGate from "@/component/auth/AuthGate";

export default function CheckoutPage() {
  const paramsForCallback = useParams();
  const callbackProductId = Array.isArray(paramsForCallback?.productId)
    ? paramsForCallback.productId[0]
    : paramsForCallback?.productId;

  return (
    <AuthGate
      callbackUrl={callbackProductId ? `/checkout/${callbackProductId}` : "/cart"}
      title="Sign in to checkout"
      description="Sign in to confirm your address and place this order securely."
    >
      <CheckoutContent />
    </AuthGate>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();

  const productId = useMemo(() => {
    if (!params?.productId) return null;

    return Array.isArray(params.productId)
      ? params.productId[0]
      : params.productId;
  }, [params]);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<SavedAddress | null>(null);
  const [submitError, setSubmitError] = useState("");
  const paymentCompleted = useRef(false);

  const [paymentMode, setPaymentMode] =
    useState<"cod" | "razorpay">("cod");

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const res = await axios.get("/api/cart/get");
        const found = res.data.cart.find(
          (cartItem: any) =>
            cartItem.product._id === productId
        );

        if (!found) {
          router.replace("/cart");
          return;
        }

        setItem(found);

        if (!found.product.payOnDelivery) {
          setPaymentMode("razorpay");
        }
      } catch {
        setSubmitError(
          "Unable to load the checkout item. Please return to your cart and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  if (!productId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading checkout...
      </div>
    );
  }

  if (!item) return null;

  const charges = calculateOrderCharges({
    productPrice: item.product.price,
    quantity: item.quantity,
    freeDelivery: Boolean(item.product.freeDelivery),
  });

  const codDisabled = !item.product.payOnDelivery;

  const handlePlaceOrder = async () => {
    if (!selectedAddress?._id) {
      setSubmitError(
        "Please select a saved delivery address before placing the order."
      );
      return;
    }

    setSubmitError("");

    try {
      if (paymentMode === "cod") {
        const response = await axios.post(
          "/api/order/create-cod",
          {
            productId,
            quantity: item.quantity,
            addressId: String(selectedAddress._id),
          }
        );

        router.replace(
          `/order-success?orderId=${response.data.order._id}`
        );
        return;
      }

      if (!razorpayLoaded || !(window as any).Razorpay) {
        setSubmitError(
          "Razorpay Checkout is still loading. Please try again in a moment."
        );
        return;
      }

      const response = await axios.post(
        "/api/order/online-pay",
        {
          productId,
          quantity: item.quantity,
          addressId: String(selectedAddress._id),
        }
      );

      paymentCompleted.current = false;

      const cancelPendingOrder = async () => {
        if (paymentCompleted.current) return;

        try {
          await axios.post("/api/order/cancel", {
            orderId: response.data.orderId,
          });
        } catch (cancelError) {
          console.error(
            "Unable to rollback failed online checkout:",
            cancelError
          );
        }
      };

      const options = {
        key: response.data.keyId,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "MultiCart",
        description: item.product.title,
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
              "/api/order/razorpay/verify",
              {
                orderId: response.data.orderId,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }
            );

            paymentCompleted.current = true;

            router.replace(
              `/order-success?orderId=${response.data.orderId}`
            );
          } catch (error: any) {
            setSubmitError(
              error?.response?.data?.message ||
                "Payment verification failed. Your order was not marked as paid."
            );
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on(
        "payment.failed",
        async (paymentFailure: any) => {
          await cancelPendingOrder();

          setSubmitError(
            paymentFailure?.error?.description ||
              "Payment failed. Your cart item has been kept. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error: any) {
      setSubmitError(
        error?.response?.data?.message ||
          "Checkout failed. Please review your selected address and try again."
      );
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-black to-[#020617] px-4 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-blue-400 text-xs uppercase tracking-[0.2em]">
              Secure Checkout
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Delivery & Payment
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Choose where you want this order delivered, then select your
              payment method.
            </p>
          </motion.div>

          {submitError && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
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
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5 text-white">
                  <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold">
                    <FaCheckCircle />
                    Delivery address selected
                  </div>

                  <div className="mt-3 flex items-start gap-3">
                    <FaMapMarkerAlt className="text-blue-400 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold">
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
                  </div>
                </div>
              )}
            </div>

            <div className="xl:sticky xl:top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-5 sm:p-6"
              >
                <h2 className="text-2xl font-bold text-white">
                  Order Summary
                </h2>

                <div className="mt-5 flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <img
                    src={item.product.image1}
                    alt={item.product.title}
                    className="w-20 h-20 object-contain rounded-lg bg-white"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100 line-clamp-2">
                      {item.product.title}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-bold text-green-400 whitespace-nowrap">
                    ₹ {charges.productsTotal.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-6 space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Products</span>
                    <span>
                      ₹ {charges.productsTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>
                      ₹ {charges.deliveryCharge.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>
                      ₹ {charges.serviceCharge.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white">
                    <span>Total</span>
                    <span className="text-green-400">
                      ₹ {charges.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="font-semibold text-white">
                    Payment Method
                  </p>

                  <div className="flex gap-3">
                    <button
                      disabled={codDisabled}
                      type="button"
                      onClick={() => setPaymentMode("cod")}
                      className={`flex-1 py-3 rounded-xl font-semibold transition ${
                        paymentMode === "cod"
                          ? "bg-blue-600"
                          : "bg-white/10"
                      } ${
                        codDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      Cash on Delivery
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("razorpay")}
                      className={`flex-1 py-3 rounded-xl font-semibold transition ${
                        paymentMode === "razorpay"
                          ? "bg-blue-600"
                          : "bg-white/10"
                      }`}
                    >
                      Razorpay
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedAddress || !razorpayLoaded && paymentMode === "razorpay"}
                  onClick={handlePlaceOrder}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-lg transition"
                >
                  {!selectedAddress
                    ? "Select Delivery Address"
                    : paymentMode === "cod"
                    ? "Place Order"
                    : "Proceed to Secure Payment"}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
