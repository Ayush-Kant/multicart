"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FiUpload } from "react-icons/fi";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IProduct } from "@/models/product.model";

const categories = [
  "Fashion & Lifestyle",
  "Electronics & Gadgets",
  "Home & Living",
  "Beauty & Personal Care",
  "Toys, Kids & Baby",
  "Food & Grocery",
  "Sports & Fitness",
  "Automotive Accessories",
  "Gifts & Handcrafts",
  "Books & Stationery",
  "Others",
];

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

export default function UpdateProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );

  const product: IProduct | undefined = allProductsData?.find(
    (p: any) => String(p._id) === String(productId)
  );

  // ✅ BASIC
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // ✅ WEARABLE
  const [isWearable, setIsWearable] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);

  // ✅ POLICIES
  const [replacementDays, setReplacementDays] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [warranty, setWarranty] = useState("");
  const [payOnDelivery, setPayOnDelivery] = useState(false);

  // ✅ DETAIL POINTS
  const [detailPoints, setDetailPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState("");
  const [pointIndex, setPointIndex] = useState(0);

  // ✅ IMAGES
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [image4, setImage4] = useState<File | null>(null);

  const [preview1, setPreview1] = useState("");
  const [preview2, setPreview2] = useState("");
  const [preview3, setPreview3] = useState("");
  const [preview4, setPreview4] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ ✅ ✅ PREFILL FROM REDUX
  useEffect(() => {
    if (!product) return;

    setTitle(product.title);
    setDescription(product.description);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category);

    setIsWearable(Boolean(product.isWearable));
    setSizes(product.sizes || []);

    setReplacementDays(
      product.replacementDays ? String(product.replacementDays) : ""
    );
    setFreeDelivery(Boolean(product.freeDelivery));
    setWarranty(product.warranty || "");
    setPayOnDelivery(Boolean(product.payOnDelivery));

    setDetailPoints(product.detailsPoints || []);
    setPointIndex(product.detailsPoints?.length || 0);

    setPreview1(product.image1);
    setPreview2(product.image2);
    setPreview3(product.image3);
    setPreview4(product.image4);
  }, [product]);

  // ✅ SIZE TOGGLE
  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    );
  };

  // ✅ ADD DETAIL POINT
  const handleAddPoint = () => {
    if (!currentPoint.trim()) return;

    setDetailPoints((prev) => {
      const updated = [...prev];
      updated[pointIndex] = currentPoint;
      return updated;
    });

    setCurrentPoint("");
    setPointIndex((prev) => prev + 1);
  };

  // ✅ REMOVE DETAIL POINT
  const handleRemovePoint = (i: number) => {
    setDetailPoints((prev) => prev.filter((_, index) => index !== i));
  };

  // ✅ ✅ UPDATE SUBMIT
  const handleSubmit = async () => {
    if (!title || !description || !price || !stock || !category) {
      alert("All required fields must be filled");
      return;
    }

    if (isWearable && sizes.length === 0) {
      alert("Please select at least one size");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("productId", productId);

      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append(
        "category",
        category === "Others" ? customCategory : category
      );

      formData.append("isWearable", String(isWearable));
      sizes.forEach((size) => formData.append("sizes", size));

      formData.append("replacementDays", replacementDays);
      formData.append("freeDelivery", String(freeDelivery));
      formData.append("warranty", warranty);
      formData.append("payOnDelivery", String(payOnDelivery));

      detailPoints.forEach((point) =>
        formData.append("detailsPoints", point)
      );

      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      await axios.put("/api/vendor/update-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Product updated & sent for re-approval");
      router.push("/");

    } catch (err: any) {
      alert(err?.response?.data?.message || "❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading product...
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 pt-20 pb-10">
      <motion.div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-6 sm:p-10 rounded-2xl border border-white/20 shadow-xl">

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          Update Product
        </h1>

        {/* ✅ BASIC INPUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className="p-3 bg-white/10 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input className="p-3 bg-white/10 border rounded"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input className="p-3 bg-white/10 border rounded"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <select className="p-3 bg-white/10 border rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {category === "Others" && (
          <input
            className="mt-4 w-full p-3 bg-white/10 border rounded"
            placeholder="Enter Custom Category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        )}

        <textarea
          className="w-full mt-4 p-3 bg-white/10 border rounded"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* ✅ WEARABLE */}
        <div className="flex items-center gap-3 mt-5">
          <input
            type="checkbox"
            checked={isWearable}
            onChange={() => setIsWearable(!isWearable)}
            className="w-5 h-5"
          />
          <span className="text-sm">
            This is a wearable / clothing product
          </span>
        </div>

        {isWearable && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Select Sizes</p>
            <div className="flex flex-wrap gap-3">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-1 rounded-full border ${
                    sizes.includes(size)
                      ? "bg-blue-600 border-blue-500"
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ✅ POLICY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <input
            className="p-3 bg-white/10 border rounded"
            placeholder="Replacement Days"
            type="number"
            value={replacementDays}
            onChange={(e) => setReplacementDays(e.target.value)}
          />
          <input
            className="p-3 bg-white/10 border rounded"
            placeholder="Warranty"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeDelivery}
              onChange={() => setFreeDelivery(!freeDelivery)}
            />
            <span className="text-sm">Free Delivery</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={payOnDelivery}
              onChange={() => setPayOnDelivery(!payOnDelivery)}
            />
            <span className="text-sm">Cash on Delivery</span>
          </label>
        </div>

        {/* ✅ IMAGES */}
        <h3 className="mt-6 mb-3 font-semibold">Update Images</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[preview1, preview2, preview3, preview4].map((img, i) => {
            const setters = [setImage1, setImage2, setImage3, setImage4];
            const previewSetters = [
              setPreview1,
              setPreview2,
              setPreview3,
              setPreview4,
            ];

            return (
              <div key={i}>
                <input
                  type="file"
                  hidden
                  id={`updimg${i}`}
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setters[i](f);
                    previewSetters[i](URL.createObjectURL(f));
                  }}
                />
                <label
                  htmlFor={`updimg${i}`}
                  className="cursor-pointer block bg-gray-800 p-2 rounded text-center h-28 flex items-center justify-center border border-white/20"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt="img"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 text-xs">
                      <FiUpload size={22} />
                      <span>Image {i + 1}</span>
                    </div>
                  )}
                </label>
              </div>
            );
          })}
        </div>

        {/* ✅ DETAIL POINTS */}
        <div className="mt-6">
          <p className="font-semibold mb-2">Product Detail Points</p>

          <div className="flex gap-2">
            <input
              className="flex-1 p-3 bg-white/10 border rounded"
              value={currentPoint}
              onChange={(e) => setCurrentPoint(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddPoint}
              className="px-4 bg-blue-600 rounded"
            >
              Add
            </button>
          </div>

          {detailPoints.length > 0 && (
            <ul className="mt-3 space-y-2">
              {detailPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-white/10 p-2 rounded"
                >
                  <span>
                    {i + 1}. {point}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(i)}
                    className="text-red-400 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
        >
          {loading ? "Updating..." : "Update Product"}
        </motion.button>

      </motion.div>
    </motion.div>
  );
}
