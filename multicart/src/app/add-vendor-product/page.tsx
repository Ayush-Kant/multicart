"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiUpload } from "react-icons/fi";
import axios from "axios";

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

export default function AddProduct() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // ✅ Wearable
  const [isWearable, setIsWearable] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);

  // ✅ NEW POLICY STATES
  const [replacementDays, setReplacementDays] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [warranty, setWarranty] = useState("");
  const [payOnDelivery, setPayOnDelivery] = useState(false);

   const [detailPoints, setDetailPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState("");
  const [pointIndex, setPointIndex] = useState(0);

  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [image4, setImage4] = useState<File | null>(null);

  const [preview1, setPreview1] = useState("");
  const [preview2, setPreview2] = useState("");
  const [preview3, setPreview3] = useState("");
  const [preview4, setPreview4] = useState("");

  const [loading, setLoading] = useState(false);

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    );
  };

    // ✅ ADD DETAIL POINT WITH INDEX
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

  // ✅ SUBMIT
  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !price ||
      !stock ||
      !category ||
      !image1 ||
      !image2 ||
      !image3 ||
      !image4
    ) {
      alert("All fields & 4 images are required");
      return;
    }

    if (isWearable && sizes.length === 0) {
      alert("Please select at least one size");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
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

      // ✅ NEW POLICY FIELDS
      formData.append("replacementDays", replacementDays);
      formData.append("freeDelivery", String(freeDelivery));
      formData.append("warranty", warranty);
      formData.append("payOnDelivery", String(payOnDelivery));

        // ✅ SEND DETAIL POINTS ARRAY
      detailPoints.forEach((point) =>
        formData.append("detailsPoints", point)
      );


      formData.append("image1", image1);
      formData.append("image2", image2);
      formData.append("image3", image3);
      formData.append("image4", image4);

      await axios.post("/api/vendor/add-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Product added successfully. Waiting for admin approval.");
      router.push("/");

    } catch (error: any) {
      console.log("ADD PRODUCT ERROR:", error);
      alert(error?.response?.data?.message || "❌ Product add failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 pt-20 pb-10">
      <motion.div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-6 sm:p-10 rounded-2xl border border-white/20 shadow-xl">

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Add New Product</h1>

        {/* BASIC INPUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className="p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Product Title"
            value={title} onChange={(e) => setTitle(e.target.value)} />

          <input className="p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Price" type="number"
            value={price} onChange={(e) => setPrice(e.target.value)} />

          <input className="p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Stock Quantity" type="number"
            value={stock} onChange={(e) => setStock(e.target.value)} />

          <select className="p-3 bg-white/10 border border-white/20 rounded text-white"
            value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="" className="bg-gray-800">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
            ))}
          </select>
        </div>

        {category === "Others" && (
          <input className="mt-4 w-full p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Enter Custom Category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        )}

        <textarea className="w-full mt-4 p-3 bg-white/10 border border-white/20 rounded"
          rows={4} placeholder="Product Description"
          value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* ✅ WEARABLE */}
        <div className="flex items-center gap-3 mt-5">
          <input type="checkbox" checked={isWearable}
            onChange={() => setIsWearable(!isWearable)} className="w-5 h-5" />
          <span className="text-sm">This is a wearable / clothing product</span>
        </div>

        {isWearable && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Select Sizes</p>
            <div className="flex flex-wrap gap-3">
              {sizeOptions.map((size) => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
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

        {/* ✅ NEW POLICY OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <input className="p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Replacement Days (e.g. 7)"
            type="number"
            value={replacementDays}
            onChange={(e) => setReplacementDays(e.target.value)}
          />

          <input className="p-3 bg-white/10 border border-white/20 rounded"
            placeholder="Warranty (e.g. 1 Year)"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={freeDelivery}
              onChange={() => setFreeDelivery(!freeDelivery)} />
            <span className="text-sm">Free Delivery</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={payOnDelivery}
              onChange={() => setPayOnDelivery(!payOnDelivery)} />
            <span className="text-sm">Cash on Delivery</span>
          </label>
        </div>

        {/* ✅ IMAGES */}
        <h3 className="mt-6 mb-3 font-semibold">Upload 4 Images</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => {
            const previews = [preview1, preview2, preview3, preview4];
            const setters = [setImage1, setImage2, setImage3, setImage4];
            const previewSetters = [setPreview1, setPreview2, setPreview3, setPreview4];

            return (
              <div key={n}>
                <input type="file" hidden id={`img${n}`} accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setters[n - 1](f);
                    previewSetters[n - 1](URL.createObjectURL(f));
                  }}
                />
                <label htmlFor={`img${n}`}
                  className="cursor-pointer block bg-gray-800 p-2 rounded text-center h-28 flex items-center justify-center border border-white/20">
                  {previews[n - 1] ? (
                    <Image src={previews[n - 1]} alt="img" width={120} height={120}
                      className="w-full h-full object-cover rounded" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 text-xs">
                      <FiUpload size={22} />
                      <span>Image {n}</span>
                    </div>
                  )}
                </label>
              </div>
            );
          })}
        </div>
         <div className="mt-6">
          <p className="font-semibold mb-2">Product Detail Points</p>

          <div className="flex gap-2">
            <input
              className="flex-1 p-3 bg-white/10 border border-white/20 rounded"
              placeholder={`Point ${pointIndex + 1}`}
              value={currentPoint}
              onChange={(e) => setCurrentPoint(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddPoint}
              className="px-4 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
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
                  <span className="text-sm">
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

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={handleSubmit} disabled={loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
        >
          {loading ? "Adding..." : "Add Product"}
        </motion.button>

      </motion.div>
    </motion.div>
  );
}
