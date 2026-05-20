"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bike,
  Clock3,
  Eye,
  Globe2,
  Phone,
  Save,
  Store,
  Truck,
  X,
} from "lucide-react";
import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";
import { supabase } from "../../../lib/supabase";

type DaySchedule = {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
};

const initialSchedule: DaySchedule[] = [
  { day: "Monday", open: "09:00", close: "22:00", enabled: true },
  { day: "Tuesday", open: "09:00", close: "22:00", enabled: true },
  { day: "Wednesday", open: "09:00", close: "22:00", enabled: true },
  { day: "Thursday", open: "09:00", close: "22:00", enabled: true },
  { day: "Friday", open: "09:00", close: "23:00", enabled: true },
  { day: "Saturday", open: "10:00", close: "23:00", enabled: true },
  { day: "Sunday", open: "10:00", close: "21:30", enabled: true },
];

export default function ManageStorePage() {
  const [storeName, setStoreName] = useState("Aryan's Kitchen");
  const [tagline, setTagline] = useState("Comfort food, quick service, and late-night favorites.");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("owner@aryanskitchen.com");
  const [address, setAddress] = useState("Sector 18 Market, Noida, Uttar Pradesh");
  const [description, setDescription] = useState(
    "Quick service kitchen serving North Indian staples, rice bowls, snacks, and evening meals."
  );
  const [serviceRadius, setServiceRadius] = useState(6);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [cuisines, setCuisines] = useState<string[]>(["North Indian", "Chinese", "Biryani", "Street Food"]);
  const [newCuisine, setNewCuisine] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  useEffect(() => {
    async function loadStoreProfile() {
      setIsLoadingProfile(true);
      setSaveMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;

      if (authError || !user) {
        setSaveMessage(authError?.message || "You must be signed in as a store owner.");
        setIsLoadingProfile(false);
        return;
      }

      const { data: existingProfile, error: fetchError } = await supabase
        .from("store_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setSaveMessage(fetchError.message);
        setIsLoadingProfile(false);
        return;
      }

      let profile = existingProfile;

      if (!profile) {
        const { data: insertedProfile, error: insertError } = await supabase
          .from("store_profiles")
          .insert({
            user_id: user.id,
            store_name: user.user_metadata?.name ?? "",
            business_email: user.email ?? "",
            tagline: "",
            phone: "",
            address: "",
            description: "",
            service_radius: 6,
            pickup_enabled: true,
            delivery_enabled: true,
            is_visible: true,
            is_featured: false,
            is_accepting_orders: true,
            schedule: initialSchedule,
          })
          .select()
          .single();

        if (insertError) {
          setSaveMessage(insertError.message);
          setIsLoadingProfile(false);
          return;
        }

        profile = insertedProfile;
      }

      if (profile) {
        setStoreName(profile.store_name || "");
        setTagline(profile.tagline || "");
        setPhone(profile.phone || "");
        setEmail(profile.business_email || "");
        setAddress(profile.address || "");
        setDescription(profile.description || "");
        setServiceRadius(profile.service_radius || 6);
        setPickupEnabled(profile.pickup_enabled ?? true);
        setDeliveryEnabled(profile.delivery_enabled ?? true);
        setIsVisible(profile.is_visible ?? true);
        setIsFeatured(profile.is_featured ?? false);
        setIsAcceptingOrders(profile.is_accepting_orders ?? true);
        setSchedule(profile.schedule || initialSchedule);
        if (profile.cuisine_tags && Array.isArray(profile.cuisine_tags)) {
          setCuisines(profile.cuisine_tags);
        }
      }

      setIsLoadingProfile(false);
    }

    loadStoreProfile();
  }, []);


  const handleScheduleChange = (
    index: number,
    field: "open" | "close" | "enabled",
    value: string | boolean
  ) => {
    setSchedule((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleAddCuisine = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = newCuisine.trim();
      if (trimmed && !cuisines.includes(trimmed)) {
        setCuisines([...cuisines, trimmed]);
      }
      setNewCuisine("");
    }
  };

  const handleRemoveCuisine = (tagToRemove: string) => {
    setCuisines(cuisines.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    setSaveMessage("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      setSaveMessage(authError?.message || "You must be signed in as a store owner.");
      return;
    }

    const { error } = await supabase
      .from("store_profiles")
      .update({
        store_name: storeName,
        tagline,
        phone,
        business_email: email,
        address,
        description,
        cuisine_tags: cuisines,
        service_radius: serviceRadius,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        is_visible: isVisible,
        is_featured: isFeatured,
        is_accepting_orders: isAcceptingOrders,
        schedule,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    setSaveMessage("Store profile saved.");
  };


  return (
    <StoreOwnerShell
      title="Manage your store"
      description="Keep your core business details accurate so customers always see the right information."
    >
      <div className="space-y-6">
        {isLoadingProfile ? (
          <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 text-sm text-slate-600">
            Loading your store profile...
          </div>
        ) : null}
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <Store className="h-4 w-4" />
                  Business profile
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Store identity and public profile</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  This is the information customers will read first when they discover your store.
                </p>
              </div>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
              >
                <Save className="h-4 w-4" />
                Save draft
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Store name">
                <input
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Contact number">
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Business email">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Primary location">
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Short headline">
                <input
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Store description">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={`${inputClassName} resize-none`}
                />
              </Field>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-slate-600 mb-2">Cuisine tags</div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  value={newCuisine}
                  onChange={(e) => setNewCuisine(e.target.value)}
                  onKeyDown={handleAddCuisine}
                  className={inputClassName}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {cuisines.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 pl-3 pr-2 py-1.5 text-sm text-emerald-700"
                  >
                    {cuisine}
                    <button
                      type="button"
                      onClick={() => handleRemoveCuisine(cuisine)}
                      className="rounded-full p-0.5 hover:bg-emerald-200 text-emerald-700 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {saveMessage ? (
              <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {saveMessage}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            <Panel
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Listing health"
              content={
                <div className="space-y-4">
                  <Metric label="Profile completion" value="86%" />
                  <Metric label="Customer response" value="Fast" />
                  <Metric label="Menu freshness" value="Updated today" />
                </div>
              }
            />

            <Panel
              icon={<Phone className="h-5 w-5" />}
              title="Contact preview"
              content={
                <div className="space-y-3 text-sm text-slate-600">
                  <div>{phone}</div>
                  <div>{email}</div>
                  <div>{address}</div>
                </div>
              }
            />

            <Panel
              icon={<Eye className="h-5 w-5" />}
              title="Public visibility"
              content={
                <div className="space-y-3">
                  <ToggleRow
                    label="Visible in discovery"
                    description="Customers can find your store in search."
                    checked={isVisible}
                    onChange={setIsVisible}
                  />
                  <ToggleRow
                    label="Accepting orders"
                    description="Allow new orders during service hours."
                    checked={isAcceptingOrders}
                    onChange={setIsAcceptingOrders}
                  />
                  <ToggleRow
                    label="Featured placement"
                    description="Priority merchandising when approved."
                    checked={isFeatured}
                    onChange={setIsFeatured}
                  />
                </div>
              }
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Opening hours</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Keep live hours accurate during weekdays, weekends, and rush-time changes.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={item.day}
                  className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[120px_1fr_1fr_auto]"
                >
                  <div className="flex items-center text-sm font-semibold text-slate-900">{item.day}</div>
                  <input
                    type="time"
                    value={item.open}
                    disabled={!item.enabled}
                    onChange={(event) => handleScheduleChange(index, "open", event.target.value)}
                    className={inputClassName}
                  />
                  <input
                    type="time"
                    value={item.close}
                    disabled={!item.enabled}
                    onChange={(event) => handleScheduleChange(index, "close", event.target.value)}
                    className={inputClassName}
                  />
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600">
                    Open
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) =>
                        handleScheduleChange(index, "enabled", event.target.checked)
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Delivery zone</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Adjust your service range and pickup fallback without touching the menu.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Service radius</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Current coverage for local delivery requests.
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                    {serviceRadius} km
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={serviceRadius}
                  onChange={(event) => setServiceRadius(Number(event.target.value))}
                  className="mt-5 w-full"
                />

                <div className="mt-5 space-y-3">
                  <ToggleRow
                    label="Delivery enabled"
                    description="Allow delivery orders inside your service radius."
                    checked={deliveryEnabled}
                    onChange={setDeliveryEnabled}
                    icon={<Truck className="h-4 w-4" />}
                  />
                  <ToggleRow
                    label="Pickup enabled"
                    description="Let customers place pickup orders when delivery is unavailable."
                    checked={pickupEnabled}
                    onChange={setPickupEnabled}
                    icon={<Bike className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">What customers see</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    A quick preview of the public profile tone and status.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <div className="text-xl font-semibold text-slate-900">{storeName}</div>
                <p className="mt-2 text-sm text-emerald-700">{tagline}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StoreOwnerShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-600">{label}</div>
      {children}
    </label>
  );
}

function Panel({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-5">{content}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex gap-3">
        {icon ? <div className="mt-0.5 text-emerald-700">{icon}</div> : null}
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
      />
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200/50 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400";
