"use client";

import { useEffect, useState } from "react";
import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";
import { supabase } from "../../../lib/supabase";
import { Loader2, RefreshCcw } from "lucide-react";

const lanes = ["New", "Preparing", "Ready", "Completed"];

export default function TrackOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  const fetchOrders = async (uid: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setStoreId(data.user.id);
        fetchOrders(data.user.id);
      }
    };
    init();
    
    // Auto-refresh every 15 seconds to check for new orders without needing Realtime replication enabled
    const interval = setInterval(() => {
      if (storeId) fetchOrders(storeId);
    }, 15000);
    return () => clearInterval(interval);
  }, [storeId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Find order to get customer_id
    const order = orders.find(o => o.id === orderId);

    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error && order && order.customer_id) {
      try {
        // 1. Notify the customer of order status
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: [order.customer_id],
            title: `Order Status: ${newStatus} 🍕`,
            message: newStatus === "Preparing" 
              ? "Your food is being prepared in the kitchen!" 
              : newStatus === "Ready" 
              ? "Your order has been prepared! A delivery partner is picking it up."
              : `Your order status has been updated to ${newStatus.toLowerCase()}.`
          })
        });

        // 2. If transitioning to "Preparing", notify all drivers that a new order is preparing and available soon
        if (newStatus === "Preparing") {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "New Order Preparing! 🍔",
              message: "An order is currently being prepared and will be ready for pickup soon.",
              url: "/driver"
            })
          });
        }
      } catch (err) {
        console.error("Failed to process notifications:", err);
      }
    }
  };

  return (
    <StoreOwnerShell
      title="Track orders"
      description="Follow order status in one place so the kitchen and front desk stay aligned."
    >
      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => storeId && fetchOrders(storeId)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#EA580C] transition"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-start">
        {lanes.map((lane) => {
          const laneOrders = orders.filter(o => o.status === lane);
          
          return (
            <section
              key={lane}
              className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/50 bg-slate-50 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-black text-slate-800">{lane}</h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
                  {laneOrders.length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {laneOrders.length === 0 ? (
                  <p className="text-center text-sm font-medium text-slate-400 py-6">No orders</p>
                ) : (
                  laneOrders.map(order => (
                    <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[#EA580C]">#{order.id.slice(0, 6).toUpperCase()}</span>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 mb-1">{order.customer_name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{order.customer_address.slice(0, 40)}...</p>
                      
                      <div className="border-t border-b border-slate-100 py-2 mb-3 space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-700"><span className="font-bold text-slate-900">{item.quantity}x</span> {item.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-500">Total</span>
                        <span className="font-black text-slate-900">₹{order.total_amount}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {lane === "New" && (
                          <button onClick={() => updateOrderStatus(order.id, "Preparing")} className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
                            Start Preparing
                          </button>
                        )}
                        {lane === "Preparing" && (
                          <button onClick={() => updateOrderStatus(order.id, "Ready")} className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white transition hover:bg-amber-600">
                            Mark Ready
                          </button>
                        )}
                        {lane === "Ready" && (
                          <button onClick={() => updateOrderStatus(order.id, "Completed")} className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white transition hover:bg-emerald-600">
                            Complete Order
                          </button>
                        )}
                        {lane === "Completed" && (
                          <p className="w-full text-center text-xs font-bold text-slate-400 py-2">
                            Finished
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </StoreOwnerShell>
  );
}
