"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FaStar, FaRegStar } from "react-icons/fa";
import UserProductCard from "@/component/userProductCard";
import { IProduct } from "@/models/product.model";
import getAllProductsData from "@/hooks/getAllProductsData";
import { FaUserCircle } from "react-icons/fa";

import axios from "axios";


export default function ProductViewPage() {
  const params = useParams();
  const id = params.id;
  getAllProductsData()
  const router = useRouter()
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const { allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );

  const [activeImage, setActiveImage] = useState(0);

  // ✅ DIRECT FIND (NO useMemo)
  const product: IProduct | undefined = allProductsData?.find(
    (p: IProduct) => String(p._id) === String(id)
  );

  // ✅ Loading
  if (!allProductsData || allProductsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <h1 className="text-xl">Loading products...</h1>
      </div>
    );
  }

  // ✅ Not Found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <h1 className="text-xl">❌ Product Not Found</h1>
      </div>
    );
  }

  const images = [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
  ].filter(Boolean);

  // ✅ DEMO RATING (later API se aayega)
 const totalReviews = product.reviews?.length ?? 0;

const avgRating =
  totalReviews > 0
    ? (
        product.reviews!.reduce(
          (sum: number, r: { rating: number }) => sum + r.rating,
          0
        ) / totalReviews
      ).toFixed(1)
    : "0";


  // ✅ RELATED PRODUCTS (CATEGORY ke basis par)
  const relatedProducts =
    allProductsData?.filter(
      (p) => p?.category === product?.category && p?._id !== product?._id
    ) || [];


  const handleAddToCart = async () => {
    if (!product?._id) return;

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

  const submitReview = async () => {
  if (!reviewRating || !reviewComment) {
    alert("Rating and comment are required");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("productId", String(product._id));
    formData.append("rating", String(reviewRating));
    formData.append("comment", reviewComment);

    if (reviewImage) {
      formData.append("image", reviewImage);
    }

    await axios.post("/api/product/add-review", formData);

    alert("✅ Review added successfully");
    router.refresh(); // reload product data

    setReviewRating(0);
    setReviewComment("");
    setReviewImage(null);
    setPreview(null);

  } catch (err: any) {
    alert(err?.response?.data?.message || "Failed to add review");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ================== ✅ TOP SECTION (LEFT + RIGHT) ================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ✅ LEFT: IMAGE GALLERY */}
          <div className="flex flex-col md:flex-col lg:flex-row gap-4">

            {/* ✅ MAIN IMAGE BOX */}
            <div className="relative w-full lg:w-[450px] h-[420px] bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
              <Image
                src={images[activeImage]}
                alt={product.title}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* ✅ THUMBNAILS */}
            <div className="flex flex-row lg:flex-col gap-3 justify-center">
              {images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 border rounded cursor-pointer overflow-hidden flex items-center justify-center hover:scale-[110%] transition-all  ${activeImage === i
                      ? "border-blue-600"
                      : "border-white/20"
                    }`}
                >
                  <Image
                    src={img}
                    alt={product.title}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ✅ RIGHT: BASIC PRODUCT INFO */}
          <div>
            <h1 className="text-3xl text-white font-bold mb-3">{product.title}</h1>
            <p className="text-gray-400 mb-2">{product.category}</p>

            <p className="text-2xl text-green-500 font-bold">
              ₹ {product.price}
            </p>

            {/* ✅ ✅ RATING BELOW PRICE */}
            <div className="flex items-center gap-2 mt-1 mb-4">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) =>
                  i <= Math.round(Number(avgRating)) ? (
                    <FaStar key={i} />
                  ) : (
                    <FaRegStar key={i} />
                  )
                )}
              </div>
              <span className="text-sm text-gray-400">
                ({avgRating} • {totalReviews} reviews)
              </span>
            </div>


            <p className="mb-4 text-gray-300">{product.description}</p>

            {/* ✅ STOCK */}
            <p className="mb-3 text-gray-50">
              Stock:{" "}
              <span
                className={
                  product.stock > 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {product.stock > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </p>

            {/* ✅ BUTTON */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold transition" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>

        {/* ================== ✅ BOTTOM SECTION (OTHER DETAILS) ================== */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-lg p-6">

          {/* ✅ WEARABLE SIZES */}
          {product.isWearable === true &&
            Array.isArray(product.sizes) &&
            product.sizes.length > 0 && (
              <div className="mb-5">
                <p className="font-semibold mb-2 text-white">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <span
                      key={s}
                      className="px-3 py-1 border bg-white border-white/20 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* ✅ POLICIES */}
          <div className="space-y-2 mb-6 text-gray-300">
            {typeof product.replacementDays === "number" &&
              product.replacementDays > 0 && (
                <p>✅ {product.replacementDays} Days Replacement</p>
              )}

            {product.freeDelivery === true && (
              <p>✅ Free Delivery</p>
            )}

            {product.payOnDelivery === true && (
              <p>✅ Cash on Delivery Available</p>
            )}

            {product.warranty &&
              product.warranty !== "No Warranty" && (
                <p>✅ Warranty: {product.warranty} year</p>
              )}
          </div>

          {/* ✅ DETAIL POINTS */}
          {Array.isArray(product.detailsPoints) &&
            product.detailsPoints.length > 0 && (
              <div className="mb-6">
                <p className="font-semibold mb-2 text-white">Highlights</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  {product.detailsPoints.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* ================== ✅ RELATED PRODUCTS ================== */}
        {/* ================== ✅ RELATED PRODUCTS ================== */}
        {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-5 text-white">
              Related Products
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {relatedProducts.slice(0, 8).map((rp) => (
                <UserProductCard
                  key={rp._id?.toString()}
                  product={rp}
                />
              ))}

            </div>
          </div>
        )}


      </div>
      {/* ================== ✅ REVIEWS SECTION ================== */}
      <div className="mt-16 lg:p-40 md:p-8">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Customer Reviews
        </h2>

        {/* ⭐ ADD REVIEW FORM */}
        <div className="mb-8">
          <p className="text-white font-semibold mb-2">Add Your Review</p>

          {/* ⭐ Rating */}
          <div className="flex gap-2 mb-3 text-yellow-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                onClick={() => setReviewRating(i)}
                className="cursor-pointer"
              >
                {i <= reviewRating ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>

          {/* 💬 Comment */}
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-3 rounded bg-black text-white border border-white/20 mb-3"
          />

          {/* 🖼️ Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setReviewImage(file);
                setPreview(URL.createObjectURL(file));
              }
            }}
            className="mb-3 text-white"
          />

          {/* 🖼️ Preview */}
          {preview && (
            <Image
              src={preview}
              alt="Preview"
              width={100}
              height={100}
              className="rounded mb-3"
            />
          )}

          {/* 🚀 Submit */}
          <button
            onClick={submitReview}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>

        {/* 📄 EXISTING REVIEWS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {product.reviews && product.reviews.length > 0 ? (
    product.reviews.map((r, i) => (
      <div
        key={i}
        className="bg-black/20 border border-white/10 rounded-xl p-5"
      >
        {/* 👤 USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black">
  {typeof r.user === "object" && r.user.image ? (
    <Image
      src={r.user.image}
      alt={r.user.name || "User"}
      width={40}
      height={40}
      className="rounded-full object-cover"
    />
  ) : (
    <FaUserCircle className="text-gray-400 w-8 h-8" />
  )}
</div>


          <div>
            <p className="text-white font-semibold text-sm">
              {typeof r.user === "object" ? r.user.name : "User"}
            </p>

            {/* ⭐ RATING */}
            <div className="flex text-yellow-400 text-sm">
              {[1, 2, 3, 4, 5].map((i) =>
                i <= r.rating ? (
                  <FaStar key={i} />
                ) : (
                  <FaRegStar key={i} />
                )
              )}
            </div>
          </div>
        </div>

        {/* 💬 COMMENT */}
        <p className="text-gray-300 text-sm mb-3">
          {r.comment}
        </p>

        {/* 🖼️ REVIEW IMAGE (OPTIONAL) */}
       {r.image && (
  <div className="w-[180px] h-[180px] border border-white/10 rounded-lg overflow-hidden bg-black">
    <Image
      src={r.image}
      alt="Review Image"
      width={180}
      height={180}
      className="object-contain"
    />
  </div>
)}

      </div>
    ))
  ) : (
    <p className="text-gray-400">No reviews yet.</p>
  )}
</div>

      </div>

    </div>
  );
}
