"use client";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import { motion } from "framer-motion";
import UserProductCard from "./userProductCard";


export default function ProductsPageForUserInterface() {
 
  const { allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );

  // ✅ ONLY ACTIVE + APPROVED PRODUCTS
  const visibleProducts = useMemo(() => {
    if (!Array.isArray(allProductsData)) return [];
    return allProductsData.filter(
      (p: any) =>
        p.isActive === true && p.verificationStatus === "approved"
    );
  }, [allProductsData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-6"
    >
      {/* ✅ PAGE HEADING */}
      <div className="max-w-7xl mx-auto mb-13 text-center">
  <h1 className="text-2xl sm:text-3xl font-bold text-white">
    Explore Verified & Trending Products
  </h1>
  <p className="text-gray-200 text-sm">
    Shop only from approved sellers with guaranteed quality
  </p>
</div>

      {/* ✅ PRODUCT GRID */}
      <div className="max-w-7xl mx-auto">
        {visibleProducts.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No products available right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product: any) => (
              <UserProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
