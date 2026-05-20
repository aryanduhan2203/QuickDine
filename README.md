# 🧡 QuickDine — Nearby Restaurant & Food Ordering Platform

QuickDine is a modern, responsive, end-to-end food delivery and restaurant management platform. Built with **Next.js (App Router)**, **Supabase**, and **Razorpay**, it connects hungry customers with local restaurants and provides store owners with real-time order tracking and management dashboards.

---

## 🚀 Features

### 👤 Customer Experience
*   **Secure Authentication:** User registration, email verification, and login powered by **Supabase Auth**.
*   **Interactive Search & Discovery:** Find restaurants near your location, view details, reviews, and interactive maps.
*   **Modern Cart System:** Real-time quantity controls, tax (GST) calculations, and delivery fee computation.
*   **Streamlined Checkout:** Clean and beautiful multi-step address capture and payment selection.
*   **Secure Checkout Modal:** Seamless Razorpay popup supporting Cards, UPI (GPay, PhonePe, Paytm), Wallets, and Cash on Delivery (COD).

### 🏪 Store Owner Dashboard
*   **Real-time Order Tracking:** Manage incoming orders through preparing, dispatched, and delivered states.
*   **Menu & Price Customization:** Easily add, edit, or remove menu items, prices, and categories.
*   **Daily Analytics:** Monitor daily sales, order volume, and key performance insights.
*   **Store Settings & Controls:** Control store status (open/closed), operating hours, and reply directly to customer reviews.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Payments:** [Razorpay Node SDK](https://razorpay.com/) (Standard Checkout UI & Backend Signature Verification)

---

## 📂 Project Structure

```text
QuickDine/
├── frontend/
│   ├── app/                  # Next.js App Router Pages & Layouts
│   │   ├── api/              # Backend API Route Handlers (Payments, Webhooks)
│   │   │   └── payment/      # Razorpay order generation, signature verification, and webhook handlers
│   │   ├── checkout/         # Order summary, address form, and Razorpay modal triggers
│   │   ├── store-owner/      # Store dashboard, order tracker, menu editor, and insights
│   │   └── page.tsx          # Landing & Discovery Home Page
│   ├── components/           # Reusable UI Components (RestaurantSearch, layout elements)
│   ├── lib/                  # Initialization helpers (Supabase client, Razorpay SDK)
│   └── package.json          # Frontend packages & configuration
├── package.json              # Main project workspace script controls
└── README.md                 # Project documentation
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Environment Configuration
Create a `.env.local` file inside the `frontend/` directory with the following keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Configuration (Public keys for frontend modal, private for backend verification)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_optional_webhook_secret
```

### 3. Installation
Install the project dependencies from the root directory:

```bash
# Run from the root directory
npm install --prefix frontend
```

### 4. Running the Development Server
Launch the application:

```bash
# Run dev server
npm run dev
```
The application will start on [http://localhost:3000](http://localhost:3000).

---

## 🧪 Crucial Implementations & Reliability Handlers

*   **Float Inaccuracies Handled:** Prevented Razorpay `BAD_REQUEST_ERROR: The amount must be an integer` when totals include decimal values. Cart totals are converted securely using `Math.round(amount * 100)` to guarantee clean integer (paise) inputs.
*   **Node.js Runtime Target:** Enforced `export const runtime = "nodejs"` on backend payment handlers to ensure compatibility with Node-native cryptographics (`crypto`) and server communication, avoiding edge runtime compilation errors.
*   **Checkout Dismissal Safety:** Configured the frontend checkout modal with a `modal.ondismiss` hook. If a customer exits the payment modal midway, the UI is properly notified and resets the loading state, allowing the user to select another method.
