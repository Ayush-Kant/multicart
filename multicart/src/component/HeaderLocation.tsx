"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBriefcase,
  FaCheck,
  FaChevronDown,
  FaEdit,
  FaHome,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaPlus,
} from "react-icons/fa";
import {
  AddressErrors,
  AddressLabel,
  SavedAddress,
  normalizeAddressInput,
  validateAddressInput,
} from "@/lib/address-validation";

type HeaderLocationProps = {
  userId?: string;
  defaultRecipientName?: string;
  defaultPhone?: string;
  mobile?: boolean;
};

const emptyForm = normalizeAddressInput({
  label: "home",
  country: "India",
  source: "manual",
});

const labelTitle = (label: AddressLabel) =>
  label === "home" ? "Home" : label === "work" ? "Work" : "Other";

const labelIcon = (label: AddressLabel) =>
  label === "home" ? (
    <FaHome size={12} />
  ) : label === "work" ? (
    <FaBriefcase size={12} />
  ) : (
    <FaMapMarkerAlt size={12} />
  );

export default function HeaderLocation({
  userId,
  defaultRecipientName = "",
  defaultPhone = "",
  mobile = false,
}: HeaderLocationProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] =
    useState<SavedAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const loadAddresses = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get("/api/user/addresses");
      const next = (response.data.addresses || []) as SavedAddress[];
      setAddresses(next);

      const defaultAddress =
        next.find((address) => address.isDefault) || next[0] || null;

      setSelectedAddress((current) => {
        if (
          current &&
          next.some(
            (address) => String(address._id) === String(current._id)
          )
        ) {
          return (
            next.find(
              (address) =>
                String(address._id) === String(current._id)
            ) || defaultAddress
          );
        }
        return defaultAddress;
      });
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load your saved addresses."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setEditorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectAddress = async (address: SavedAddress) => {
    setSelectedAddress(address);
    setError("");
    setMessage("");

    if (address.isDefault) {
      setOpen(false);
      return;
    }

    try {
      await axios.patch("/api/user/addresses/" + address._id, {
        isDefault: true,
      });

      const next = addresses.map((item) => ({
        ...item,
        isDefault: String(item._id) === String(address._id),
      }));

      setAddresses(next);
      setSelectedAddress({
        ...address,
        isDefault: true,
      });
      setOpen(false);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Address selected, but the default address could not be updated."
      );
    }
  };

  const openAddEditor = (withLocation = false) => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      recipientName: defaultRecipientName,
      phone: defaultPhone,
      country: "India",
      source: "manual",
    });
    setErrors({});
    setError("");
    setMessage("");
    setOpen(false);
    setEditorOpen(true);

    if (withLocation) {
      window.setTimeout(() => useCurrentLocation(), 80);
    }
  };

  const openEditEditor = (address: SavedAddress) => {
    setEditingId(String(address._id));
    setForm(
      normalizeAddressInput({
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        buildingNumber: address.buildingNumber,
        street: address.street,
        area: address.area,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
        accuracy: address.accuracy,
        source: address.source,
      })
    );
    setErrors({});
    setError("");
    setMessage("");
    setOpen(false);
    setEditorOpen(true);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setError(
        "Location services are unavailable in this browser. Please enter the address manually."
      );
      return;
    }

    setLocating(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          const response = await axios.get(
            "/api/location/reverse-geocode",
            {
              params: { lat: latitude, lon: longitude },
            }
          );

          const location = response.data.address || {};

          setForm((current) => ({
            ...current,
            buildingNumber:
              location.buildingNumber || current.buildingNumber,
            street: location.street || current.street,
            area: location.area || current.area,
            city:
              location.city ||
              location.district ||
              location.cityDistrict ||
              current.city,
            state: location.state || current.state,
            pincode: location.pincode || current.pincode,
            country: location.country || current.country || "India",
            latitude,
            longitude,
            accuracy,
            source: "current_location",
          }));

          setMessage(
            "Location detected. Please review the address and add any missing building or recipient details."
          );
        } catch (requestError: any) {
          setForm((current) => ({
            ...current,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: "current_location",
          }));

          setError(
            requestError?.response?.data?.message ||
              "Location detected, but the address could not be resolved. Please enter the missing fields manually."
          );
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow location access in your browser or enter the address manually.",
          2: "Your location could not be determined. Please try again or enter the address manually.",
          3: "Location detection timed out. Please try again or enter the address manually.",
        };

        setError(
          messages[geoError.code] ||
            "Unable to detect your location. Please enter the address manually."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const updateField = <K extends keyof typeof form>(
    field: K,
    value: typeof form[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setError("");
    setMessage("");
  };

  const saveAddress = async () => {
    const cleaned = normalizeAddressInput(form);
    const validationErrors = validateAddressInput(cleaned);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError("Please correct the highlighted address fields.");
      return;
    }

    setSaving(true);
    setErrors({});
    setError("");

    try {
      const payload = {
        ...cleaned,
        isDefault: addresses.length === 0 || !editingId,
      };

      const response = editingId
        ? await axios.patch(
            "/api/user/addresses/" + editingId,
            payload
          )
        : await axios.post("/api/user/addresses", payload);

      const saved = response.data.address as SavedAddress;

      const next = editingId
        ? addresses.map((address) =>
            String(address._id) === String(saved._id)
              ? saved
              : address
          )
        : [...addresses, saved];

      setAddresses(next);
      setSelectedAddress(saved);
      setEditorOpen(false);
      setEditingId(null);
      setMessage(
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );
    } catch (requestError: any) {
      setErrors(
        requestError?.response?.data?.fieldErrors || {}
      );
      setError(
        requestError?.response?.data?.message ||
          "Unable to save this address."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  const compactLocation =
    selectedAddress?.pincode ||
    selectedAddress?.city ||
    "Set location";

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            setError("");
          }}
          className={
            mobile
              ? "flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-white/10 transition"
              : "flex min-w-0 max-w-[250px] items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10 transition text-left"
          }
          aria-expanded={open}
        >
          <FaMapMarkerAlt
            size={mobile ? 16 : 18}
            className="text-blue-400 shrink-0"
          />

          <span className="min-w-0">
            {!mobile && (
              <span className="block text-[10px] uppercase tracking-wider text-gray-500">
                Deliver to
              </span>
            )}
            <span className="block truncate text-xs sm:text-sm font-medium text-white">
              {compactLocation}
            </span>
          </span>

          {!mobile && (
            <FaChevronDown size={10} className="text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[90] top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0d12] shadow-2xl shadow-black/50"
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-400">
                      Delivery Location
                    </p>
                    <h3 className="text-lg font-semibold text-white mt-1">
                      Select delivery address
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddEditor(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/15"
                  >
                    <FaLocationArrow size={11} />
                    Use Current Location
                  </button>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-300">
                    {message}
                  </div>
                )}
              </div>

              <div className="max-h-[330px] overflow-y-auto p-3">
                {loading ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Loading addresses...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <FaMapMarkerAlt
                      size={26}
                      className="mx-auto text-gray-600 mb-3"
                    />
                    <p className="text-sm font-medium text-gray-200">
                      No saved addresses yet
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Add your delivery address to see it here.
                    </p>
                  </div>
                ) : (
                  addresses.map((address) => {
                    const active =
                      selectedAddress &&
                      String(selectedAddress._id) ===
                        String(address._id);

                    return (
                      <div
                        key={String(address._id)}
                        className={
                          active
                            ? "rounded-xl border p-3 mb-2 last:mb-0 border-blue-500/50 bg-blue-500/10"
                            : "rounded-xl border p-3 mb-2 last:mb-0 border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                        }
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => selectAddress(address)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <div
                              className={
                                active
                                  ? "mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center border-blue-500 bg-blue-500"
                                  : "mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center border-gray-600"
                              }
                            >
                              {active && (
                                <FaCheck
                                  size={10}
                                  className="text-white"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                                  {labelIcon(address.label)}
                                  {labelTitle(address.label)}
                                </span>

                                {address.isDefault && (
                                  <span className="text-[10px] rounded-full bg-green-500/10 px-2 py-0.5 text-green-300">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm font-semibold text-white truncate">
                                {address.recipientName}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-gray-400">
                                {address.addressLine}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Pincode {address.pincode}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditEditor(address)}
                            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-gray-300 hover:bg-white/10"
                            aria-label="Edit address"
                          >
                            <FaEdit size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => openAddEditor(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <FaPlus size={12} />
                  Add another address
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0d12] p-5 sm:p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-400">
                    Delivery Address
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    {editingId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Use current location to prefill the address or enter everything manually.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="text-2xl text-gray-500 hover:text-white"
                  aria-label="Close address editor"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-semibold text-blue-200 hover:bg-blue-500/15 disabled:opacity-50"
              >
                <FaLocationArrow size={13} />
                {locating
                  ? "Detecting your location..."
                  : "Use My Current Location"}
              </button>

              {error && (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200">
                  {message}
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(["home", "work", "other"] as AddressLabel[]).map(
                  (label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => updateField("label", label)}
                      className={
                        form.label === label
                          ? "rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-blue-500 bg-blue-500/10 text-blue-200"
                          : "rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-white/10 bg-white/[0.03] text-gray-300"
                      }
                    >
                      {labelIcon(label)}
                      {labelTitle(label)}
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AddressField
                  label="Recipient Name"
                  value={form.recipientName}
                  error={errors.recipientName}
                  onChange={(value) =>
                    updateField("recipientName", value)
                  }
                />
                <AddressField
                  label="Phone Number"
                  value={form.phone}
                  error={errors.phone}
                  inputMode="numeric"
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                />
                <AddressField
                  label="Building / House Number"
                  value={form.buildingNumber}
                  error={errors.buildingNumber}
                  onChange={(value) =>
                    updateField("buildingNumber", value)
                  }
                />
                <AddressField
                  label="Street / Road"
                  value={form.street}
                  error={errors.street}
                  onChange={(value) =>
                    updateField("street", value)
                  }
                />
                <AddressField
                  label="Area / Locality"
                  value={form.area}
                  error={errors.area}
                  onChange={(value) => updateField("area", value)}
                />
                <AddressField
                  label="Landmark (Optional)"
                  value={form.landmark}
                  error={errors.landmark}
                  onChange={(value) =>
                    updateField("landmark", value)
                  }
                />
                <AddressField
                  label="City"
                  value={form.city}
                  error={errors.city}
                  onChange={(value) => updateField("city", value)}
                />
                <AddressField
                  label="State"
                  value={form.state}
                  error={errors.state}
                  onChange={(value) => updateField("state", value)}
                />
                <AddressField
                  label="Pincode"
                  value={form.pincode}
                  error={errors.pincode}
                  inputMode="numeric"
                  onChange={(value) =>
                    updateField(
                      "pincode",
                      value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                />
                <AddressField
                  label="Country"
                  value={form.country}
                  error={undefined}
                  onChange={(value) =>
                    updateField("country", value)
                  }
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAddress}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AddressField({
  label,
  value,
  error,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric";
}) {
  return (
    <label>
      <span className="text-xs font-medium text-gray-300">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={
          error
            ? "mt-1 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none border-red-500/70"
            : "mt-1 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none border-white/10 focus:border-blue-500"
        }
      />
      {error && (
        <span className="mt-1 block text-xs text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
