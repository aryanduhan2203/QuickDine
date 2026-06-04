"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LogOut,
  MapPin,
  TrendingUp,
  PackageCheck,
  Bike,
  Compass,
  Route,
  Clock,
  Navigation,
  ShieldCheck,
  UserCheck,
  Bell,
  ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "store_owner" | "driver";
  isVerified: boolean;
};

const driverFeatures = [
  {
    title: "Flexible Shifts",
    description: "Go online whenever you want. Track active delivery hours dynamically.",
    icon: Clock,
  },
  {
    title: "Optimized Navigation",
    description: "Integrated maps ensure you take the fastest dispatch routes to customers.",
    icon: Navigation,
  },
  {
    title: "Earnings Tracker",
    description: "Monitor your payouts, completed trips, tips, and daily milestones in real time.",
    icon: TrendingUp,
  },
  {
    title: "Order Flow",
    description: "Accept deliveries, track restaurant preparation, and complete drop-offs smoothly.",
    icon: PackageCheck,
  },
];

const mockDeliveries = [
  {
    id: "DLV-8942",
    store: "Pizza Romano",
    address: "244 Park Avenue, Sector 4",
    status: "Ready for Pickup",
    amount: "₹180",
    distance: "2.4 km"
  },
  {
    id: "DLV-7711",
    store: "Burger House",
    address: "Apt 12B, Green Meadows",
    status: "In Transit",
    amount: "₹150",
    distance: "3.8 km"
  }
];

const mapUser = (user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthUser => ({
  id: user.id,
  name:
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name
      : "QuickDine Driver",
  email: user.email ?? "",
  role:
    user.user_metadata?.role === "store_owner" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.role === "driver"
      ? user.user_metadata.role
      : "user",
  isVerified: Boolean(user.email_confirmed_at),
});

export default function DriverPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Dynamic Driver State
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [onlineHours, setOnlineHours] = useState(1); // Static metric or derived as placeholder

  const fetchDriverData = async (userId: string) => {
    try {
      setLoading(true);

      // 1. Fetch available orders (Preparing, Ready and no driver) 
      // AND active orders assigned to this driver
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          customer_name,
          customer_address,
          store_id,
          driver_id
        `)
        .or(`driver_id.eq.${userId},and(driver_id.is.null,status.in.(Preparing,Ready))`);

      if (ordersData) {
        const storeIds = Array.from(new Set(ordersData.map((o) => o.store_id)));
        
        let storeMap = new Map();
        if (storeIds.length > 0) {
          const { data: stores } = await supabase
            .from("store_profiles")
            .select("user_id, store_name, address")
            .in("user_id", storeIds);
          
          if (stores) {
            stores.forEach((s) => storeMap.set(s.user_id, s));
          }
        }

        const formatted = ordersData.map((order) => {
          const store = storeMap.get(order.store_id) || {};
          return {
            id: `DLV-${order.id.toString().slice(-4).toUpperCase()}`,
            realId: order.id,
            store: store.store_name || "Local Restaurant",
            storeAddress: store.address || "Kitchen Hub",
            address: order.customer_address || "Customer Address",
            customerName: order.customer_name || "Customer",
            status: order.status,
            amount: `₹${Math.round(order.total_amount)}`,
            distance: `${(1.5 + Math.random() * 3.5).toFixed(1)} km`,
            driverId: order.driver_id
          };
        });

        // Filter: Keep only unassigned available orders OR assigned active orders
        const active = formatted.filter(
          (d) => d.driverId === null || (d.driverId === userId && d.status !== "Delivered")
        );
        setDeliveries(active);
      }

      // 2. Fetch completed deliveries & earnings metrics dynamically from the DB
      const { data: completedOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("driver_id", userId)
        .eq("status", "Delivered");

      if (completedOrders) {
        const count = completedOrders.length;
        setCompletedCount(count);
        // Flat ₹80 per delivery fee + occasional bonuses
        setEarnings(count * 80);
      }
    } catch (err) {
      console.error("Error loading driver data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!data.session?.user) {
        setUser(null);
        setIsReady(true);
        return;
      }

      const userObj = mapUser(data.session.user);
      setUser(userObj);
      setIsReady(true);

      // Fetch driver status & initial stats
      const { data: profileData } = await supabase
        .from("driver_profiles")
        .select("is_online")
        .eq("user_id", userObj.id)
        .maybeSingle();

      if (profileData && mounted) {
        setIsOnline(profileData.is_online);
      }

      fetchDriverData(userObj.id);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (!session?.user) {
        setUser(null);
        setIsReady(true);
        return;
      }

      const userObj = mapUser(session.user);
      setUser(userObj);
      setIsReady(true);

      // Fetch driver status
      supabase
        .from("driver_profiles")
        .select("is_online")
        .eq("user_id", userObj.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data && mounted) {
            setIsOnline(data.is_online);
          }
        });

      fetchDriverData(userObj.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Real-time subscription to orders updates + polling fallback
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("orders-changes-driver")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchDriverData(user.id);
        }
      )
      .subscribe();

    // Fallback polling every 10 seconds in case Postgres replication is disabled
    const interval = setInterval(() => {
      fetchDriverData(user.id);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const toggleOnline = async (onlineVal: boolean) => {
    if (!user) return;
    setIsOnline(onlineVal);
    const { error } = await supabase
      .from("driver_profiles")
      .upsert({
        user_id: user.id,
        is_online: onlineVal,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.error("Failed to update online status:", error.message);
    }
  };

  const acceptOrder = async (orderId: string | number) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("orders")
      .update({
        driver_id: user.id,
        status: "In Transit"
      })
      .eq("id", orderId)
      .is("driver_id", null)
      .select();
    
    if (error) {
      alert("Failed to accept order: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("Too slow! This order has already been accepted by another driver.");
    } else {
      const order = data[0];
      if (order.customer_id) {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userIds: [order.customer_id],
              title: "Order Dispatched! 🚴",
              message: "A delivery partner has accepted your order and is on the way!"
            })
          });
        } catch (err) {
          console.error("Failed to notify customer of assignment:", err);
        }
      }
    }

    fetchDriverData(user.id);
  };

  const updateOrderStatus = async (orderId: string | number, currentStatus: string) => {
    if (!user) return;
    let nextStatus = "Delivered";
    if (currentStatus === "Ready" || currentStatus === "Ready for Pickup" || currentStatus === "New" || currentStatus === "Preparing") {
      nextStatus = "In Transit";
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: nextStatus
      })
      .eq("id", orderId)
      .select();
    
    if (!error) {
      fetchDriverData(user.id);
      if (data && data.length > 0 && data[0].customer_id) {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userIds: [data[0].customer_id],
              title: nextStatus === "Delivered" ? "Order Delivered! 🎉" : "Order In Transit! 🚴",
              message: nextStatus === "Delivered" 
                ? "Your order has been delivered successfully. Enjoy your meal!" 
                : "Your delivery partner has picked up your food and is on the way."
            })
          });
        } catch (err) {
          console.error("Failed to notify customer of status update:", err);
        }
      }
    } else {
      alert("Failed to update status: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!isReady) {
    return <main className="min-h-screen bg-sky-50" />;
  }

  // Authenticated State (Sky Blue Theme Dashboard)
  if (user?.role === "driver") {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const progressPct = Math.min(100, Math.round((earnings / 3000) * 100));

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#BAE6FD] text-slate-800 font-sans antialiased select-none">
        {/* Navbar */}
        <nav className="h-[60px] px-10 bg-white/70 border-b border-sky-100 backdrop-blur-md flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-black tracking-tight text-[#3B82F6]">Quick</span>
            <span className="text-[20px] font-black tracking-tight text-slate-800">Dine</span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-4 py-1.5 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#22C55E] animate-pulse" : "bg-slate-450"}`} />
            <span className={`text-xs font-bold ${isOnline ? "text-[#22C55E]" : "text-slate-500"}`}>
              {isOnline ? "Online & Ready" : "Offline"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-sky-100 text-slate-500 hover:bg-sky-50 transition shadow-sm">
              <Bell className="h-4.5 w-4.5 text-sky-600" />
            </button>
            <div className="flex items-center gap-2 border-l border-sky-100 pl-4">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-[#93C5FD] font-semibold text-sm">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-none">{user.name}</span>
                <span className="text-[9px] font-black text-[#3B82F6] uppercase tracking-widest mt-0.5">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-sky-100 text-slate-550 hover:text-red-650 transition shadow-sm"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </nav>

        {/* Dashboard Body */}
        <div className="max-w-7xl mx-auto px-10 py-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Card 1 — Duty Status */}
            <div className="bg-white/80 border border-sky-100/60 rounded-[14px] p-5 shadow-lg shadow-sky-900/5 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-3">DUTY STATUS</div>
              <div className="bg-sky-50/50 p-1 rounded-xl flex border border-sky-100/50">
                <button
                  onClick={() => toggleOnline(true)}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                    isOnline
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => toggleOnline(false)}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                    !isOnline
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>

            {/* Card 2 — Daily Goal */}
            <div className="bg-white/80 border border-sky-100/60 rounded-[14px] p-5 shadow-lg shadow-sky-900/5 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">DAILY GOAL</div>
                  <div className="text-[22px] font-black text-slate-900 mt-1">₹{earnings}</div>
                </div>
                <div className="text-sm font-black text-sky-600 mt-1.5">{progressPct}%</div>
              </div>
              <div className="text-xs text-slate-500 mb-3">target of ₹3,000 today</div>
              <div className="w-full h-1 bg-sky-100 rounded-full overflow-hidden mb-3">
                <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                {earnings >= 3000 ? "Goal achieved today! 🎉" : `${Math.ceil((3000 - earnings) / 80)} more deliveries to reach your daily goal`}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Stat Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="bg-white/80 border border-sky-100/60 rounded-[14px] px-[18px] py-5 shadow-lg shadow-sky-900/5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">DELIVERIES</div>
                <div className="text-[28px] font-extrabold text-slate-800 tracking-tight mt-1">{completedCount}</div>
                <div className="text-[11px] font-semibold text-[#22C55E] mt-1.5 flex items-center gap-1">
                  <span>+15% from yesterday</span>
                </div>
              </div>
              {/* Stat 2 */}
              <div className="bg-white/80 border border-sky-100/60 rounded-[14px] px-[18px] py-5 shadow-lg shadow-sky-900/5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">EARNINGS</div>
                <div className="text-[28px] font-extrabold text-slate-800 tracking-tight mt-1">₹{earnings}</div>
                <div className="text-[11px] font-semibold text-[#22C55E] mt-1.5 flex items-center gap-1">
                  <span>+8% from yesterday</span>
                </div>
              </div>
              {/* Stat 3 */}
              <div className="bg-white/80 border border-sky-100/60 rounded-[14px] px-[18px] py-5 shadow-lg shadow-sky-900/5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">ONLINE</div>
                <div className="text-[28px] font-extrabold text-slate-800 tracking-tight mt-1">{isOnline ? onlineHours : "0.0"}h</div>
                <div className="text-[11px] font-semibold text-sky-600 mt-1.5 flex items-center gap-1">
                  <span>{isOnline ? "On track today" : "Offline"}</span>
                </div>
              </div>
              {/* Stat 4 */}
              <div className="bg-white/80 border border-sky-100/60 rounded-[14px] px-[18px] py-5 shadow-lg shadow-sky-900/5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">RATING</div>
                <div className="text-[28px] font-extrabold text-slate-800 tracking-tight mt-1">4.8 ⭐</div>
                <div className="text-[11px] font-semibold text-[#22C55E] mt-1.5 flex items-center gap-1">
                  <span>Excellent service</span>
                </div>
              </div>
            </div>

            {/* Active Deliveries Section */}
            <section className="bg-white/80 border border-sky-100/60 rounded-[14px] px-6 py-[22px] shadow-lg shadow-sky-900/5">
              <div className="flex items-center justify-between border-b border-sky-50 pb-4">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Active Deliveries</h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">Manage and track active drop-offs</p>
                </div>
                {isOnline && (
                  <div className="bg-sky-50 border border-sky-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
                    <span className="text-[10px] font-bold text-sky-600">Scanning</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Loading active dispatches...
                </div>
              ) : (
                <div className="mt-5 grid gap-3 grid-cols-1 md:grid-cols-2">
                  {isOnline ? (
                    deliveries.length > 0 ? (
                      deliveries.map((delivery) => {
                        const statusClass =
                          delivery.status === "Ready" || delivery.status === "Ready for Pickup" || delivery.status === "New" || delivery.status === "Preparing"
                            ? "bg-green-100 text-green-800"
                            : delivery.status === "In Transit"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700";

                        const isUnassigned = delivery.driverId === null;

                        return (
                          <div key={delivery.realId} className="flex flex-col rounded-xl overflow-hidden border border-sky-100 shadow-md bg-white">
                            {/* Top Content Zone */}
                            <div className="bg-sky-50/30 px-[18px] py-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-sky-600">{delivery.id}</span>
                                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-sky-500" />
                                  {delivery.distance}
                                </span>
                              </div>
                              
                              {/* Route tracker */}
                              <div className="flex items-center gap-2 py-1">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <div className={`flex-1 h-[2px] ${isUnassigned ? "bg-slate-200" : "bg-gradient-to-r from-green-500 to-sky-500"}`} />
                                <div className={`h-2 w-2 rounded-full ${isUnassigned ? "bg-slate-350" : "bg-sky-500"}`} />
                              </div>

                              {/* 3-column grid */}
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <div>
                                  <div className="text-[13px] font-bold text-slate-800 truncate">{delivery.store}</div>
                                  <div className="text-[10px] text-slate-400 truncate">Kitchen hub</div>
                                </div>
                                <div className="text-sky-200 px-1">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                                <div className="text-right">
                                  <div className="text-[13px] font-bold text-slate-800 truncate">{isUnassigned ? "Customer Address" : delivery.customerName}</div>
                                  <div className="text-[10px] text-slate-450 truncate">{delivery.address}</div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Footer Zone */}
                            <div className="bg-sky-50/70 border-t border-sky-100/50 px-[18px] py-3 flex justify-between items-center">
                              <span className="text-[16px] font-extrabold text-slate-900">{delivery.amount}</span>
                              {isUnassigned ? (
                                <button
                                  onClick={() => acceptOrder(delivery.realId)}
                                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] py-1.5 px-3 rounded-[6px] transition duration-200"
                                >
                                  Accept Order
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateOrderStatus(delivery.realId, delivery.status)}
                                  className={`px-3 py-1.5 rounded-[6px] text-[11px] font-bold ${statusClass}`}
                                >
                                  {delivery.status === "Ready" || delivery.status === "Ready for Pickup" || delivery.status === "New" || delivery.status === "Preparing"
                                    ? "Start Delivery"
                                    : "Complete Delivery"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-sky-50/10 rounded-xl border border-dashed border-sky-150">
                        <PackageCheck className="h-10 w-10 text-sky-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-bold text-sm">No deliveries found</p>
                        <p className="text-xs text-slate-400 mt-1">Check back soon for incoming dispatches.</p>
                      </div>
                    )
                  ) : (
                    <div className="col-span-2 text-center py-12 bg-sky-50/20 rounded-xl border border-dashed border-sky-100">
                      <Bike className="h-10 w-10 text-sky-400 mx-auto mb-3" />
                      <p className="text-slate-700 font-bold text-sm">Go Online to search for orders</p>
                      <p className="text-xs text-slate-400 mt-1">Switch duty status on the left sidebar.</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Live Map Section */}
            <section className="bg-white/80 border border-sky-100/60 rounded-[14px] px-6 py-[22px] shadow-lg shadow-sky-900/5">
              <div className="flex items-center justify-between border-b border-sky-50 pb-4">
                <h2 className="text-[15px] font-bold text-slate-900">Live Map</h2>
                <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-700">GPS Active</span>
                </div>
              </div>

              <div className="mt-5 bg-sky-50/30 border border-sky-100/35 rounded-[10px] h-[120px] flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Subtle grid pattern using SVG background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70c_1px,transparent_1px),linear-gradient(to_bottom,#0284c70c_1px,transparent_1px)] bg-[size:14px_24px]" />
                
                <button className="relative z-10 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-4 rounded-[6px] shadow-md transition duration-200">
                  Open Live Map →
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  // Unauthenticated State (Sky Blue Theme Landing Page)
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#BAE6FD] text-slate-800 relative overflow-hidden font-sans select-none">
      {/* Soft animated glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-sky-400/25 blur-[120px] animate-radial-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-blue-300/20 blur-[150px] pointer-events-none" />

      {/* Header/Navbar */}
      <header className="px-6 py-6 max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between rounded-full border border-sky-200/50 bg-white/40 px-6 py-3 shadow-[0_12px_40px_rgba(14,165,233,0.08)] backdrop-blur-md">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-sky-700 hover:text-sky-600 transition duration-300"
          >
            <MapPin className="h-4.5 w-4.5 text-sky-650 animate-pulse" />
            QuickDine
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold text-slate-650 transition duration-300 hover:text-sky-850 hover:bg-white/50"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-sky-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-[1.02]"
            >
              Register as Driver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pb-24 pt-12 max-w-6xl mx-auto relative z-10">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Deliver with QuickDine
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.15] tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700 bg-clip-text text-transparent md:text-7xl">
              Earn on your schedule. Deliver food fast.
            </h1>
            <p className="max-w-2xl text-md leading-relaxed text-slate-650">
              Deliver warm dishes to customers from their favorite local hubs. Leverage our real-time routes, optimized maps, and dynamic performance trackers to optimize your daily payouts.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="relative group overflow-hidden inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-sky-500 shadow-md hover:shadow-sky-550/15 hover:scale-[1.02]"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  Sign up to Deliver
                  <ArrowRight className="h-4 w-4" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-sky-200/75 bg-white/50 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-white/80 hover:border-sky-300"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Cards Panel */}
          <div className="rounded-[2.2rem] border border-sky-100 bg-white/60 p-4 shadow-[0_24px_60px_rgba(14,165,233,0.06)] backdrop-blur-sm relative">
            <div className="absolute inset-0 -z-10 rounded-[2.2rem] bg-gradient-to-b from-sky-300/10 to-transparent pointer-events-none" />
            <div className="grid gap-4">
              {driverFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group relative rounded-2xl border border-sky-100/50 bg-white/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(14,165,233,0.05)] hover:bg-white/80 overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-sky-100 p-2.5 text-sky-655 group-hover:text-sky-700 transition-colors duration-300">
                        <Icon className="h-5.5 w-5.5" />
                      </div>
                      <h2 className="text-md font-bold text-slate-900 group-hover:text-sky-850 transition-colors duration-300">{item.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-650 group-hover:text-slate-700 transition-colors duration-300">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
