// frontend/app/checkout/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, Banknote, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  
  const [cartData, setCartData] = useState<{items: any[], store: any} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const savedCart = sessionStorage.getItem("quickdine_cart");
    if (savedCart) {
      setCartData(JSON.parse(savedCart));
    }
    
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.user_metadata) {
        setName(data.user.user_metadata.name || "");
        setPhone(data.user.user_metadata.phone || "");
        setAddress(data.user.user_metadata.address || "");
      }
      setIsLoading(false);
    }
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7]">
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#EA580C] hover:underline font-bold">
          Go back to menu
        </button>
      </div>
    );
  }

  // Aggregate identical items to show quantity
  const itemCounts = cartData.items.reduce((acc: any, item: any) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, quantity: 1 };
    } else {
      acc[item.id].quantity += 1;
    }
    return acc;
  }, {});

  const groupedItems = Object.values(itemCounts) as any[];
  const subtotal = cartData.items.reduce((sum, item) => sum + Number(item.price), 0);
  const taxes = subtotal * 0.18; // 18% GST
  const deliveryFee = 40.00; // Flat delivery fee
  const total = subtotal + taxes + deliveryFee;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => { resolve(true); };
      script.onerror = () => { resolve(false); };
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const { data: userData } = await supabase.auth.getUser();

    if (paymentMethod === "card" || paymentMethod === "upi") {
      // Load script
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsProcessing(false);
        return;
      }

      // Create order on our backend
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });
      const orderData = await orderRes.json();

      if (!orderData || !orderData.id) {
         alert("Server error. Please try again.");
         setIsProcessing(false);
         return;
      }

      // Open Razorpay portal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourTestKey", 
        amount: orderData.amount,
        currency: "INR",
        name: "QuickDine",
        description: "Food Delivery Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsProcessing(true);
          // Verify Payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userData?.user?.id || null,
              amount: total
            })
          });
          
          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
            // Insert final order into DB
            const { error } = await supabase.from('orders').insert({
              store_id: cartData.store.user_id,
              customer_id: userData?.user?.id || null,
              customer_name: name,
              customer_phone: phone,
              customer_address: address,
              items: groupedItems,
              total_amount: total,
              status: 'New'
            });

            if (!error) {
              setIsSuccess(true);
              sessionStorage.removeItem("quickdine_cart");
            } else {
              alert("Failed to sync order after payment.");
            }
          } else {
            alert("Payment verification failed.");
          }
          setIsProcessing(false);
        },
        prefill: {
          name: name,
          contact: phone,
        },
        theme: {
          color: "#EA580C"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };
      
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      paymentObject.on("payment.failed", function (response: any) {
         alert(response.error.description);
         setIsProcessing(false);
      });
      
    } else {
      // Cash on Delivery Logic
      const { error } = await supabase.from('orders').insert({
        store_id: cartData.store.user_id,
        customer_id: userData?.user?.id || null,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        items: groupedItems,
        total_amount: total,
        status: 'New'
      });

      setIsProcessing(false);
      
      if (!error) {
        setIsSuccess(true);
        sessionStorage.removeItem("quickdine_cart");
      } else {
        console.error(error);
        alert("Failed to place order. Make sure the orders table is created.");
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center">
        <div className="rounded-full bg-emerald-100 p-6 mb-6">
          <CheckCircle2 className="h-20 w-20 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="mt-4 text-lg text-slate-500 font-medium max-w-md">
          Your order from <strong className="text-slate-900">{cartData.store.store_name}</strong> is being prepared and will be delivered shortly.
        </p>
        <Link 
          href="/" 
          className="mt-10 rounded-full bg-[#EA580C] px-8 py-4 font-bold text-white transition hover:bg-orange-500 active:scale-95 shadow-lg shadow-orange-900/20"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans pb-24">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-[#FFF2E5] hover:text-[#EA580C] transition shadow-sm border border-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-xl font-black tracking-tight text-slate-900">
            Secure Checkout
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Details & Payment */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Delivery Address */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#EA580C]">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Delivery Details</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Complete Address</label>
                  <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="123 Main Street, Appt 4B..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white resize-none" />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Payment Method</h2>
              </div>

              <div className="space-y-4">
                <label 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'card' ? 'border-[#EA580C] bg-orange-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'card' ? 'border-[#EA580C]' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-slate-500" />
                      <span className="font-bold text-slate-900">Credit / Debit Card</span>
                    </div>
                  </div>
                </label>

                <label 
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'upi' ? 'border-[#EA580C] bg-orange-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'upi' ? 'border-[#EA580C]' : 'border-slate-300'}`}>
                      {paymentMethod === 'upi' && <div className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span className="font-bold text-slate-900">UPI (GPay, PhonePe)</span>
                    </div>
                  </div>
                </label>

                <label 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'cod' ? 'border-[#EA580C] bg-orange-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'cod' ? 'border-[#EA580C]' : 'border-slate-300'}`}>
                      {paymentMethod === 'cod' && <div className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-slate-500" />
                      <span className="font-bold text-slate-900">Cash on Delivery</span>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>
              
              <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-[#EA580C] font-bold text-xl">
                  {cartData.store.store_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordering From</p>
                  <p className="font-bold text-slate-900">{cartData.store.store_name}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100 max-h-60 overflow-y-auto pr-2 hide-scrollbar">
                {groupedItems.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                        {item.quantity}x
                      </div>
                      <span className="font-bold text-slate-800 leading-tight">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Receipt */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>GST (18%)</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between text-lg font-black text-slate-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 font-black text-lg text-white transition hover:bg-orange-500 active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-orange-900/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" /> Processing...
                  </>
                ) : (
                  paymentMethod === 'cod' 
                    ? `Place Order • ₹${total.toFixed(2)}` 
                    : `Pay Securely • ₹${total.toFixed(2)}`
                )}
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Global styles for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </main>
  );
}
