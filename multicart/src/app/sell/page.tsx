"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginRequired from "@/component/auth/LoginRequired";
import EditRolePhone from "@/component/editRolePhone";

export default function SellPage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <LoginRequired
        callbackUrl="/sell"
        title="Sign in to sell on MultiCart"
        description="Create a customer account first, then submit your seller details for marketplace verification."
      />
    );
  }

  if (session.user.role === "vendor") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center shadow-2xl">
          <h1 className="text-3xl font-bold">You are already a seller</h1>
          <p className="mt-3 text-gray-400">
            Open your MultiCart dashboard to manage products, orders, and
            settlement information.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Open Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (session.user.role === "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center shadow-2xl">
          <h1 className="text-3xl font-bold">Admin account detected</h1>
          <p className="mt-3 text-gray-400">
            Admin accounts are not converted into vendor accounts.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Return to MultiCart
          </button>
        </div>
      </div>
    );
  }

  return <EditRolePhone />;
}
