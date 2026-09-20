"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import {
  normalizeDeliveryAddress,
  validateDeliveryAddress,
  DeliveryAddressErrors,
} from "@/lib/order-validation";
import { calculateOrderCharges } from "@/lib/marketplace-finance";
import HomeButton from "@/component/HomeButton";

export default function CheckoutPage() {
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
  const [errors, setErrors] = useState<
    Partial<DeliveryAddressErrors>
  >({});
  const [submitError, setSubmitError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

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

  const fieldClass = (field: keyof DeliveryAddressErrors) =>
    `w-full p-3 rounded-xl bg-black/60 border text-white placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500
    hover:border-white/40 transition ${
      errors[field]
        ? "border-red-500/70"
        : "border-white/20"
    }`;

  const updateField = (
    field: keyof DeliveryAddressErrors,
    value: string
  ) => {
    const setters: Record<
      keyof DeliveryAddressErrors,
      (value: string) => void
    > = {
      name: setName,
      phone: setPhone,
      address: setAddress,
      city: setCity,
      pincode: setPincode,
    };

    setters[field](value);
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setSubmitError("");
  };

  const handlePlaceOrder = async () => {
    const normalizedAddress = normalizeDeliveryAddress({
      name,
      phone,
      address,
      city,
      pincode,
    });

    const addressErrors = validateDeliveryAddress(
      normalizedAddress
    );

    if (Object.keys(addressErrors).length > 0) {
      setErrors(addressErrors);
      setSubmitError(
        "Please correct the highlighted delivery address fields."
      );
      return;
    }

    setErrors({});
    setSubmitError("");

    try {
      if (paymentMode === "cod") {
        const response = await axios.post(
          "/api/order/create-cod",
          {
            productId,
            quantity: item.quantity,
            address: normalizedAddress,
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
          address: normalizedAddress,
        }
      );

      const options = {
        key: response.data.keyId,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "MultiCart",
        description: item.product.title,
        order_id: response.data.razorpayOrderId,
        prefill: {
          name,
          contact: phone,
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
        (paymentFailure: any) => {
          setSubmitError(
            paymentFailure?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error: any) {
      const serverFieldErrors =
        error?.response?.data?.fieldErrors || {};

      setErrors(serverFieldErrors);

      setSubmitError(
        error?.response?.data?.message ||
          "Checkout failed. Please review your details and try again."
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

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-black to-[#020617] px-4 py-8">
        <div className="max-w-5xl mx-auto flex justify-end mb-4">
          <HomeButton />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8"
        >
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">
              Delivery Address
            </h2>

            {submitError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </div>
            )}

            <div>
              <input
                className={fieldClass("name")}
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <input
                inputMode="numeric"
                maxLength={10}
                className={fieldClass("phone")}
                placeholder="10-digit Phone Number"
                value={phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value.replace(/\D/g, "")
                  )
                }
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <textarea
                className={fieldClass("address")}
                rows={3}
                placeholder="Complete Address"
                value={address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  className={fieldClass("city")}
                  placeholder="City"
                  value={city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className={fieldClass("pincode")}
                  placeholder="6-digit Pincode"
                  value={pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
              Order Summary
            </h2>

            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <img
                src={item.product.image1}
                alt={item.product.title}
                className="w-20 h-20 object-contain rounded-lg bg-white"
              />

              <div className="flex-1">
                <p className="font-semibold text-gray-100">
                  {item.product.title}
                </p>
                <p className="text-sm text-gray-400">
                  Qty: {item.quantity}
                </p>
              </div>

              <p className="font-bold text-green-400">
                ₹ {charges.productsTotal}
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>₹ {charges.deliveryCharge}</span>
              </div>

              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹ {charges.serviceCharge}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white">
                <span>Total</span>
                <span className="text-green-400">
                  ₹ {charges.totalAmount}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-white">
                Payment Method
              </p>

              <div className="flex gap-3">
                <button
                  disabled={codDisabled}
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
                  onClick={() => setPaymentMode("razorpay")}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
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
              onClick={handlePlaceOrder}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 py-4 rounded-2xl font-bold text-lg transition"
            >
              {paymentMode === "cod"
                ? "Place Order"
                : "Proceed to Secure Payment"}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
