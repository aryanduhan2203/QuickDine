"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LogOut,
  MapPin,
  ShieldCheck,
  Store,
  UserRound
} from "lucide-react";
import RestaurantSearch from "../components/RestaurantSearch";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "store_owner";
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
    user.user_metadata?.role === "store_owner" || user.user_metadata?.role === "admin"
      ? user.user_metadata.role
      : "user",
  isVerified: Boolean(user.email_confirmed_at),
});

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
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
      setUser(mapUser(data.session.user));
      setIsReady(true);
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
      setUser(mapUser(session.user));
      setIsReady(true);
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
    return (
      <main className="min-h-screen bg-[#FDFBF7] font-sans">
        {/* Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <span className="text-[#EA580C]">Quick</span>Dine
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 rounded-full bg-white px-5 py-2 shadow-sm border border-slate-100">
              <Link href="/profile" className="flex flex-col text-right hover:opacity-70 transition cursor-pointer">
                <span className="text-sm font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[10px] font-black text-[#EA580C] uppercase tracking-widest">{user.role.replace("_", " ")}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          </div>
        </nav>

        {/* The new Hero and Discovery Feed */}
        <RestaurantSearch />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(180deg,_#f8fffc_0%,_#eefaf5_46%,_#ffffff_100%)] text-slate-950">
      <section className="px-4 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <MapPin className="h-4 w-4" />
            QuickDine
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Register
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Nearby restaurant platform
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
              Find the best places to eat around you without the usual clutter.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              QuickDine is shaping into a focused restaurant discovery experience with clean search,
              role-based access, and space to grow into richer store-owner tools.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/store-owner"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                For store owners
              </Link>
            </div>

            <div className="mt-10 grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-emerald-100 bg-white/90 px-4 py-4 text-sm leading-6 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Account roles
              </p>
              <div className="mt-5 space-y-4">
                {roles.map((role) => {
                  const Icon = role.icon;

                  return (
                    <div
                      key={role.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold">{role.title}</h2>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {role.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Search ready
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                After login, this home page becomes the search screen so people can start exploring
                restaurants immediately.
              </p>
              <Link
                href="/store-owner"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-700"
              >
                Explore the store-owner experience
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
