import { prisma } from "./prisma";

export function dbErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.split("\n").find((line) => line.trim()) ?? error.message;
  return "Άγνωστο σφάλμα σύνδεσης βάσης.";
}

export async function getInvoiceFilters(searchParams: Record<string, string | string[] | undefined>) {
  const month = Number(searchParams.month || 0) || undefined;
  const year = Number(searchParams.year || 0) || undefined;
  const status = typeof searchParams.status === "string" && searchParams.status ? searchParams.status : undefined;
  const supplier = typeof searchParams.supplier === "string" && searchParams.supplier ? searchParams.supplier : undefined;
  const reverseCharge = searchParams.reverseCharge === "yes" ? true : searchParams.reverseCharge === "no" ? false : undefined;
  const vies = searchParams.vies === "yes" ? true : searchParams.vies === "no" ? false : undefined;

  return {
    where: {
      ...(month ? { periodMonth: month } : {}),
      ...(year ? { periodYear: year } : {}),
      ...(status ? { status: status as never } : {}),
      ...(reverseCharge !== undefined ? { isReverseCharge: reverseCharge } : {}),
      ...(supplier ? { supplier: { name: { contains: supplier, mode: "insensitive" as const } } } : {}),
      ...(vies === true ? { OR: [{ viesGoodsAmountCents: { gt: 0 } }, { viesServicesAmountCents: { gt: 0 } }] } : {}),
      ...(vies === false ? { viesGoodsAmountCents: 0, viesServicesAmountCents: 0 } : {}),
    },
  };
}

export async function getDashboardData(period?: { month?: number; year?: number }) {
  const now = new Date();
  const periodMonth = period?.month || now.getMonth() + 1;
  const periodYear = period?.year || now.getFullYear();
  try {
    const [currentMonth, needsReview, approved, invoices] = await Promise.all([
      prisma.invoice.count({ where: { periodMonth, periodYear } }),
      prisma.invoice.count({ where: { status: "needs_review" } }),
      prisma.invoice.count({ where: { status: "approved" } }),
      prisma.invoice.findMany({ where: { periodMonth, periodYear, status: { not: "excluded" } }, include: { supplier: true }, orderBy: { invoiceDate: "desc" } }),
    ]);
    const viesGoods = invoices.reduce((sum, invoice) => sum + Number(invoice.viesGoodsAmountCents) / 100, 0);
    const viesServices = invoices.reduce((sum, invoice) => sum + Number(invoice.viesServicesAmountCents) / 100, 0);
    return { currentMonth, needsReview, approved, viesGoods, viesServices, invoices, dbError: null };
  } catch (error) {
    return {
      currentMonth: 0,
      needsReview: 0,
      approved: 0,
      viesGoods: 0,
      viesServices: 0,
      invoices: [],
      dbError: dbErrorMessage(error),
    };
  }
}
