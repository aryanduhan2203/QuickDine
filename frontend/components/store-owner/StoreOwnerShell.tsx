"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ArrowLeft, LogOut, MapPin, Store } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { storeOwnerNavItems } from "./storeOwnerConfig";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "store_owner";
  isVerified: boolean;
};

type Props = {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
};

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

export default function StoreOwnerShell({
  title,
  description,
  eyebrow = "Store owner workspace",
  children,
}: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

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
        setIsReady(true);
        return;
      }

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
    setUser(null);
  };

  if (!isReady) {
    return <main className="min-h-screen bg-slate-50" />;
  }

  if (user?.role !== "store_owner") {
    // Keep the dark landing page fallback for unauthorized access
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,_#08120f_0%,_#10211d_38%,_#f3fbf7_38%,_#f8fafc_100%)] text-slate-950">
        <section className="px-4 py-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/90 transition hover:text-white"
            >
              <MapPin className="h-4 w-4" />
              QuickDine
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Register as owner
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <div className="inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
              Store-owner pages are reserved for store-owner accounts.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Sign in with a store-owner account to manage store details, update menu items, track
              orders, and respond to reviews from this workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Create store-owner account
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-300/20 blur-[100px]" />
      <div className="absolute top-40 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-teal-200/20 blur-[120px]" />

      <section className="px-6 py-6 md:px-10 lg:py-8 border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Link
              href="/store-owner"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-sm border border-emerald-100 transition hover:bg-emerald-100"
            >
              <Store className="h-4 w-4" />
              {eyebrow}
            </Link>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              {description}
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-1 rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <ArrowLeft className="h-4 w-4" />
                <Link href="/" className="hover:text-slate-800 transition">
                  Customer home
                </Link>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                {user.role.replace("_", " ")}
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">Signed in as</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <button
              onClick={handleLogout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-8 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200/50 bg-white/60 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
            <p className="mb-4 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </p>
            <nav className="space-y-1">
              {storeOwnerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-600 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className={`rounded-xl p-2 transition-colors ${isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-900"}`}>
                      {item.title}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-8">{children}</section>
        </div>
      </section>
    </main>
  );
}
