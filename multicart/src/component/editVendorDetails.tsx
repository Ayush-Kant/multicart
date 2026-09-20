"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import {
  AiOutlineShop,
  AiOutlineHome,
  AiOutlineFileText,
  AiOutlineBank,
  AiOutlineUser,
} from "react-icons/ai";
import axios from "axios";
import {
  normalizeVendorOnboardingInput,
  validateVendorOnboardingInput,
  VendorValidationErrors,
} from "@/lib/vendor-validation";

const inputClass =
  "w-full bg-white/10 border border-white/30 rounded-lg p-3 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function EditVendorDetails() {
  const [form, setForm] = useState(
    normalizeVendorOnboardingInput({
      accountType: "savings",
    })
  );
  const [errors, setErrors] = useState<VendorValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = normalizeVendorOnboardingInput(form);
    const localErrors = validateVendorOnboardingInput(normalized);

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setSubmitError(
        "Please correct the highlighted fields before continuing."
      );
      return;
    }

    setLoading(true);
    setErrors({});
    setSubmitError("");

    try {
      await axios.post("/api/vendor/update-details", normalized);

      alert(
        "Vendor shop and payout details submitted successfully. " +
          "Demo verification passed and the account is waiting for admin approval."
      );
      router.push("/");
    } catch (error: any) {
      const serverErrors =
        error?.response?.data?.fieldErrors || {};

      setErrors(serverErrors);

      setSubmitError(
        error?.response?.data?.message ||
          "Unable to save vendor details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: keyof typeof form) => errors[field];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/10"
      >
        <h2 className="text-3xl font-semibold text-center mb-3">
          Complete Your Vendor Profile
        </h2>

        <p className="text-center text-gray-300 mb-6 text-sm">
          Enter your shop, bank and PAN details. Basic format validation is
          enforced; payout/KYC verification is simulated for this demo.
        </p>

        {submitError && (
          <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Shop Information
            </h3>

            <div>
              <div className="relative">
                <AiOutlineShop
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={22}
                />
                <input
                  type="text"
                  placeholder="Shop Name"
                  className={inputClass + " pl-10"}
                  value={form.shopName}
                  onChange={(e) =>
                    updateField("shopName", e.target.value)
                  }
                />
              </div>
              {fieldError("shopName") && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldError("shopName")}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <AiOutlineHome
                  className="absolute left-3 top-4 text-gray-400"
                  size={22}
                />
                <textarea
                  placeholder="Business Address"
                  rows={3}
                  className={inputClass + " pl-10"}
                  value={form.businessAddress}
                  onChange={(e) =>
                    updateField("businessAddress", e.target.value)
                  }
                />
              </div>
              {fieldError("businessAddress") && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldError("businessAddress")}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <AiOutlineFileText
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={22}
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  maxLength={15}
                  className={inputClass + " pl-10 uppercase"}
                  value={form.gstNumber}
                  onChange={(e) =>
                    updateField(
                      "gstNumber",
                      e.target.value.toUpperCase()
                    )
                  }
                />
              </div>
              {fieldError("gstNumber") && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldError("gstNumber")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Payout Account
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <AiOutlineUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={21}
                  />
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    className={inputClass + " pl-10"}
                    value={form.accountHolderName}
                    onChange={(e) =>
                      updateField("accountHolderName", e.target.value)
                    }
                  />
                </div>
                {fieldError("accountHolderName") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("accountHolderName")}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <AiOutlineBank
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={21}
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    className={inputClass + " pl-10"}
                    value={form.bankName}
                    onChange={(e) =>
                      updateField("bankName", e.target.value)
                    }
                  />
                </div>
                {fieldError("bankName") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("bankName")}
                  </p>
                )}
              </div>

              <div>
                <input
                  inputMode="numeric"
                  type="text"
                  maxLength={18}
                  placeholder="Bank Account Number"
                  className={inputClass}
                  value={form.accountNumber}
                  onChange={(e) =>
                    updateField(
                      "accountNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />
                {fieldError("accountNumber") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("accountNumber")}
                  </p>
                )}
              </div>

              <div>
                <input
                  inputMode="numeric"
                  type="text"
                  maxLength={18}
                  placeholder="Confirm Bank Account Number"
                  className={inputClass}
                  value={form.confirmAccountNumber || ""}
                  onChange={(e) =>
                    updateField(
                      "confirmAccountNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />
                {fieldError("confirmAccountNumber") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("confirmAccountNumber")}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="IFSC Code"
                  className={inputClass + " uppercase"}
                  value={form.ifscCode}
                  onChange={(e) =>
                    updateField(
                      "ifscCode",
                      e.target.value.toUpperCase()
                    )
                  }
                />
                {fieldError("ifscCode") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("ifscCode")}
                  </p>
                )}
              </div>

              <div>
                <select
                  className={inputClass}
                  value={form.accountType}
                  onChange={(e) =>
                    updateField("accountType", e.target.value)
                  }
                >
                  <option value="savings" className="bg-black">
                    Savings Account
                  </option>
                  <option value="current" className="bg-black">
                    Current Account
                  </option>
                </select>
                {fieldError("accountType") && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldError("accountType")}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Tax & Identity
            </h3>

            <div>
              <input
                type="text"
                maxLength={10}
                placeholder="PAN Number"
                className={inputClass + " uppercase"}
                value={form.panNumber}
                onChange={(e) =>
                  updateField(
                    "panNumber",
                    e.target.value.toUpperCase()
                  )
                }
              />
              {fieldError("panNumber") && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldError("panNumber")}
                </p>
              )}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <ClipLoader size={26} color="white" />
            ) : (
              "Submit Vendor Details"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
