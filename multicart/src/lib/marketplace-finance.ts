export const DEFAULT_PLATFORM_FEE_PERCENT = 5;

export const getPlatformFeePercent = () => {
  const configured = Number(process.env.PLATFORM_FEE_PERCENT);

  if (!Number.isFinite(configured) || configured < 0 || configured > 100) {
    return DEFAULT_PLATFORM_FEE_PERCENT;
  }

  return configured;
};

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateMarketplaceSplit = (productsTotal: number) => {
  const safeProductsTotal = roundCurrency(Math.max(0, productsTotal));
  const platformFee = roundCurrency(
    (safeProductsTotal * getPlatformFeePercent()) / 100
  );
  const vendorAmount = roundCurrency(
    Math.max(0, safeProductsTotal - platformFee)
  );

  return {
    platformFee,
    vendorAmount,
    platformFeePercent: getPlatformFeePercent(),
  };
};
