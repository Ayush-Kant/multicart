"use client";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IUser } from "@/models/user.model";

export default function Footer({ user }: { user: IUser }) {
  const router = useRouter();


  const role = user?.role; // "user" | "admin" | "vendor"

  const isUser = role === "user";
  const isAdminOrVendor = role === "admin" || role === "vendor";

  return (
    <footer className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] w-full text-gray-300 z-40 py-12 border-t border-gray-700">
      <div
        className={`max-w-7xl mx-auto px-6 grid gap-10 text-center md:text-left 
        ${isUser ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}
      >
        {/* ✅ BRAND SECTION - ALL */}
        <div className="space-y-3">
          <h2
            onClick={() => router.push("/")}
            className="text-white text-3xl font-bold cursor-pointer tracking-wide hover:text-blue-400 transition"
          >
            MultiCart
          </h2>

          <p className="text-sm leading-relaxed text-gray-400">
            Smart, secure & scalable multi-vendor eCommerce platform built for
            performance and growth.
          </p>

          {isAdminOrVendor && (
            <span
              className={`inline-block mt-2 text-[11px] px-3 py-1 rounded-full text-white
              ${role === "admin" ? "bg-blue-600" : "bg-green-600"}`}
            >
              {role === "admin" ? "Admin Panel" : "Vendor Dashboard"}
            </span>
          )}
        </div>

        {/* ✅ QUICK LINKS - ONLY USER */}
        {isUser && (
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li onClick={() => router.push("/")} className="cursor-pointer hover:text-white">Home</li>
              <li onClick={() => router.push("/category")} className="cursor-pointer hover:text-white">Categories</li>
              <li onClick={() => router.push("/shop")} className="cursor-pointer hover:text-white">Shop</li>
              <li onClick={() => router.push("/contact")} className="cursor-pointer hover:text-white">Contact</li>
            </ul>
          </div>
        )}

        {/* ✅ SUPPORT - ONLY USER */}
        {isUser && (
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li onClick={() => router.push("/support")} className="cursor-pointer hover:text-white">Support</li>
              <li onClick={() => router.push("/orders")} className="cursor-pointer hover:text-white">Track Order</li>
            </ul>
          </div>
        )}

        {/* ✅ ROLE INFO + VENDOR ACTIONS */}
        {isAdminOrVendor && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-lg border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-3">
              {role === "admin" ? "System Access" : "Vendor Dashboard"}
            </h3>

            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              {role === "admin" ? (
                <>
                  <li>✔ Platform Management</li>
                  <li>✔ Vendor Control</li>
                  <li>✔ Orders & Revenue</li>
                  <li>✔ System Security</li>
                </>
              ) : (
                <>
                  <li>✔ Product Upload & Edit</li>
                  <li>✔ Order & Delivery Tracking</li>
                  <li>✔ Sales & Profit Analytics</li>
                  <li>✔ Wallet & Settlement</li>
                </>
              )}
            </ul>

            
          </div>
        )}

        {/* ✅ CONTACT INFO - ALL */}
        <div className="space-y-2">
          <h3 className="text-white text-lg font-semibold mb-4">Contact Info</h3>
          <p className="text-sm">admin@multicart.com</p>
          <p className="text-sm">+91 98765 43210</p>
          <p className="text-sm">New Delhi, India</p>
        </div>
      </div>

      {/* ✅ BOTTOM BAR */}
      <div className="text-center text-xs text-gray-500 mt-12 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} MultiCart — Powered by Secure Commerce Engine
      </div>
    </footer>
  );
}
