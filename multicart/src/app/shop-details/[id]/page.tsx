"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import { IUser } from "@/models/user.model";
import { IProduct } from "@/models/product.model";
import getAllVendorData from "@/hooks/getAllVendorData";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ✅ FETCH DATA ON PAGE LOAD
  
    getAllVendorData();
 

  const { allVendorData } = useSelector(
    (state: RootState) => state.vendor
  );

  const [loading, setLoading] = useState(true);

  // ✅ WAIT FOR REDUX DATA
  useEffect(() => {
    if (allVendorData && allVendorData.length > 0) {
      setLoading(false);
    }
  }, [allVendorData]);

  // ✅ LOADING UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading shop & products...
      </div>
    );
  }

  // ✅ FIND VENDOR AFTER DATA EXISTS
  const vendor: IUser | undefined = allVendorData.find(
    (v: IUser) => String(v._id) === String(id)
  );

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Vendor Not Found
      </div>
    );
  }

  // ✅ ✅ SAFE PRODUCTS ACCESS (IMPORTANT FIX)
  const vendorProducts: IProduct[] = Array.isArray(vendor.vendorProducts)
    ? vendor.vendorProducts
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">

      {/* ================== ✅ SHOP HEADER ================== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto mb-12 bg-white/10 backdrop-blur-xl p-6 
                   rounded-2xl border border-white/20 grid md:grid-cols-2 
                   gap-6 shadow-xl"
      >
        {/* IMAGE */}
        <div className="relative w-full h-60 overflow-hidden rounded-xl bg-black">
          <Image
            src={vendor.image || "/shop.png"}
            alt={vendor.shopName || "Shop"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* DETAILS */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-3">{vendor.shopName}</h1>

          <p className="text-gray-300 mb-2">
            {vendor.businessAddress}
          </p>

          <p className="text-sm text-gray-400 mb-1">
            GST: {vendor.gstNumber || "Not Provided"}
          </p>

          <span
            className={`inline-block mt-2 w-fit px-4 py-1 rounded-full text-sm ${
              vendor.verificationStatus === "approved"
                ? "bg-green-600/20 text-green-400"
                : vendor.verificationStatus === "pending"
                ? "bg-yellow-600/20 text-yellow-400"
                : "bg-red-600/20 text-red-400"
            }`}
          >
            {vendor.verificationStatus}
          </span>
        </div>
      </motion.div>

      {/* ================== ✅ PRODUCTS ================== */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">
          Products by {vendor.shopName}
        </h2>

        {vendorProducts.length === 0 ? (
          <p className="text-gray-400">
            No products added by this shop yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {vendorProducts.map((product: IProduct, i: number) => (
              <motion.div
                key={String(product._id)}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg 
                           hover:shadow-2xl transition overflow-hidden cursor-pointer"
                onClick={() =>
                  router.push(`/view-product/${product._id}`)
                }
              >
                {/* IMAGE */}
                <div className="relative w-full h-44 bg-gray-100">
                  <Image
                    src={product.image1}
                    alt={product.title}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                {/* INFO */}
                <div className="p-4 text-black space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {product.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-1">
                    {product.category}
                  </p>

                  <p className="font-bold text-green-600">
                    ₹ {product.price}
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      product.stock > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>

                  
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
