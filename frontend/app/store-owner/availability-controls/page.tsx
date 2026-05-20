import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";

const controls = [
  "Pause selected items",
  "Edit today's service hours",
  "Switch to pickup only",
  "Handle rush-time menu reductions",
];

export default function AvailabilityControlsPage() {
  return (
    <StoreOwnerShell
      title="Availability controls"
      description="Adjust hours and menu availability quickly when service conditions change."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {controls.map((control) => (
          <article
            key={control}
            className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40"
          >
            <h2 className="text-xl font-semibold">{control}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              A fast operational toggle belongs here so staff can react without friction.
            </p>
          </article>
        ))}
      </div>
    </StoreOwnerShell>
  );
}
