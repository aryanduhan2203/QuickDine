import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";

const insights = [
  "Discovery impressions",
  "Menu detail clicks",
  "Repeat customer trend",
  "Top converting dishes",
];

export default function PerformanceInsightsPage() {
  return (
    <StoreOwnerShell
      title="Performance insights"
      description="Understand what improves visibility, clicks, and conversions across your store listing."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <article
            key={insight}
            className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40"
          >
            <h2 className="text-xl font-semibold">{insight}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This panel can later hold charts, comparisons, and trend indicators.
            </p>
          </article>
        ))}
      </div>
    </StoreOwnerShell>
  );
}
