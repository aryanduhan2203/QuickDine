"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquareText,
  MoveRight,
  NotebookPen,
  PackageCheck,
  PanelLeft,
  Store,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { storeOwnerNavItems, storeOwnerOpsCards } from "../../components/store-owner/storeOwnerConfig";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "store_owner";
  isVerified: boolean;
};

const ownerFeatures = [
  {
    title: "Manage your store",   
    description:
      "Control business details, opening hours, contact info, delivery zones, and profile visibility.",
    icon: Store,
  },
  {
    title: "Update menu",
    description:
      "Refresh dishes, prices, combos, availability, and featured items without waiting on support.",
    icon: NotebookPen,
  },
  {
    title: "Track orders",
    description:
      "Follow incoming orders, prep timing, and fulfillment status from one operational view.",
    icon: PackageCheck,
  },
  {
    title: "Respond to reviews",
    description:
      "See customer feedback, handle service issues, and protect your public reputation.",
    icon: MessageSquareText,
  },
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

export default function StoreOwnerPage() {
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

  if (user?.role === "store_owner") {
    return (
      <main className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-300/20 blur-[100px]" />
        <div className="absolute top-40 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-teal-200/20 blur-[120px]" />

        <section className="px-6 py-6 md:px-10 lg:py-8 border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-sm border border-emerald-100">
                <Store className="h-4 w-4" />
                Store Owner Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Manage your store with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">confidence.</span>
              </h1>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-1 rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-lg transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-500">Signed in as</div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {user.role.replace("_", " ")}
                </div>
              </div>
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

            <section className="space-y-8">
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                {/* Control Panel */}
                <div className="flex flex-col h-full rounded-3xl border border-slate-200/50 bg-white p-8 shadow-xl shadow-slate-200/40 transition-all hover:shadow-2xl hover:shadow-slate-200/50">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <PanelLeft className="h-4 w-4" />
                      Quick Actions
                    </div>
                  </div>

                  <div className="mt-auto mb-auto pt-6 grid gap-4 md:grid-cols-3">
                    <Link
                      href="/store-owner/manage-store"
                      className="group flex flex-col justify-center items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 py-8 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md text-center"
                    >
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-200 group-hover:text-emerald-700">
                        <Store className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">Store Setup</div>
                        <div className="mt-1.5 text-xs text-slate-500 group-hover:text-emerald-600">Details & hours</div>
                      </div>
                    </Link>
                    <Link
                      href="/store-owner/update-menu"
                      className="group flex flex-col justify-center items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 py-8 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md text-center"
                    >
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-200 group-hover:text-emerald-700">
                        <NotebookPen className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">Menu Updates</div>
                        <div className="mt-1.5 text-xs text-slate-500 group-hover:text-emerald-600">Pricing & dishes</div>
                      </div>
                    </Link>
                    <Link
                      href="/store-owner/track-orders"
                      className="group flex flex-col justify-center items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 py-8 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md text-center"
                    >
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-200 group-hover:text-emerald-700">
                        <PackageCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">Order Flow</div>
                        <div className="mt-1.5 text-xs text-slate-500 group-hover:text-emerald-600">Prep & status</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Today at a glance */}
                <div className="flex flex-col rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-8 shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Daily Insights
                  </p>
                  <div className="mt-6 flex-1 space-y-4">
                    <div className="group rounded-2xl border border-white bg-white/60 p-4 backdrop-blur transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-transform group-hover:scale-110">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-900">Performance</div>
                      </div>
                    </div>
                    <div className="group rounded-2xl border border-white bg-white/60 p-4 backdrop-blur transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-transform group-hover:scale-110">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-900">Reviews</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/store-owner/daily-dashboard"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-100/50 px-4 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-200/50 hover:text-emerald-800"
                  >
                    Open Full Dashboard
                    <MoveRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Operational areas */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-8 shadow-xl shadow-slate-200/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Operations Hub
                    </p>
                  </div>
                  <Link
                    href="/store-owner/store-settings"
                    className="group inline-flex items-center gap-2 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-emerald-700"
                  >
                    All Settings
                    <MoveRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {storeOwnerOpsCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center transition-all hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                      >
                        <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-sm transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    );
  }

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
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Register as owner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 text-white">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Store owner experience
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
              Run your restaurant presence with less friction.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/85">
              QuickDine for store owners is built around real operations: keep your menu current,
              manage incoming orders, stay visible, and respond to customers without jumping across
              disconnected tools.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50"
              >
                Start as a store owner
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in to manage store
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="grid gap-4">
              {storeOwnerOpsCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-emerald-50/75">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Built for operations
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Everything a store owner expects to control.
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {ownerFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                >
                  <div className="inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
