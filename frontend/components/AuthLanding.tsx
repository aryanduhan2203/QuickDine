"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  LogIn,
  MapPin,
  Store,
  UserRound,
  UserPlus,
  Bike,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Role = "user" | "store_owner" | "driver";
type Mode = "login" | "register";

type Props = {
  initialMode?: Mode;
};

const roles: Array<{
  value: Role;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    value: "user",
    label: "User",
    description: "Search restaurants and save food discoveries.",
    icon: UserRound
  },
  {
    value: "store_owner",
    label: "Store owner",
    description: "Manage restaurant details and customer visibility.",
    icon: Store
  },
  {
    value: "driver",
    label: "Driver",
    description: "Manage deliveries and track dispatch routes.",
    icon: Bike
  }
];

export default function AuthLanding({ initialMode = "login" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isLoginMode = mode === "login";
  const pageTitle = isLoginMode ? "Welcome back" : "Create your account";
  const pageDescription = isLoginMode
    ? "Sign in to continue into the QuickDine experience."
    : "Pick the role that fits you and create your QuickDine account with Supabase auth.";

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name: name.trim(),
      role,
    },
  },
});

if (signUpError) {
  throw signUpError;
}

const user = signUpData.user;

if (user) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    name: name.trim(),
    email,
    role,
    phone: "",
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    throw profileError;
  }

  if (role === "store_owner") {
    const { error: storeProfileError } = await supabase.from("store_profiles").upsert({
      user_id: user.id,
      store_name: name.trim(),
      business_email: email,
      updated_at: new Date().toISOString(),
    });

    if (storeProfileError) {
      throw storeProfileError;
    }
  }

  if (role === "driver") {
    const { error: driverProfileError } = await supabase.from("driver_profiles").upsert({
      user_id: user.id,
      vehicle_type: "bike",
      is_online: false,
      updated_at: new Date().toISOString(),
    });

    if (driverProfileError) {
      throw driverProfileError;
    }
  }
}


      setMessage(
        "Registration successful. Check your email for the Supabase confirmation link or OTP, then sign in."
      );
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userRole =
        user?.user_metadata?.role === "store_owner" ||
        user?.user_metadata?.role === "admin" ||
        user?.user_metadata?.role === "driver"
          ? user.user_metadata.role
          : "user";

      if (userRole === "store_owner") {
        router.push("/store-owner");
      } else if (userRole === "driver") {
        router.push("/driver");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),linear-gradient(180deg,_#f8fffc_0%,_#eefaf5_46%,_#ffffff_100%)] px-6 py-12 font-sans antialiased overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <section className="mx-auto max-w-6xl relative">
        {/* Faint animated background glow */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px] animate-radial-pulse pointer-events-none" />

        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/40 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition duration-300 hover:bg-white/70 hover:border-slate-350 hover:translate-x-[-2px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100/50 bg-emerald-50/50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <MapPin className="h-4 w-4 animate-pulse text-emerald-500" />
            QuickDine
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_440px] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Nearby food search
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-800 bg-clip-text text-transparent md:text-6xl">
              {pageTitle}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-650">
              {pageDescription}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              {roles.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.value}
                    className="relative overflow-hidden rounded-2xl border border-emerald-100/30 bg-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition duration-350 hover:scale-[1.01] hover:shadow-[0_10px_30px_rgba(16,185,129,0.04)]"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500/60" />
                    <Icon className="h-6 w-6 text-emerald-600" />
                    <h3 className="mt-3 font-bold text-slate-900">{item.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frosted Glass Form Card */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-md relative overflow-visible animate-fade-slide-up">
            <div className="mb-6 rounded-2xl bg-emerald-950/[0.03] border border-emerald-550/5 p-1">
              <div className="grid grid-cols-2">
                <Link
                  href="/login"
                  className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition duration-300 ${
                    mode === "login"
                      ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition duration-300 ${
                    mode === "register"
                      ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  Register
                </Link>
              </div>
            </div>

            {mode === "register" ? (
              <div className="space-y-4 animate-fade-slide-up">
                <Input label="Full name" value={name} onChange={setName} />
                <Input label="Email" value={email} onChange={setEmail} type="email" />
                <Input label="Password" value={password} onChange={setPassword} type="password" />

                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-slate-700">Account type</label>
                  
                  <button
                    type="button"
                    onClick={() => setShowRoleSelector(!showRoleSelector)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white/40 px-4 py-3.5 text-left text-sm font-semibold text-slate-800 transition hover:border-slate-350 hover:bg-white/60 flex items-center justify-between outline-none focus:border-emerald-500/80"
                  >
                    <span>{roles.find((item) => item.value === role)?.label}</span>
                    {showRoleSelector ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </button>

                  {showRoleSelector && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-fade-slide-up space-y-1">
                      {roles.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setRole(item.value);
                            setShowRoleSelector(false);
                          }}
                          className={`w-full rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                            role === item.value
                              ? "bg-emerald-50 text-emerald-900 border border-emerald-100/50"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span>{item.label}</span>
                          {role === item.value && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <PrimaryButton
                    loading={loading}
                    onClick={handleRegister}
                    icon={<UserPlus className="h-4 w-4" />}
                  >
                    Create account
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {mode === "login" ? (
              <div className="space-y-4 animate-fade-slide-up">
                <Input label="Email" value={email} onChange={setEmail} type="email" />
                <Input label="Password" value={password} onChange={setPassword} type="password" />
                <div className="pt-2">
                  <PrimaryButton loading={loading} onClick={handleLogin} icon={<LogIn className="h-4 w-4" />}>
                    Login
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 animate-pulse">{message}</p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50/80 border border-red-100 px-4 py-3 text-sm text-red-800">{error}</p>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>
                  Need an account?{" "}
                  <Link href="/register" className="font-bold text-emerald-700 hover:text-emerald-600 transition">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-600 transition">
                    Login
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200/80 bg-white/40 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all duration-300 focus:border-emerald-500/80 focus:bg-white/80 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      />
    </label>
  );
}

function PrimaryButton({
  children,
  icon,
  loading,
  onClick
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative overflow-hidden group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 font-bold text-white transition-all duration-300 hover:bg-emerald-500 shadow-md hover:shadow-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        {loading ? "Please wait..." : children}
      </span>
      {!loading && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}
    </button>
  );
}
