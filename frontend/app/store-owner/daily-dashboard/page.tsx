import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";

const metrics = [
  { label: "Orders today", value: "48" },
  { label: "Peak hour", value: "1:00 PM" },
  { label: "Prep time", value: "18 min" },
  { label: "Store status", value: "Open" },
];

export default function DailyDashboardPage() {
  return (
    <StoreOwnerShell
      title="Daily dashboard"
      description="Start the day with a quick operational snapshot of orders, timing, and activity."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40"
          >
            <div className="text-sm text-slate-500">{metric.label}</div>
            <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
          </article>
        ))}
      </div>
    </StoreOwnerShell>
  );
}
