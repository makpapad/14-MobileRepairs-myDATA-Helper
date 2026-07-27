import { PrismaClient } from "@prisma/client";
import { validateInvoiceExtraction } from "@/src/lib/validation/invoiceSchema";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

function createPrismaClient() {
  const prismaBase = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Extend Prisma with validation middleware
  return prismaBase.$extends({
    query: {
      invoice: {
        async create({ args, query }) {
          const validationData = buildValidationData(args.data);
          if (validationData) {
            const result = validateInvoiceExtraction(validationData);
            if (!result.success) {
              throw new Error(`Invoice validation failed: ${result.errors.join("; ")}`);
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          const validationData = buildValidationData(args.data);
          if (validationData) {
            const result = validateInvoiceExtraction(validationData);
            if (!result.success) {
              throw new Error(`Invoice validation failed: ${result.errors.join("; ")}`);
            }
          }
          return query(args);
        },
      },
    },
  });
}

function buildValidationData(data: any) {
  if (!data.netAmount || !data.vatAmount) return null;
  
  return {
    supplierName: data.supplier?.connect?.id ? undefined : data.supplierName,
    supplierVat: undefined,
    supplierCountry: undefined,
    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    netAmount: data.netAmount,
    vatAmount: data.vatAmount,
    grossAmount: data.grossAmount,
    vatRate: data.vatRate,
    currency: data.currency,
    isReverseCharge: data.isReverseCharge,
    mydataInvoiceType: data.myDataInvoiceType,
    expenseCategory: data.expenseCategory,
    e3Code: data.e3Code,
    vatClassification: data.vatClassification,
    viesEligible: (data.viesGoodsAmount && Number(data.viesGoodsAmount) > 0) || 
                  (data.viesServicesAmount && Number(data.viesServicesAmount) > 0),
    viesColumn: data.viesGoodsAmount && Number(data.viesGoodsAmount) > 0 ? "5_GOODS" :
                data.viesServicesAmount && Number(data.viesServicesAmount) > 0 ? "7_SERVICES" : "NONE",
    lines: data.lines?.create?.map((l: any) => ({
      description: l.description,
      netAmount: l.netAmount,
      vatRate: l.vatRate,
      vatAmount: l.vatAmount,
      grossAmount: l.grossAmount,
      lineType: l.lineType,
      expenseCategory: l.expenseCategory,
      e3Code: l.e3Code,
      vatClassification: l.vatClassification,
    })) ?? [],
  };
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
