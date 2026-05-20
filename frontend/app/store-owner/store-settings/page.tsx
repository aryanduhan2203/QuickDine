import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";

const settingsGroups = [
  "Team access and permissions",
  "Notification preferences",
  "Business preferences and defaults",
  "Security and account controls",
];

export default function StoreSettingsPage() {
  return (
    <StoreOwnerShell
      title="Store settings"
      description="Configure the controls that shape how your business team uses the workspace."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {settingsGroups.map((group) => (
          <article
            key={group}
            className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40"
          >
            <h2 className="text-xl font-semibold">{group}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This section can later hold forms, switches, and member-management actions.
            </p>
          </article>
        ))}
      </div>
    </StoreOwnerShell>
  );
}
