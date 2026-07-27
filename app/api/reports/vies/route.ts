import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/src/lib/db/prisma";
import { buildViesReport, toCsv } from "@/src/lib/reports/viesReportBuilder";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = Number(url.searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const format = url.searchParams.get("format") || "csv";
  const invoices = await prisma.invoice.findMany({
    where: { periodMonth: month, periodYear: year, status: { not: "excluded" } },
    include: { supplier: true },
  });
  const rows = buildViesReport(invoices);

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        "Χώρα": row.countryCode,
        "VAT number": row.vatNumber,
        "Προμηθευτής": row.supplierName,
        "Στήλη 5 αγαθά": row.goodsAmount,
        "Στήλη 7 υπηρεσίες": row.servicesAmount,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VIES");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vies-${year}-${month}.xlsx"`,
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vies-${year}-${month}.csv"`,
    },
  });
}
