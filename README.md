# 🧡 QuickDine — Nearby Restaurant & Food Ordering Platform

QuickDine is a modern, responsive, end-to-end food delivery and restaurant management platform. Built with **Next.js (App Router)**, **Supabase**, and **Razorpay**, it connects hungry customers with local restaurants, provides store owners with real-time order tracking and management dashboards, and equips drivers with an interactive delivery tracker.

---

## 🚀 Features

### 👤 Customer Experience
*   **Secure Authentication:** User registration, email verification, and login powered by **Supabase Auth**.
*   **Interactive Search & Discovery:** Find restaurants near your location, view details, reviews, and interactive maps.
*   **Modern Cart System:** Real-time quantity controls, tax (GST) calculations, and delivery fee computation.
*   **Streamlined Checkout:** Clean and beautiful multi-step address capture and payment selection.
*   **Secure Checkout Modal:** Seamless Razorpay popup supporting Cards, UPI (GPay, PhonePe, Paytm), Wallets, and Cash on Delivery (COD).
*   **Push Notifications:** Receive instant updates on order status (e.g., when the order is preparing, dispatched, or delivered) via OneSignal.

### 🏪 Store Owner Dashboard
*   **Real-time Order Tracking:** Manage incoming orders through structured stages (*New*, *Preparing*, *Ready*, and *Completed*).
*   **Automatic Order Syncing:** Auto-refresh system (15-second polling fallback) keeping dashboard lanes aligned with Supabase.
*   **Integrated Customer & Driver Alerts:** Advancing order lanes automatically dispatches tailored push notifications to customers and alerts online drivers when food starts preparing.
*   **Menu & Price Customization:** Easily add, edit, or remove menu items, prices, and categories.
*   **Daily Analytics:** Monitor daily sales, order volume, and key performance insights.
*   **Store Settings & Controls:** Control store status (open/closed), operating hours, and reply directly to customer reviews.

### 🚴 Driver Experience
*   **Duty Status Control:** Toggle "Online" / "Offline" status to start or stop receiving deliveries, persisting state to `driver_profiles`.
*   **Real-Time Order Feed:** Instant updates on available orders (status is `Preparing` or `Ready` and has no driver assigned) and claimed active orders.
*   **One-Click Claims:** Claim available orders instantly. Built-in assignment validation ensures orders are not double-allocated.
*   **Step-by-Step Dispatch Progress:** Move accepted orders from *In Transit* to *Delivered*, which automatically sends progress updates to the customer.
*   **Dynamic Earnings Tracker:** Track daily earnings milestones with a progress bar (default daily goal of ₹3,000) based on completed orders and delivery fees (flat ₹80/delivery).
*   **Live Map Integration:** Integrated interactive map container showcasing delivery routing.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
*   **Database & Real-time:** [Supabase](https://supabase.com/) (Postgres + Real-time Subscriptions)
*   **Push Notifications:** [OneSignal REST API & Web SDK](https://onesignal.com/)
*   **Payments:** [Razorpay Node SDK](https://razorpay.com/) (Standard Checkout UI & Backend Signature Verification)

---

## 📂 Project Structure

```text
QuickDine/
├── frontend/
│   ├── app/                  # Next.js App Router Pages & Layouts
│   │   ├── api/              # Backend API Route Handlers (Payments, Webhooks, Notifications)
│   │   │   ├── payment/      # Razorpay order generation, signature verification, and webhook handlers
│   │   │   └── notifications/# OneSignal targeted and broadcast push notifications API
│   │   ├── checkout/         # Order summary, address form, and Razorpay modal triggers
│   │   ├── driver/           # Driver login, duty status toggle, order claims, and earnings progress
│   │   ├── store-owner/      # Store dashboard, order tracker lanes, menu editor, and insights
│   │   └── page.tsx          # Landing & Discovery Home Page
│   ├── components/           # Reusable UI Components
│   │   ├── OneSignalProvider.tsx # OneSignal initialization and user identity synchronization provider
│   │   └── RestaurantSearch.tsx  # Restaurant map search and filtering
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

# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key

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

### 5. Supabase Realtime Setup
To enable instantaneous, real-time driver dashboard updates, you must configure Postgres replication for the `orders` table. Run the following command in the **SQL Editor** of your Supabase dashboard:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

## 🧪 Crucial Implementations & Reliability Handlers

*   **Chronological Order & Notification Workflow:** Restricts driver notifications and order claims to ensure food is accepted by the restaurant before delivery begins:
    *   *New Order:* Placed silently (no driver alert).
    *   *Preparing (Acceptance):* Triggers notification to drivers (*"New Order Preparing"*) and customer (*"Food is being prepared"*). Only orders in `Preparing` or `Ready` statuses appear on the driver dashboard.
    *   *Ready (Prepared):* Triggers customer notification (*"Food is prepared"*).
    *   *In Transit (Claimed):* Triggers customer notification (*"Driver is on the way"*).
    *   *Delivered (Fulfillment):* Triggers customer notification (*"Order has been delivered"*).
*   **OneSignal React Provider & Auth Sync:** Utilizes an initialization promise guard to prevent double-initialization in React StrictMode/Turbopack development environments and maps Supabase session user IDs to OneSignal device profiles securely via `OneSignal.login(userId)` and `OneSignal.logout()`.
*   **Float Inaccuracies Handled:** Prevented Razorpay `BAD_REQUEST_ERROR: The amount must be an integer` when totals include decimal values. Cart totals are converted securely using `Math.round(amount * 100)` to guarantee clean integer (paise) inputs.
*   **Node.js Runtime Target:** Enforced `export const runtime = "nodejs"` on backend payment handlers to ensure compatibility with Node-native cryptographics (`crypto`) and server communication, avoiding edge runtime compilation errors.
*   **Checkout Dismissal Safety:** Configured the frontend checkout modal with a `modal.ondismiss` hook. If a customer exits the payment modal midway, the UI is properly notified and resets the loading state, allowing the user to select another method.
