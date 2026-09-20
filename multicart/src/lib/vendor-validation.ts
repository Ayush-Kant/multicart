export type AccountType = "savings" | "current";

export interface VendorOnboardingInput {
  shopName: string;
  businessAddress: string;
  gstNumber: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber?: string;
  ifscCode: string;
  panNumber: string;
  accountType: AccountType;
}

export type VendorValidationErrors = Record<string, string>;

export const normalizeVendorOnboardingInput = (
  input: Partial<VendorOnboardingInput>
): VendorOnboardingInput => ({
  shopName: String(input.shopName ?? "").trim(),
  businessAddress: String(input.businessAddress ?? "").trim(),
  gstNumber: String(input.gstNumber ?? "").trim().toUpperCase(),
  accountHolderName: String(input.accountHolderName ?? "").trim(),
  bankName: String(input.bankName ?? "").trim(),
  accountNumber: String(input.accountNumber ?? "").trim(),
  confirmAccountNumber:
    input.confirmAccountNumber === undefined
      ? undefined
      : String(input.confirmAccountNumber).trim(),
  ifscCode: String(input.ifscCode ?? "").trim().toUpperCase(),
  panNumber: String(input.panNumber ?? "").trim().toUpperCase(),
  accountType:
    input.accountType === "current" ? "current" : "savings",
});

export const validateVendorOnboardingInput = (
  input: VendorOnboardingInput
): VendorValidationErrors => {
  const errors: VendorValidationErrors = {};

  if (input.shopName.length < 2) {
    errors.shopName = "Shop name must be at least 2 characters.";
  }

  if (input.businessAddress.length < 10) {
    errors.businessAddress =
      "Business address must be at least 10 characters.";
  }

  if (!/^\d{2}[A-Z0-9]{13}$/.test(input.gstNumber)) {
    errors.gstNumber =
      "GST number must be exactly 15 letters/numbers and start with two digits.";
  }

  if (
    input.accountHolderName.length < 2 ||
    input.accountHolderName.length > 100
  ) {
    errors.accountHolderName =
      "Account holder name must be between 2 and 100 characters.";
  }

  if (input.bankName.length < 2 || input.bankName.length > 100) {
    errors.bankName = "Bank name must be between 2 and 100 characters.";
  }

  if (!/^\d{9,18}$/.test(input.accountNumber)) {
    errors.accountNumber =
      "Bank account number must contain 9 to 18 digits.";
  }

  if (
    input.confirmAccountNumber !== undefined &&
    input.accountNumber !== input.confirmAccountNumber
  ) {
    errors.confirmAccountNumber = "Account numbers do not match.";
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifscCode)) {
    errors.ifscCode =
      "IFSC must be 11 characters in the format XXXX0XXXXXX.";
  }

  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(input.panNumber)) {
    errors.panNumber =
      "PAN must be 10 characters in the format ABCDE1234F.";
  }

  if (!["savings", "current"].includes(input.accountType)) {
    errors.accountType = "Select a valid account type.";
  }

  return errors;
};

export const getFirstVendorValidationError = (
  errors: VendorValidationErrors
) => Object.values(errors)[0] ?? null;
