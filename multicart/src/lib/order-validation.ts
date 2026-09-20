export interface DeliveryAddressInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export type DeliveryAddressErrors = Record<
  keyof DeliveryAddressInput,
  string
>;

export const normalizeDeliveryAddress = (
  input: Partial<DeliveryAddressInput>
): DeliveryAddressInput => ({
  name: String(input.name ?? "").trim(),
  phone: String(input.phone ?? "").trim(),
  address: String(input.address ?? "").trim(),
  city: String(input.city ?? "").trim(),
  pincode: String(input.pincode ?? "").trim(),
});

export const validateDeliveryAddress = (
  input: DeliveryAddressInput
): Partial<DeliveryAddressErrors> => {
  const errors: Partial<DeliveryAddressErrors> = {};

  if (input.name.length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!/^\d{10}$/.test(input.phone)) {
    errors.phone = "Phone number must contain exactly 10 digits.";
  }

  if (input.address.length < 10) {
    errors.address =
      "Delivery address must be at least 10 characters.";
  }

  if (input.city.length < 2) {
    errors.city = "City must be at least 2 characters.";
  }

  if (!/^\d{6}$/.test(input.pincode)) {
    errors.pincode = "Pincode must contain exactly 6 digits.";
  }

  return errors;
};

export const getFirstDeliveryAddressError = (
  errors: Partial<DeliveryAddressErrors>
) => Object.values(errors)[0] ?? null;
