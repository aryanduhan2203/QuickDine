// frontend/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, User as UserIcon, MapPin, Phone } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setName(data.user.user_metadata?.name || "");
        setPhone(data.user.user_metadata?.phone || "");
        setAddress(data.user.user_metadata?.address || "");
      } else {
        router.push("/");
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        name,
        phone,
        address
      }
    });

    if (error) {
      setMessage("Error saving profile.");
    } else {
      setMessage("Profile saved successfully! This will be your default delivery address.");
      setTimeout(() => setMessage(""), 3000);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
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
            My Profile
          </div>
          <div className="w-10" />
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 mt-10">
        <form onSubmit={handleSave} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Personal Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <UserIcon className="h-4 w-4 text-[#EA580C]" /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white" 
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Phone className="h-4 w-4 text-[#EA580C]" /> Phone Number
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <MapPin className="h-4 w-4 text-[#EA580C]" /> Default Delivery Address
              </label>
              <textarea 
                rows={4} 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required 
                placeholder="Where should we deliver your food?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white resize-none" 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 font-black text-lg text-white transition hover:bg-orange-500 active:scale-95 disabled:opacity-70 shadow-lg shadow-orange-900/20"
          >
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-5 w-5" /> Save Profile</>}
          </button>
          
          {message && (
            <p className={`mt-4 text-center font-bold ${message.includes("Error") ? "text-red-500" : "text-emerald-500"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
