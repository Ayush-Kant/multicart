"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RootState } from "@/redux/store";
import { setAllProductsData } from "@/redux/vendorSlice";
import getAllProductsData from "@/hooks/getAllProductsData";
import getCurrentUser from "@/hooks/getCurrentUser";

export default function VendorProducts() {
  const router = useRouter();
  const dispatch = useDispatch();
  getAllProductsData()
  getCurrentUser()
 const currentUser = useSelector(
    (state: RootState) => state.user.userData
  );
  
     

  const { allProductsData } = useSelector((state: RootState) => state.vendor);
 

  const [loadingId, setLoadingId] = useState<string | null>(null);

    const myProducts =
    currentUser?._id && allProductsData?.length
      ? allProductsData.filter(
          (product: any) =>
            product.vendor === currentUser._id ||
            product.vendor?._id === currentUser._id
        )
      : [];

  // ✅ ENABLE / DISABLE HANDLER
  const toggleProductStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      setLoadingId(productId);

      const res = await axios.post(
        "/api/vendor/active-product",
        {
          productId,
          isActive: !currentStatus,
        }
      );

      // ✅ Update Redux instantly
      const updatedProducts = allProductsData.map((p: any) =>
        p._id === productId ? res.data.product : p
      );

      dispatch(setAllProductsData(updatedProducts));

      setLoadingId(null);
    } catch (error: any) {
      setLoadingId(null);
      alert(error?.response?.data?.message || "Status update failed ❌");
    }
  };

  return (
    <div className="w-full p-4 sm:p-8 text-white">
      {/* ✅ HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Products</h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/add-vendor-product")}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold text-sm sm:text-base"
        >
          + Add Product
        </motion.button>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden sm:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Active</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {myProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No Products Found
                </td>
              </tr>
            ) : (
              myProducts.map((product: any) => (
                <tr key={product._id} className="border-t border-white/10">
                  <td className="p-4">
                    <Image
                      src={product.image1}
                      alt="product"
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                  </td>

                  <td className="p-4">{product.title}</td>
                  <td className="p-4">₹ {product.price}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        product.verificationStatus === "approved"
                          ? "bg-green-500/30 text-green-300"
                          : product.verificationStatus === "pending"
                          ? "bg-yellow-500/30 text-yellow-300"
                          : "bg-red-500/30 text-red-300"
                      }`}
                    >
                      {product.verificationStatus}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`text-sm ${
                        product.isActive
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="p-4 text-center space-x-2">
                    <button
                      
                      className="px-3 py-1 rounded text-sm 
                        bg-purple-600 hover:bg-purple-700"
                          onClick={()=>router.push(`/update-product/${product._id}`)}
                      
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        toggleProductStatus(
                          product._id,
                          product.isActive
                        )
                      }
                      disabled={
                        product.verificationStatus !== "approved" ||
                        loadingId === product._id
                      }
                      className={`px-3 py-1 rounded text-sm ${
                        product.verificationStatus === "approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {loadingId === product._id
                        ? "Updating..."
                        : product.isActive
                        ? "Disable"
                        : "Enable"}
                    </button>

                    {/* ✅ REJECT NOTE */}
                    {product.verificationStatus === "rejected" && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2 rounded">
                        <p>
                          <b>Rejected:</b>{" "}
                          {product.rejectedReason || "No reason provided"}
                        </p>
                        <p className="mt-1 text-yellow-300">
                          ✏ After edit, product will be sent for re-verification.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="sm:hidden space-y-4">
        {myProducts.map((product: any) => (
          <motion.div
            key={product._id}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 rounded-xl p-4 border border-white/20 shadow"
          >
            <div className="flex items-center gap-3">
              <Image
                src={product.image1}
                alt="product"
                width={60}
                height={60}
                className="rounded"
              />

              <div>
                <h2 className="font-semibold">{product.title}</h2>
                <p className="text-sm text-gray-300">₹ {product.price}</p>
              </div>
            </div>

            <div className="mt-3 text-sm space-y-1">
              <p>
                <b>Status:</b>{" "}
                <span className="text-yellow-400">
                  {product.verificationStatus}
                </span>
              </p>

              <p>
                <b>Active:</b>{" "}
                <span
                  className={
                    product.isActive
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {product.isActive ? "Yes" : "No"}
                </span>
              </p>
            </div>

            {product.verificationStatus === "rejected" && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2 rounded">
                <p>
                  <b>Rejected:</b>{" "}
                  {product.rejectedReason || "No reason provided"}
                </p>
                <p className="mt-1 text-yellow-300">
                  ✏ After edit, product will be sent for re-verification.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                
                className="flex-1 py-2 rounded text-sm 
                  bg-purple-600"
                   
                onClick={()=>router.push(`/update-product/${product._id}`)}
              >
                Edit
              </button>

              <button
                onClick={() =>
                  toggleProductStatus(product._id, product.isActive)
                }
                disabled={
                  product.verificationStatus !== "approved" ||
                  loadingId === product._id
                }
                className={`flex-1 py-2 rounded text-sm ${
                  product.verificationStatus === "approved"
                    ? "bg-green-600"
                    : "bg-gray-600"
                }`}
              >
                {loadingId === product._id
                  ? "Updating..."
                  : product.isActive
                  ? "Disable"
                  : "Enable"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
