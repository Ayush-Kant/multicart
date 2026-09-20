"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

type Payout = {
  _id: string;
  payoutReference: string;
  grossAmount: number;
  platformFee: number;
  vendorAmount: number;
  status: string;
  mode: string;
  provider: string;
  payoutDate?: string;
  createdAt: string;
  vendor?: {
    name?: string;
    email?: string;
    shopName?: string;
  };
  order?: {
    totalAmount?: number;
    paymentMethod?: string;
    orderStatus?: string;
  };
  destination?: {
    accountHolderName?: string;
    bankName?: string;
    accountLast4?: string;
    ifscCode?: string;
  };
};

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totals, setTotals] = useState({
    gross: 0,
    platformFees: 0,
    paidOut: 0,
    pending: 0,
    reversed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPayouts = async () => {
      try {
        const res = await axios.get("/api/admin/payouts");
        setPayouts(res.data.payouts || []);
        setTotals(
          res.data.totals || {
            gross: 0,
            platformFees: 0,
            paidOut: 0,
            pending: 0,
            reversed: 0,
          }
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Unable to load payout settlements."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPayouts();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-white">
        Loading payout settlements...
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-8 text-white">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Vendor Payouts
        </h1>
        <p className="text-sm text-gray-400">
          Demo marketplace settlement ledger. No bank transfer is executed.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Gross Sales" value={totals.gross} />
        <Stat label="Platform Fees" value={totals.platformFees} />
        <Stat label="Paid Out" value={totals.paidOut} />
        <Stat label="Pending" value={totals.pending} />
        <Stat label="Reversed" value={totals.reversed} />
      </div>

      <div className="hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Platform Fee</th>
              <th className="p-4">Vendor Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-gray-400"
                >
                  No payout settlements yet.
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr
                  key={payout._id}
                  className="border-t border-white/10"
                >
                  <td className="p-4 text-xs">
                    {payout.payoutReference}
                  </td>
                  <td className="p-4">
                    <div>{payout.vendor?.shopName || payout.vendor?.name}</div>
                    <div className="text-xs text-gray-400">
                      {payout.vendor?.email}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div>
                      {payout.destination?.bankName || "Demo bank"}
                    </div>
                    <div className="text-xs text-gray-400">
                      A/C •••• {payout.destination?.accountLast4 || "----"}
                    </div>
                  </td>
                  <td className="p-4">₹ {payout.grossAmount}</td>
                  <td className="p-4 text-yellow-300">
                    ₹ {payout.platformFee}
                  </td>
                  <td className="p-4 font-semibold text-green-300">
                    ₹ {payout.vendorAmount}
                  </td>
                  <td className="p-4 capitalize">
                    <span
                      className={
                        payout.status === "paid"
                          ? "text-green-400"
                          : payout.status === "reversed"
                          ? "text-orange-400"
                          : "text-yellow-400"
                      }
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {formatDate(payout.payoutDate || payout.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {payouts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No payout settlements yet.
          </div>
        ) : (
          payouts.map((payout) => (
            <motion.div
              key={payout._id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">
                    {payout.payoutReference}
                  </p>
                  <p className="font-semibold">
                    {payout.vendor?.shopName || payout.vendor?.name}
                  </p>
                </div>
                <span className="capitalize text-green-400 font-semibold">
                  {payout.status}
                </span>
              </div>

              <p className="text-sm text-gray-300">
                {payout.destination?.bankName || "Demo bank"} · A/C ••••
                {" "}
                {payout.destination?.accountLast4 || "----"}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 text-sm">
                <div>
                  <p className="text-gray-500">Gross</p>
                  <p>₹{payout.grossAmount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fee</p>
                  <p className="text-yellow-300">
                    ₹{payout.platformFee}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="text-green-300">
                    ₹{payout.vendorAmount}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {formatDate(payout.payoutDate || payout.createdAt)}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="text-lg font-bold mt-1">₹ {value}</p>
    </div>
  );
}
