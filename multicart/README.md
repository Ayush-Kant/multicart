This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Marketplace Settlement Demo

Vendor onboarding collects shop, bank account, IFSC, PAN and account-type details with format validation and field-level errors. The application stores payout details for the vendor, while API responses and admin screens expose only masked account/PAN information.

The settlement flow is structured like a marketplace payout system:

```text
Customer payment / COD delivery confirmation
                ↓
Payment or collection verified
                ↓
Vendor payout eligibility checks
                ↓
Payout record created
                ↓
Platform fee calculated
                ↓
Vendor amount calculated
                ↓
Payout marked paid (demo mode)
                ↓
Vendor dashboard + admin ledger updated
```

Demo mode intentionally simulates the external verification and transfer steps. No bank API, UPI transfer, Razorpay Route transfer, real KYC or PAN verification is executed.

Optional environment settings:

```env
PAYOUT_DEMO_MODE=true
PLATFORM_FEE_PERCENT=5
```

Set `PAYOUT_DEMO_MODE=false` only when a real payout provider and real verification workflow have been implemented in `src/lib/vendor-payout.ts`.
