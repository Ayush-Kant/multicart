"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IUser } from "@/models/user.model";
import { motion } from "framer-motion";
import getAllVendorData from "@/hooks/getAllVendorData";


export default function ShopsPage() {
  const router = useRouter();
 
getAllVendorData()

  const allVendorData: IUser[] = useSelector(
    (state: RootState) => state.vendor.allVendorData
  );

  if (!allVendorData || allVendorData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        No Shops Found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black px-4 py-6"
    >
      {/* ✅ SAME HEADING STRUCTURE AS PRODUCTS PAGE */}
      <div className="max-w-7xl mx-auto mb-13 text-center ">
  <h1 className="text-2xl sm:text-3xl font-bold text-white">
    Explore Trusted Shops & Verified Sellers
  </h1>
  <p className="text-gray-300 text-sm">
    Discover verified vendors, authentic stores & their exclusive products
  </p>
</div>

      {/* ✅ SAME GRID WRAPPER AS PRODUCTS PAGE */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {allVendorData.map((vendor, i) => (
            <motion.div
              key={String(vendor._id)}

              /* ✅ WHILE IN VIEW ANIMATION */
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ scale: 1.05 }}

              onClick={() => router.push(`/shop-details/${vendor._id}`)}
              className="bg-white text-black rounded-2xl p-4 cursor-pointer 
                         border border-gray-200
                         hover:border-transparent
                         hover:shadow-2xl transition-all duration-300"
            >
              {/* ✅ SHOP IMAGE */}
              {/* ✅ SHOP IMAGE */}
<div className="relative w-full aspect-[4/3] mb-3 overflow-hidden rounded-xl bg-gray-200">
  <Image
    src={vendor.image || "/shop.png"}
    alt={vendor.shopName || "Shop"}
    fill
    className="object-cover"
  />
</div>


              {/* ✅ SHOP NAME */}
              <h2 className="font-semibold text-center text-lg">
                {vendor.shopName || "Unnamed Shop"}
              </h2>

              {/* ✅ BUSINESS ADDRESS */}
              <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
                {vendor.businessAddress || "No Address"}
              </p>

              {/* ✅ STATUS BADGE */}
              <div className="flex justify-center mt-2">
                <span
                  className={`text-[10px] px-3 py-1 rounded-full font-medium ${
                    vendor.verificationStatus === "approved"
                      ? "bg-green-100 text-green-700"
                      : vendor.verificationStatus === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {vendor.verificationStatus}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
