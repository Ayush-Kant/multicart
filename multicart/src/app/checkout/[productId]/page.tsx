"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";

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

  // Address
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
          (i: any) => i.product._id === productId
        );

        if (!found) {
          router.replace("/cart");
          return;
        }

        setItem(found);
        if (!found.product.payOnDelivery) {
          setPaymentMode("razorpay");
        }
      } catch (err) {
        console.error(err);
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

  const productsTotal = item.product.price * item.quantity;
  const deliveryCharge = item.product.freeDelivery ? 0 : 50;
  const serviceCharge = 30;
  const finalTotal =
    productsTotal + deliveryCharge + serviceCharge;

  const codDisabled = !item.product.payOnDelivery;

  const handlePlaceOrder = async () => {
    if (!name || !phone || !address || !city || !pincode) {
      alert("Please fill all address fields");
      return;
    }

    try {
      if (paymentMode === "cod") {
        await axios.post("/api/order/create-cod", {
          productId,
          quantity: item.quantity,
          address: { name, phone, address, city, pincode },
          amount: finalTotal,
          deliveryCharge,
          serviceCharge,
        });
        router.replace("/orders");
        return;
      }

      if (!razorpayLoaded || !(window as any).Razorpay) {
        alert("Razorpay Checkout is still loading. Please try again.");
        return;
      }

      const res = await axios.post(
        "/api/order/online-pay",
        {
          productId,
          quantity: item.quantity,
          address: { name, phone, address, city, pincode },
        }
      );

      const options = {
        key: res.data.keyId,
        amount: res.data.amount,
        currency: res.data.currency,
        name: "MultiCart",
        description: item.product.title,
        order_id: res.data.razorpayOrderId,
        prefill: {
          name,
          contact: phone,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await axios.post("/api/order/razorpay/verify", {
              orderId: res.data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            router.replace("/order-success");
          } catch (error: any) {
            alert(
              error?.response?.data?.message ||
              "Payment verification failed"
            );
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on("payment.failed", (response: any) => {
        alert(
          response?.error?.description ||
          "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Checkout failed");
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8"
        >
          {/* LEFT — ADDRESS */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">
              Delivery Address
            </h2>

            <input className="w-full p-3 rounded-xl bg-black/60 border border-white/20
               text-white placeholder-gray-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-white/40 transition" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="w-full p-3 rounded-xl bg-black/60 border border-white/20
               text-white placeholder-gray-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-white/40 transition" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
            <textarea className="w-full p-3 rounded-xl bg-black/60 border border-white/20
               text-white placeholder-gray-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-white/40 transition" rows={3} placeholder="Complete Address" value={address} onChange={e => setAddress(e.target.value)} />

            <div className="grid grid-cols-2 gap-4">
              <input className="w-full p-3 rounded-xl bg-black/60 border border-white/20
               text-white placeholder-gray-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-white/40 transition" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
              <input className="w-full p-3 rounded-xl bg-black/60 border border-white/20
               text-white placeholder-gray-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-white/40 transition" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
            </div>
          </div>

          {/* RIGHT — SUMMARY */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
              Order Summary
            </h2>

            {/* Product Card */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <img
                src={item.product.image1}
                alt={item.product.title}
                className="w-20 h-20 object-contain rounded-lg bg-white"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-100">{item.product.title}</p>
                <p className="text-sm text-gray-400">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="font-bold text-green-400">
                ₹ {productsTotal}
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>₹ {deliveryCharge}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹ {serviceCharge}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white">
                <span>Total</span>
                <span className="text-green-400">
                  ₹ {finalTotal}
                </span>
              </div>
            </div>

            {/* Payment */}
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
                  } ${codDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
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

            {/* CTA */}
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
