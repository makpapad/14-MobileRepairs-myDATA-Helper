"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";

export default function UploadPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(formData: FormData) {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/invoices/upload", { method: "POST", body: formData });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? `Δημιουργήθηκαν ${result.count} παραστατικά.` : result.error || "Αποτυχία upload.");
  }

  return (
    <div>
      <PageHeader title="Upload PDF" description="Ανέβασε πολλά PDF τιμολόγια. Τα αρχεία αποθηκεύονται τοπικά στον φάκελο uploads και περνούν από parsing και rule engine." />
      <form action={upload} className="max-w-3xl rounded-md border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-800">PDF τιμολόγια</label>
        <input name="files" type="file" accept="application/pdf" multiple required className="mt-2 block w-full rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm" />
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            <FileUp className="h-4 w-4" />
            {loading ? "Parsing..." : "Upload και ανάγνωση"}
          </Button>
          {message ? <span className="text-sm text-slate-700">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
