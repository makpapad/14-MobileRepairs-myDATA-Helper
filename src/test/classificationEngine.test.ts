import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { InvoiceKind, InvoiceStatus } from "@prisma/client";
import { parseInvoiceText } from "@/src/lib/pdf/pdfParser";
import { classifyInvoiceText } from "@/src/lib/classification/classificationEngine";

const fixturesDir = path.join(process.cwd(), "src", "lib", "fixtures");

async function classifyFixture(name: string) {
  const text = readFileSync(path.join(fixturesDir, `${name}.txt`), "utf8");
  return classifyInvoiceText(text, parseInvoiceText(text, `${name}.pdf`));
}

describe("classificationEngine", () => {
  it("classifies Google Ads as EU service VIES column 7", async () => {
    const result = await classifyFixture("google-ads");
    expect(result.supplierName).toBe("Google Ireland Limited");
    expect(result.invoiceKind).toBe(InvoiceKind.services);
    expect(result.viesServicesAmountCents / 100).toBe(51.77);
    expect(result.viesGoodsAmountCents / 100).toBe(0);
  });

  it("classifies Google Workspace as EU service", async () => {
    const result = await classifyFixture("google-workspace");
    expect(result.vatNumber).toBe("3668997OH");
    expect(result.vatClassification).toContain("365-Φ2");
  });

  it("classifies OpenAI reverse charge service", async () => {
    const result = await classifyFixture("openai");
    expect(result.isReverseCharge).toBe(true);
    expect(result.viesServicesAmountCents / 100).toBe(184.68);
  });

  it("classifies Hetzner reverse charge service", async () => {
    const result = await classifyFixture("hetzner");
    expect(result.countryCode).toBe("DE");
    expect(result.viesServicesAmountCents / 100).toBe(68.35);
  });

  it("classifies Marseus as EU goods including transport", async () => {
    const result = await classifyFixture("marseus");
    expect(result.invoiceKind).toBe(InvoiceKind.goods);
    expect(result.viesGoodsAmountCents / 100).toBe(745);
    expect(result.vatClassification).toContain("364-Φ2");
  });

  it("marks Google One as needs review and out of VIES", async () => {
    const result = await classifyFixture("google-one");
    expect(result.status).toBe(InvoiceStatus.needs_review);
    expect((result.viesGoodsAmountCents + result.viesServicesAmountCents) / 100).toBe(0);
  });

  it("classifies BOX NOW as domestic service", async () => {
    const result = await classifyFixture("box-now");
    expect(result.isDomestic).toBe(true);
    expect(result.vatClassification).toContain("361-Φ2");
  });
});
