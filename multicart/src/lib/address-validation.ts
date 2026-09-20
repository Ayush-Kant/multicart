import { Types } from "mongoose";

export type AddressLabel = "home" | "work" | "other";
export type AddressSource = "manual" | "current_location";

export interface AddressInput {
  label: AddressLabel;
  recipientName: string;
  phone: string;
  buildingNumber: string;
  street: string;
  area?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  source?: AddressSource;
}

export interface SavedAddress extends AddressInput {
  _id: Types.ObjectId | string;
  isDefault: boolean;
  addressLine: string;
}

export type AddressErrors = Partial<Record<keyof AddressInput, string>>;

export const normalizeAddressInput = (
  input: Partial<AddressInput>
): AddressInput => ({
  label:
    input.label === "work" || input.label === "other"
      ? input.label
      : "home",
  recipientName: String(input.recipientName ?? "").trim(),
  phone: String(input.phone ?? "").trim(),
  buildingNumber: String(input.buildingNumber ?? "").trim(),
  street: String(input.street ?? "").trim(),
  area: String(input.area ?? "").trim(),
  landmark: String(input.landmark ?? "").trim(),
  city: String(input.city ?? "").trim(),
  state: String(input.state ?? "").trim(),
  pincode: String(input.pincode ?? "").trim(),
  country: String(input.country ?? "India").trim() || "India",
  latitude:
    input.latitude === undefined || input.latitude === null
      ? undefined
      : Number(input.latitude),
  longitude:
    input.longitude === undefined || input.longitude === null
      ? undefined
      : Number(input.longitude),
  accuracy:
    input.accuracy === undefined || input.accuracy === null
      ? undefined
      : Number(input.accuracy),
  source:
    input.source === "current_location"
      ? "current_location"
      : "manual",
});

export const buildAddressLine = (input: Partial<AddressInput>) => {
  const normalized = normalizeAddressInput(input);

  return [
    normalized.buildingNumber,
    normalized.street,
    normalized.area,
    normalized.landmark
      ? `Near ${normalized.landmark}`
      : "",
    normalized.city,
    normalized.state,
    normalized.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

export const validateAddressInput = (
  input: AddressInput
): AddressErrors => {
  const errors: AddressErrors = {};

  if (!["home", "work", "other"].includes(input.label)) {
    errors.label = "Choose Home, Work or Other.";
  }

  if (input.recipientName.length < 2) {
    errors.recipientName =
      "Recipient name must be at least 2 characters.";
  }

  if (!/^\d{10}$/.test(input.phone)) {
    errors.phone = "Phone number must contain exactly 10 digits.";
  }

  if (input.buildingNumber.length < 1) {
    errors.buildingNumber =
      "Building or house number is required.";
  }

  if (input.street.length < 2) {
    errors.street = "Street or road name must be at least 2 characters.";
  }

  if (input.city.length < 2) {
    errors.city = "City must be at least 2 characters.";
  }

  if (input.state.length < 2) {
    errors.state = "State must be at least 2 characters.";
  }

  if (!/^\d{6}$/.test(input.pincode)) {
    errors.pincode = "Pincode must contain exactly 6 digits.";
  }

  if (
    input.latitude !== undefined &&
    (!Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90)
  ) {
    errors.latitude = "Latitude is invalid.";
  }

  if (
    input.longitude !== undefined &&
    (!Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180)
  ) {
    errors.longitude = "Longitude is invalid.";
  }

  if (
    input.accuracy !== undefined &&
    (!Number.isFinite(input.accuracy) || input.accuracy < 0)
  ) {
    errors.accuracy = "Location accuracy is invalid.";
  }

  return errors;
};

export const toOrderAddress = (input: AddressInput) => ({
  name: input.recipientName,
  phone: input.phone,
  address: buildAddressLine(input),
  buildingNumber: input.buildingNumber,
  street: input.street,
  area: input.area || "",
  landmark: input.landmark || "",
  city: input.city,
  state: input.state,
  pincode: input.pincode,
  country: input.country || "India",
  latitude: input.latitude,
  longitude: input.longitude,
  accuracy: input.accuracy,
  source: input.source || "manual",
});
