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
  UserPlus
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Role = "user" | "store_owner";
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
  }
];

export default function AuthLanding({ initialMode = "login" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
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
        user?.user_metadata?.role === "store_owner" || user?.user_metadata?.role === "admin"
          ? user.user_metadata.role
          : "user";

      router.push(userRole === "store_owner" ? "/store-owner" : "/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f5fbf8_0%,_#ffffff_100%)] px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <MapPin className="h-4 w-4" />
            QuickDine
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Nearby food search
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              {pageTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {pageDescription}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {roles.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.value} className="rounded-2xl border bg-slate-50 p-4">
                    <Icon className="h-6 w-6 text-emerald-600" />
                    <h3 className="mt-3 font-semibold text-slate-950">{item.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-6 rounded-2xl bg-slate-100 p-1">
              <div className="grid grid-cols-2">
                <Link
                  href="/login"
                  className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                    mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                    mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Register
                </Link>
              </div>
            </div>

            {mode === "register" ? (
              <div className="space-y-4">
                <Input label="Full name" value={name} onChange={setName} />
                <Input label="Email" value={email} onChange={setEmail} type="email" />
                <Input label="Password" value={password} onChange={setPassword} type="password" />

                <div>
                  <label className="text-sm font-medium text-slate-700">Account type</label>
                  <div className="mt-2 grid gap-2">
                    {roles.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setRole(item.value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          role === item.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PrimaryButton
                  loading={loading}
                  onClick={handleRegister}
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  Create account
                </PrimaryButton>
              </div>
            ) : null}

            {mode === "login" ? (
              <div className="space-y-4">
                <Input label="Email" value={email} onChange={setEmail} type="email" />
                <Input label="Password" value={password} onChange={setPassword} type="password" />
                <PrimaryButton loading={loading} onClick={handleLogin} icon={<LogIn className="h-4 w-4" />}>
                  Login
                </PrimaryButton>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>
                  Need an account?{" "}
                  <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-600">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-emerald-500"
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
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {loading ? "Please wait..." : children}
    </button>
  );
}
