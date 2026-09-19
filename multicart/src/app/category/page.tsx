"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import UserProductCard from "@/component/userProductCard";
import { motion } from "framer-motion";

const categoryList = [
  { label: "all", icon: "🗂️" },
  { label: "Fashion & Lifestyle", icon: "👗" },
  { label: "Electronics & Gadgets", icon: "📱" },
  { label: "Home & Living", icon: "🏠" },
  { label: "Beauty & Personal Care", icon: "💄" },
  { label: "Toys, Kids & Baby", icon: "🧸" },
  { label: "Food & Grocery", icon: "🛒" },
  { label: "Sports & Fitness", icon: "🏀" },
  { label: "Automotive Accessories", icon: "🚗" },
  { label: "Gifts & Handcrafts", icon: "🎁" },
  { label: "Books & Stationery", icon: "📚" },
];

export default function CategoriesPage() {
  const { allVendorData } = useSelector((state: RootState) => state.vendor);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShop, setSelectedShop] = useState("all");
  const [search, setSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");

  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);


  // ✅ URL se category read (CLIENT ONLY)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
    setIsReady(true); // ✅ IMPORTANT
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append("query", search);
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      setApiProducts(data.products || []);
      setDisplayProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
  if (!isReady) return; // ⛔ STOP early call
  fetchProducts();
}, [selectedCategory, search, isReady]);


  useEffect(() => {
    if (selectedShop === "all") {
      setDisplayProducts(apiProducts);
    } else {
      setDisplayProducts(
        apiProducts.filter(
          (p: any) => String(p.vendor?._id) === String(selectedShop)
        )
      );
    }
  }, [selectedShop, apiProducts]);

  const filteredShops = useMemo(() => {
    if (!shopSearch) return [];
    return allVendorData.filter((v: any) =>
      v.shopName.toLowerCase().includes(shopSearch.toLowerCase())
    );
  }, [shopSearch, allVendorData]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Browse Products by Categories
        </h1>
        <p className="text-gray-300 text-sm">
          Filter by category, shop or search your favorite
          product
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ✅ LEFT SIDEBAR */}
        <div className="md:col-span-1 bg-white/10 border border-white/20 rounded-xl p-4 space-y-6">

          {/* 🔍 SEARCH */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product..."
            className="w-full px-3 py-2 rounded bg-black border border-white/20"
          />

          {/* 📁 CATEGORY */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoryList.map((cat) => (
              <button
                key={cat.label}
                onClick={() => {
                  setSelectedCategory(cat.label);
                  setSelectedShop("all"); // ✅ reset shop
                }}
                className={`w-full flex gap-2 px-3 py-2 rounded ${
                  selectedCategory === cat.label
                    ? "bg-blue-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* 🏪 SHOP SEARCH */}
          <input
            value={shopSearch}
            onChange={(e) =>
              setShopSearch(e.target.value)
            }
            placeholder="Search shop..."
            className="w-full px-3 py-2 rounded bg-black border border-white/20"
          />

          {shopSearch && (
            <div className="bg-black border border-white/20 rounded max-h-48 overflow-y-auto">
              {filteredShops.map((v: any) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setSelectedShop(v._id);
                    setShopSearch(v.shopName);
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-white/10"
                >
                  {v.shopName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ✅ PRODUCTS GRID */}
        <div className="md:col-span-3">
          {loading ? (
            <p className="text-center mt-20 text-gray-400">
              Loading...
            </p>
          ) : displayProducts.length === 0 ? (
            <p className="text-center mt-20 text-gray-400">
              No products found
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayProducts.map((product: any) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <UserProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
