import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";

const reviewBuckets = [
  "Recent positive reviews",
  "Open service issues",
  "Awaiting response",
  "Resolved conversations",
];

export default function RespondToReviewsPage() {
  return (
    <StoreOwnerShell
      title="Respond to reviews"
      description="Monitor public feedback and reply in a way that protects trust and strengthens reputation."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {reviewBuckets.map((bucket) => (
          <article
            key={bucket}
            className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40"
          >
            <h2 className="text-xl font-semibold">{bucket}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This section can hold customer comments, sentiment cues, and quick response actions.
            </p>
          </article>
        ))}
      </div>
    </StoreOwnerShell>
  );
}
