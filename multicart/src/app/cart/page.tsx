"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function UserCartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getCart = async () => {
    try {
      const res = await axios.get("/api/cart/get");
      setCart(res.data.cart || []);
    } catch (error) {
      console.log("Cart fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  const handleRemoveFromCart = async (productId: string) => {
    setCart((prev) =>
      prev.filter((i) => i.product._id !== productId)
    );
    await axios.post("/api/cart/remove", { productId });
  };

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number
  ) => {
    if (quantity < 1) return;
    await axios.post("/api/cart/update", {
      productId,
      quantity,
    });
    getCart();
  };

  if (loading) {
    return <div className="text-white p-10">Loading cart...</div>;
  }

  if (cart.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">Cart Empty</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {cart.map((item) => (
          <div
            key={item.product._id}
            className="bg-white/10 p-4 rounded-lg flex gap-4"
          >
            <Image
              src={item.product.image1}
              alt={item.product.title}
              width={100}
              height={100}
            />

            <div className="flex-1">
              <h3 className="font-bold">{item.product.title}</h3>
              <p>₹ {item.product.price}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      item.product._id,
                      item.quantity - 1
                    )
                  }
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(
                      item.product._id,
                      item.quantity + 1
                    )
                  }
                >
                  +
                </button>
              </div>

              <button
                onClick={() =>
                  router.push(`/checkout/${item.product._id}`)
                }
                className="mt-3 bg-blue-600 px-4 py-2 rounded"
              >
                Checkout This Product
              </button>

              <button
                onClick={() =>
                  handleRemoveFromCart(item.product._id)
                }
                className="block mt-2 text-red-400"
              >
                Remove
              </button>
            </div>

            <div className="font-bold">
              ₹ {item.product.price * item.quantity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
