import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceFromPdf } from "@/src/lib/gemini/geminiExtractor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No PDF files provided" }, { status: 400 });
    }

    // Convert files to buffers
    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
      }))
    );

    // Extract from all PDFs
    const { extractInvoicesFromPdfs } = await import("@/src/lib/gemini/geminiExtractor");
    const results = await extractInvoicesFromPdfs(fileBuffers);

    return NextResponse.json({
      count: results.length,
      results: results.map((r, i) => ({
        fileName: fileBuffers[i].fileName,
        ...r,
      })),
    });
  } catch (error) {
    console.error("Gemini extraction API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}