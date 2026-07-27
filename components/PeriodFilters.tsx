import { Button } from "@/components/ui";

export const monthOptions = [
  { value: "1", label: "Ιανουάριος" },
  { value: "2", label: "Φεβρουάριος" },
  { value: "3", label: "Μάρτιος" },
  { value: "4", label: "Απρίλιος" },
  { value: "5", label: "Μάιος" },
  { value: "6", label: "Ιούνιος" },
  { value: "7", label: "Ιούλιος" },
  { value: "8", label: "Αύγουστος" },
  { value: "9", label: "Σεπτέμβριος" },
  { value: "10", label: "Οκτώβριος" },
  { value: "11", label: "Νοέμβριος" },
  { value: "12", label: "Δεκέμβριος" },
];

const quarterOptions = [
  { value: "1", label: "Α' τρίμηνο" },
  { value: "2", label: "Β' τρίμηνο" },
  { value: "3", label: "Γ' τρίμηνο" },
  { value: "4", label: "Δ' τρίμηνο" },
];

export function MonthYearFilter({
  month,
  year,
  submitLabel = "Εμφάνιση",
  className = "",
}: {
  month?: string | number;
  year?: string | number;
  submitLabel?: string;
  className?: string;
}) {
  return (
    <form className={`mb-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4 ${className}`}>
      <Select label="Μήνας" name="month" defaultValue={String(month ?? "")} options={monthOptions} placeholder="Όλοι οι μήνες" />
      <YearSelect year={year} />
      <Button type="submit" variant="secondary">{submitLabel}</Button>
    </form>
  );
}

export function VatPeriodFilter({ month, quarter, year }: { month?: string | number; quarter?: string | number; year?: string | number }) {
  return (
    <form className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
      <Select label="Μήνας" name="month" defaultValue={String(month ?? "")} options={monthOptions} placeholder="Χωρίς μήνα" />
      <Select label="Τρίμηνο" name="quarter" defaultValue={String(quarter ?? "")} options={quarterOptions} placeholder="Χωρίς τρίμηνο" />
      <YearSelect year={year} />
      <Button type="submit" variant="secondary">Εμφάνιση</Button>
      <div className="basis-full text-xs text-slate-500">Αν επιλέξεις τρίμηνο, υπερισχύει του μήνα.</div>
    </form>
  );
}

export function YearSelect({ year }: { year?: string | number }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([2026, currentYear, currentYear - 1, currentYear + 1])).sort((a, b) => b - a);
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">Έτος</span>
      <select name="year" defaultValue={String(year ?? currentYear)} className="h-10 min-w-32 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600">
        {years.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 min-w-44 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
