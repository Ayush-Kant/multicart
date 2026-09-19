"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaShoppingCart,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { IProduct } from "@/models/product.model";
import axios from "axios";

export default function UserProductCard({ product }: { product: IProduct }) {
  const router = useRouter();

  const images = [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
  ].filter(Boolean);

  const [current, setCurrent] = useState(0);

  const openProduct = () => {
    router.push(`/view-product/${product._id}`);
  };

  const next = () =>
    setCurrent((prev) => (prev + 1) % images.length);

  const prev = () =>
    setCurrent((prev) => (prev - 1 + images.length) % images.length);

 const handleAddToCart = async (e: React.MouseEvent) => {
  e.stopPropagation(); // ✅ card click se bache

  try {
    const res = await axios.post("/api/cart/add", {
      productId: product._id,
      quantity: 1,
    });

    if (res.status === 200) {
      alert("✅ Added to cart");
    }
    router.push("/cart")
  } catch (err: any) {
    console.log(err);
    alert(
      err?.response?.data?.message || "Add to cart failed ❌"
    );
  }
};
  const reviews = product.reviews ?? [];
const totalReviews = reviews.length;

const avgRating =
  totalReviews > 0
    ? (
        reviews.reduce(
          (sum: number, r: { rating: number }) => sum + r.rating,
          0
        ) / totalReviews
      ).toFixed(1)
    : "0";



  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-xl transition cursor-pointer"
      onClick={openProduct}
    >
      {/* ================= ✅ FIXED IMAGE BOX ================= */}
      <div className="relative w-full h-[220px] bg-gray-100 overflow-hidden flex items-center justify-center">

        {/* ✅ IMAGE FIXED – SIZE CHANGE NAHI HOGA */}
        <div className="relative w-[90%] h-[90%]">
          <Image
            src={images[current]}
            alt={product.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>

        {/* ✅ LEFT BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white z-10"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* ✅ RIGHT BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white z-10"
        >
          <FaChevronRight size={14} />
        </button>

        {/* ✅ DOTS */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                current === i ? "bg-black" : "bg-black/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ================= PRODUCT INFO ================= */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm text-black line-clamp-1">
          {product.title}
        </h3>

        <p className="text-xs text-gray-500">
          {product.category}
        </p>

        <p className="font-bold text-lg text-green-600">
          ₹ {product.price}
        </p>

        {/* ⭐ REVIEWS */}
        <div className="flex items-center gap-1 text-yellow-500 text-sm">
  {[1, 2, 3, 4, 5].map((i) =>
    i <= Math.round(Number(avgRating)) ? (
      <FaStar key={i} />
    ) : (
      <FaStar key={i} className="opacity-30" />
    )
  )}
  <span className="text-gray-500 text-xs ml-1">
    {avgRating} ({totalReviews})
  </span>
</div>


        {/* 🏪 VENDOR */}
        <p className="text-xs text-gray-500">
          Sold by:{" "}
          <span className="font-medium text-gray-700">
            {product.vendor?.shopName || "Unknown Shop"}
          </span>
        </p>

        {/* ✅ ADD TO CART */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddToCart}
          className="w-full mt-3 bg-black text-white py-2 rounded-lg flex items-center 
                     justify-center gap-2 hover:bg-gray-900 transition"
        >
          <FaShoppingCart size={14} />
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}
