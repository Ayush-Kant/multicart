"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import AddressBook from "@/component/AddressBook";

export default function AddressesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-blue-400 text-xs uppercase tracking-[0.2em]">
              Account
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">
              My Addresses
            </h1>
            <p className="text-gray-400 mt-1">
              Save, edit and manage delivery addresses for faster checkout.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 transition"
            >
              <FaArrowLeft size={12} />
              Profile
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
            >
              <FaHome size={12} />
              Home
            </button>
          </div>
        </div>

        <AddressBook />
      </div>
    </main>
  );
}
