"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaLocationArrow,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaHome,
  FaBriefcase,
} from "react-icons/fa";
import {
  AddressErrors,
  AddressLabel,
  AddressSource,
  SavedAddress,
  normalizeAddressInput,
} from "@/lib/address-validation";

type AddressBookProps = {
  selectable?: boolean;
  selectedAddressId?: string | null;
  onSelect?: (address: SavedAddress) => void;
  onAddressesChange?: (addresses: SavedAddress[]) => void;
};

const emptyForm = normalizeAddressInput({
  label: "home",
  country: "India",
  source: "manual",
});

const labelTitle = (label: AddressLabel) => {
  if (label === "home") return "Home";
  if (label === "work") return "Work";
  return "Other";
};

const labelIcon = (label: AddressLabel) => {
  if (label === "home") return <FaHome size={13} />;
  if (label === "work") return <FaBriefcase size={13} />;
  return <FaMapMarkerAlt size={13} />;
};

export default function AddressBook({
  selectable = false,
  selectedAddressId = null,
  onSelect,
  onAddressesChange,
}: AddressBookProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      const response = await axios.get("/api/user/addresses");
      const nextAddresses = response.data.addresses || [];

      setAddresses(nextAddresses);
      onAddressesChange?.(nextAddresses);

      if (
        selectable &&
        !selectedAddressId &&
        nextAddresses.length > 0
      ) {
        const defaultAddress =
          nextAddresses.find((item: SavedAddress) => item.isDefault) ||
          nextAddresses[0];

        onSelect?.(defaultAddress);
      }
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message ||
          "Unable to load your saved addresses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const updateField = (
    field: keyof typeof form,
    value: string | number | undefined
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setFormError("");
    setMessage("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      recipientName: "",
      phone: "",
      country: "India",
      source: "manual",
    });
    setErrors({});
    setFormError("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (address: SavedAddress) => {
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
    setFormError("");
    setMessage("");
    setShowForm(true);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setFormError(
        "Location services are not available in this browser. Please enter the address manually."
      );
      return;
    }

    setLocating(true);
    setFormError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } =
            position.coords;

          const response = await axios.get(
            "/api/location/reverse-geocode",
            {
              params: {
                lat: latitude,
                lon: longitude,
              },
            }
          );

          const location = response.data.address || {};

          setForm((current) => ({
            ...current,
            buildingNumber:
              location.buildingNumber || current.buildingNumber,
            street: location.street || current.street,
            area: location.area || current.area,
            city: location.city || current.city,
            state: location.state || current.state,
            pincode: location.pincode || current.pincode,
            country: location.country || current.country || "India",
            latitude,
            longitude,
            accuracy,
            source: "current_location",
          }));

          setErrors({});
          setMessage(
            response.data.displayName
              ? `Location found: ${response.data.displayName}`
              : "Location found. Please review the address before saving."
          );
        } catch (error: any) {
          setForm((current) => ({
            ...current,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: "current_location",
          }));

          setFormError(
            error?.response?.data?.message ||
              "Location detected, but the address could not be filled automatically. Please complete the fields manually."
          );
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow location access in your browser or enter the address manually.",
          2: "Your location could not be determined. Please try again or enter the address manually.",
          3: "Location detection timed out. Please try again or enter the address manually.",
        };

        setFormError(
          messages[error.code] ||
            "Unable to detect your location. Please enter the address manually."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const saveAddress = async () => {
    const cleaned = normalizeAddressInput(form);

    const localErrors: AddressErrors = {};

    if (!cleaned.recipientName || cleaned.recipientName.length < 2) {
      localErrors.recipientName =
        "Recipient name must be at least 2 characters.";
    }

    if (!/^\d{10}$/.test(cleaned.phone)) {
      localErrors.phone =
        "Phone number must contain exactly 10 digits.";
    }

    if (!cleaned.buildingNumber) {
      localErrors.buildingNumber =
        "Building or house number is required.";
    }

    if (cleaned.street.length < 2) {
      localErrors.street =
        "Street or road name must be at least 2 characters.";
    }

    if (cleaned.city.length < 2) {
      localErrors.city =
        "City must be at least 2 characters.";
    }

    if (cleaned.state.length < 2) {
      localErrors.state =
        "State must be at least 2 characters.";
    }

    if (!/^\d{6}$/.test(cleaned.pincode)) {
      localErrors.pincode =
        "Pincode must contain exactly 6 digits.";
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setFormError(
        "Please correct the highlighted address fields."
      );
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError("");

    try {
      const payload = {
        ...cleaned,
        isDefault:
          addresses.length === 0 ||
          addresses.find(
            (address) => String(address._id) === editingId
          )?.isDefault ||
          false,
      };

      const response = editingId
        ? await axios.patch(
            `/api/user/addresses/${editingId}`,
            payload
          )
        : await axios.post(
            "/api/user/addresses",
            payload
          );

      const saved = response.data.address as SavedAddress;

      const nextAddresses = editingId
        ? addresses.map((address) =>
            String(address._id) === String(saved._id)
              ? saved
              : address
          )
        : [...addresses, saved];

      setAddresses(nextAddresses);
      onAddressesChange?.(nextAddresses);

      if (selectable) {
        onSelect?.(saved);
      }

      setMessage(
        editingId
          ? "Address updated successfully."
          : "Address saved successfully."
      );

      setEditingId(null);
      setShowForm(false);
    } catch (error: any) {
      setErrors(error?.response?.data?.fieldErrors || {});
      setFormError(
        error?.response?.data?.message ||
          "Unable to save this address."
      );
    } finally {
      setSaving(false);
    }
  };

  const setAsDefault = async (address: SavedAddress) => {
    try {
      const response = await axios.patch(
        `/api/user/addresses/${address._id}`,
        {
          isDefault: true,
        }
      );

      const updated = response.data.address as SavedAddress;

      const nextAddresses = addresses.map((item) => ({
        ...item,
        isDefault:
          String(item._id) === String(updated._id),
      }));

      setAddresses(nextAddresses);
      onAddressesChange?.(nextAddresses);
      onSelect?.(updated);
      setMessage("Default address updated.");
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message ||
          "Unable to set the default address."
      );
    }
  };

  const deleteAddress = async (address: SavedAddress) => {
    if (
      !window.confirm(
        `Delete your ${labelTitle(address.label).toLowerCase()} address?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(String(address._id));

      const response = await axios.delete(
        `/api/user/addresses/${address._id}`
      );

      const nextAddresses = response.data.addresses || [];

      setAddresses(nextAddresses);
      onAddressesChange?.(nextAddresses);

      if (
        selectable &&
        selectedAddressId === String(address._id)
      ) {
        const replacement =
          nextAddresses.find(
            (item: SavedAddress) => item.isDefault
          ) || nextAddresses[0];

        onSelect?.(replacement || null);
      }

      setMessage("Address deleted successfully.");
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message ||
          "Unable to delete this address."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Saved Addresses</h2>
          <p className="text-sm text-gray-400 mt-1">
            Save up to 10 delivery addresses and choose one at checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition"
        >
          <FaPlus size={12} />
          Add New Address
        </button>
      </div>

      {formError && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {formError}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-400">
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-center">
          <FaMapMarkerAlt
            className="mx-auto text-gray-500 mb-3"
            size={25}
          />
          <p className="font-medium">No saved addresses yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Add a manual address or use your current location.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const addressId = String(address._id);
            const selected = selectedAddressId === addressId;

            return (
              <div
                key={addressId}
                className={`rounded-2xl border p-4 transition ${
                  selected
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                      {labelIcon(address.label)}
                      {labelTitle(address.label)}
                    </span>

                    {address.isDefault && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-400">
                        <FaCheck size={10} />
                        Default
                      </span>
                    )}
                  </div>

                  {selectable && (
                    <button
                      type="button"
                      onClick={() => onSelect?.(address)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-500"
                      }`}
                      aria-label="Select address"
                    >
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <p className="font-semibold">
                    {address.recipientName}
                  </p>
                  <p className="text-sm text-gray-400">
                    {address.phone}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    {address.addressLine}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Pincode:{" "}
                    <span className="text-gray-200">
                      {address.pincode}
                    </span>
                  </p>
                  {address.source === "current_location" && (
                    <p className="mt-2 text-xs text-blue-300 flex items-center gap-1">
                      <FaLocationArrow size={10} />
                      Saved using current location
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                  {selectable && (
                    <button
                      type="button"
                      onClick={() => onSelect?.(address)}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold transition"
                    >
                      Deliver Here
                    </button>
                  )}

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setAsDefault(address)}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
                    >
                      Set as Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
                  >
                    <FaEdit size={11} />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === addressId}
                    onClick={() => deleteAddress(address)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-300 text-xs disabled:opacity-50"
                  >
                    <FaTrash size={11} />
                    {deletingId === addressId
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0d12] p-5 sm:p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-400 text-xs uppercase tracking-[0.18em]">
                    Delivery Address
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {editingId
                      ? "Edit Address"
                      : "Add New Address"}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Use your current location to prefill nearby address
                    details, then verify building and street information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mt-5 w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-blue-200 hover:bg-blue-500/15 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaLocationArrow size={14} />
                {locating
                  ? "Detecting your location..."
                  : "Use My Current Location"}
              </button>

              <p className="mt-2 text-[11px] leading-5 text-gray-500">
                Location access is requested only when you press the button.
                Your coordinates are used for this address lookup and are not
                collected continuously.
              </p>

              {message && (
                <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200">
                  {message}
                </div>
              )}

              {formError && (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["home", "work", "other"] as AddressLabel[]).map(
                  (label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        updateField("label", label)
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                        form.label === label
                          ? "border-blue-500 bg-blue-500/10 text-blue-200"
                          : "border-white/10 bg-white/[0.03] text-gray-300"
                      }`}
                    >
                      {labelIcon(label)}
                      {labelTitle(label)}
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Recipient Name"
                  value={form.recipientName}
                  error={errors.recipientName}
                  onChange={(value) =>
                    updateField("recipientName", value)
                  }
                />
                <Field
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
                <Field
                  label="Building / House Number"
                  value={form.buildingNumber}
                  error={errors.buildingNumber}
                  onChange={(value) =>
                    updateField("buildingNumber", value)
                  }
                />
                <Field
                  label="Street / Road"
                  value={form.street}
                  error={errors.street}
                  onChange={(value) =>
                    updateField("street", value)
                  }
                />
                <Field
                  label="Area / Locality"
                  value={form.area}
                  error={errors.area}
                  onChange={(value) =>
                    updateField("area", value)
                  }
                />
                <Field
                  label="Landmark (Optional)"
                  value={form.landmark}
                  error={errors.landmark}
                  onChange={(value) =>
                    updateField("landmark", value)
                  }
                />
                <Field
                  label="City"
                  value={form.city}
                  error={errors.city}
                  onChange={(value) =>
                    updateField("city", value)
                  }
                />
                <Field
                  label="State"
                  value={form.state}
                  error={errors.state}
                  onChange={(value) =>
                    updateField("state", value)
                  }
                />
                <Field
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
                <Field
                  label="Country"
                  value={form.country}
                  error={undefined}
                  onChange={(value) =>
                    updateField("country", value)
                  }
                />
              </div>

              {form.latitude !== undefined &&
                form.longitude !== undefined && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-gray-500">
                    Location captured: {form.latitude.toFixed(6)},{" "}
                    {form.longitude.toFixed(6)}
                    {form.accuracy
                      ? ` (±${Math.round(form.accuracy)}m)`
                      : ""}
                  </div>
                )}

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAddress}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>

              <p className="mt-4 text-[11px] text-gray-600">
                Reverse address lookup © OpenStreetMap contributors.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  inputMode,
}: {
  label: string;
  value: string | undefined;
  error?: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric";
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-300">
        {label}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition ${
          error
            ? "border-red-500/70 focus:border-red-400"
            : "border-white/10 focus:border-blue-500"
        }`}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
