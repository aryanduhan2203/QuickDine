"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LogOut,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
  ShoppingCart,
  Bike
} from "lucide-react";
import RestaurantSearch from "../components/RestaurantSearch";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "store_owner" | "driver";
  isVerified: boolean;
};

const roles = [
  {
    title: "User",
    description: "Search nearby restaurants, compare ratings, and jump straight into directions.",
    icon: UserRound
  },
  {
    title: "Store owner",
    description: "Claim your visibility and prepare for richer listing tools as the platform grows.",
    icon: Store
  },
  {
    title: "Driver",
    description: "Help customers receive their hot meals quickly and manage delivery dispatches.",
    icon: Bike
  },
  {
    title: "Admin",
    description: "Support the platform with oversight tools, account review, and operations control.",
    icon: ShieldCheck
  }
];

const highlights = [
  "Search restaurants around any city, area, or current location.",
  "See results on a map with address, rating, and distance details.",
  "Use one account system for customers and store owners."
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
      : "QuickDine User",
  email: user.email ?? "",
  role:
    user.user_metadata?.role === "store_owner" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.role === "driver"
      ? user.user_metadata.role
      : "user",
  isVerified: Boolean(user.email_confirmed_at),
});

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const checkCart = () => {
      const savedCart = sessionStorage.getItem("quickdine_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (parsed && Array.isArray(parsed.items)) {
            setCartCount(parsed.items.length);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setCartCount(0);
      }
    };

    checkCart();
    window.addEventListener("focus", checkCart);
    window.addEventListener("storage", checkCart);
    window.addEventListener("cartUpdated", checkCart);

    return () => {
      window.removeEventListener("focus", checkCart);
      window.removeEventListener("storage", checkCart);
      window.removeEventListener("cartUpdated", checkCart);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error || !data.session?.user) {
          setUser(null);
          setToken(null);
          setIsReady(true);
          return;
        }

        setToken(data.session.access_token);
        const mapped = mapUser(data.session.user);
        setUser(mapped);
        setIsReady(true);
        if (mapped.role === "driver") {
          router.push("/driver");
        } else if (mapped.role === "store_owner") {
          router.push("/store-owner");
        }
      } catch (err) {
        console.error("Session error:", err);
        if (mounted) {
          setUser(null);
          setToken(null);
          setIsReady(true);
        }
      }
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
        setToken(null);
        setIsReady(true);
        return;
      }

      setToken(session.access_token);
      const mapped = mapUser(session.user);
      setUser(mapped);
      setIsReady(true);
      if (mapped.role === "driver") {
        router.push("/driver");
      } else if (mapped.role === "store_owner") {
        router.push("/store-owner");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  if (!isReady) {
    return <main className="min-h-screen bg-slate-50" />;
  }

  if (user && token) {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <main className="min-h-screen bg-[#FFF8F3] font-sans antialiased selection:bg-orange-100 selection:text-[#E8440A]">
        {/* Navigation Bar */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/70 backdrop-blur-md py-3 shadow-[0_4px_30px_rgba(232,68,10,0.05)] border-b border-[#E8440A]/10" : "bg-transparent py-5"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <span className="text-[#E8440A]">Quick</span>Dine
            </div>
            
            <div className="flex items-center gap-6">
              {/* Cart Counter */}
              <Link href="/checkout" className="relative flex items-center justify-center bg-white border border-[rgba(0,0,0,0.08)] rounded-full w-[42px] h-[42px] p-[10px] text-[#1a1a1a] hover:text-[#E8440A] transition-colors duration-200 shadow-sm">
                <ShoppingCart className="h-full w-full" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-black leading-none text-white bg-[#E8440A] rounded-full shadow-[0_0_10px_rgba(232,68,10,0.4)]">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Profile Controls */}
              <div className="flex items-center gap-4 rounded-full bg-white/80 border border-slate-100 px-4 py-1.5 shadow-sm">
                <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
                  <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#E8440A] to-[#FF6B35] text-white font-extrabold text-xs shadow-[0_2px_10px_rgba(232,68,10,0.3)]">
                    {initials}
                  </div>
                  <div className="flex flex-col text-left hidden sm:flex">
                    <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                    <span className="text-[9px] font-black text-[#E8440A] uppercase tracking-widest">{user.role.replace("_", " ")}</span>
                  </div>
                </Link>
                <div className="h-5 w-[1px] bg-slate-200" />
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* The new Hero and Discovery Feed */}
        <RestaurantSearch />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(180deg,_#f8fffc_0%,_#eefaf5_46%,_#ffffff_100%)] text-slate-950 font-sans antialiased overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header/Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/60 backdrop-blur-md border-b border-emerald-500/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.02)]" : "bg-transparent py-5"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <MapPin className="h-4.5 w-4.5 animate-pulse text-emerald-500" />
            QuickDine
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-700 transition duration-300 hover:bg-emerald-500/10 hover:text-emerald-800"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-900 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Register
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero and Features layout */}
      <section className="px-6 pb-20 pt-32 max-w-6xl mx-auto">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="relative">
            {/* Animated background glow */}
            <div className="absolute -top-12 -left-12 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-[100px] animate-radial-pulse pointer-events-none" />

            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Nearby restaurant platform
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[1.15] tracking-tight bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-800 bg-clip-text text-transparent md:text-7xl">
              Find the best places to eat around you.
            </h1>
            
            <div className="animate-fade-slide-up mt-6">
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                QuickDine is shaping into a focused restaurant discovery experience with clean search,
                role-based access, and space to grow into richer store-owner tools.
              </p>

              {/* Call to Actions with Shimmer & Glassmorphism */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="relative group overflow-hidden inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-md hover:shadow-emerald-500/20"
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200/80 bg-white/40 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-350 hover:bg-white/60 hover:shadow-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/store-owner"
                  className="rounded-full border border-emerald-500/20 bg-emerald-50/40 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-500/40 hover:bg-emerald-50/70 hover:shadow-sm"
                >
                  For store owners
                </Link>
                <Link
                  href="/driver"
                  className="rounded-full border border-emerald-500/20 bg-emerald-50/40 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-500/40 hover:bg-emerald-50/70 hover:shadow-sm"
                >
                  For drivers
                </Link>
              </div>
            </div>

            {/* Highlights as Premium Pill Cards */}
            <div className="mt-12 grid gap-4 animate-fade-slide-up">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="relative overflow-hidden rounded-2xl border border-emerald-100/50 bg-white/70 pl-6 pr-4 py-4 text-sm leading-6 text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(16,185,129,0.05)]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500/80" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Panels */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Account roles dark card */}
            <div className="rounded-[2.2rem] border border-white bg-white/70 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="rounded-[1.8rem] bg-slate-950 p-6 text-white border-t-2 border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15)] relative overflow-hidden">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                  Account roles
                </p>
                <div className="mt-5 space-y-4">
                  {roles.map((role) => {
                    const Icon = role.icon;

                    return (
                      <div
                        key={role.title}
                        className="group relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:bg-white/[0.07] overflow-hidden"
                      >
                        {/* Animated thin left border highlight */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                        
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="text-md font-semibold text-slate-100 group-hover:text-white transition-colors duration-300">{role.title}</h2>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                          {role.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Search ready card - Mint Glassmorphism */}
            <div className="rounded-[2.2rem] border border-white bg-white/70 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="rounded-[1.8rem] border border-emerald-500/20 bg-emerald-50/40 backdrop-blur-sm p-6 transition duration-300 hover:bg-emerald-50/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Search ready
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  After login, this home page becomes the search screen so people can start exploring
                  restaurants immediately.
                </p>
                <Link
                  href="/store-owner"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-600 hover:translate-x-1 duration-200"
                >
                  Explore the store-owner experience
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-3 border-t border-emerald-500/10 pt-3">
                  <Link
                    href="/driver"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-600 hover:translate-x-1 duration-200"
                  >
                    Explore the driver experience
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
