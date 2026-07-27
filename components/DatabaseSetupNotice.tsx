export function DatabaseSetupNotice({ message }: { message?: string }) {
  return (
    <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <div className="font-semibold">Η PostgreSQL βάση δεν είναι ακόμα συνδεδεμένη.</div>
      <div className="mt-1">
        Άνοιξε το <code className="rounded bg-amber-100 px-1">.env</code>, βάλε πραγματικά στοιχεία στο{" "}
        <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> και μετά τρέξε{" "}
        <code className="rounded bg-amber-100 px-1">npx prisma migrate dev</code> και{" "}
        <code className="rounded bg-amber-100 px-1">npx prisma db seed</code>.
      </div>
      {message ? <div className="mt-2 text-xs text-amber-800">{message}</div> : null}
    </div>
  );
}
