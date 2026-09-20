export const DEFAULT_PLATFORM_FEE_PERCENT = 5;
export const DEFAULT_SERVICE_CHARGE = 30;
export const DEFAULT_DELIVERY_CHARGE = 50;

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

export const calculateOrderCharges = ({
  productPrice,
  quantity,
  freeDelivery,
}: {
  productPrice: number;
  quantity: number;
  freeDelivery: boolean;
}) => {
  const productsTotal = roundCurrency(productPrice * quantity);
  const deliveryCharge = freeDelivery
    ? 0
    : DEFAULT_DELIVERY_CHARGE;
  const serviceCharge = DEFAULT_SERVICE_CHARGE;
  const totalAmount = roundCurrency(
    productsTotal + deliveryCharge + serviceCharge
  );

  return {
    productsTotal,
    deliveryCharge,
    serviceCharge,
    totalAmount,
  };
};
