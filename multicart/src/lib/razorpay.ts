const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const getAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay server credentials are not configured");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

const razorpayRequest = async (
  path: string,
  options: RequestInit = {}
) => {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
      data?.message ||
      `Razorpay request failed with status ${response.status}`
    );
  }

  return data;
};

export const createRazorpayOrder = async ({
  amount,
  currency,
  receipt,
  notes,
}: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) => {
  return razorpayRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes,
    }),
  });
};

export const fetchRazorpayPayment = async (paymentId: string) => {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
};

export const getRazorpayKeyId = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not configured");
  }

  return keyId;
};
