import * as devalue from "devalue";
import JSZip from "jszip";

export type CustomFileType = {
  name: string;
  type: "image" | "pdf";
  data: string;
};

export const NEW_ID = "__new__";

export const InvoiceTypes = [
  "Vorschuss",
  "Einahme",
  "Fahrkosten",
  "Unterkunft",
  "Verpflegung",
  "Material",
  "Sonstiges",
] as const;

export type InvoiceType = (typeof InvoiceTypes)[number];

export type Invoice = {
  id: string;
  manual_id: string;
  amount: number;
  type: InvoiceType;
  description: string;
  date: Date;
  files?: CustomFileType[];
};

export type Bill = {
  id: string;
  name: string;
  responsiblePerson: string;
  iban: string;
  date: Date;
  invoices: Invoice[];
  files?: CustomFileType[];
};

export class LocalStorageDB {
  private readonly BILLS_KEY = "bills";

  public getBills(): Bill[] {
    const data = localStorage.getItem(this.BILLS_KEY);
    return data ? devalue.parse(data) : [];
  }

  public getBill(id: string): Bill | undefined {
    return this.getBills().find((bill) => bill.id === id);
  }

  public addOrUpdateBill(bill: Bill): void {
    const bills = this.getBills();

    if (bill.id === NEW_ID) {
      const newBill = { ...bill, id: crypto.randomUUID() };
      bills.push(newBill);
    } else {
      const index = bills.findIndex((b) => b.id === bill.id);
      if (index >= 0) {
        bills[index] = bill;
      } else {
        bills.push(bill);
      }
    }

    localStorage.setItem(this.BILLS_KEY, devalue.stringify(bills));
  }

  public deleteBill(id: string): void {
    const bills = this.getBills().filter((bill) => bill.id !== id);
    localStorage.setItem(this.BILLS_KEY, devalue.stringify(bills));
  }

  public addOrUpdateInvoiceToBill(billId: string, invoice: Invoice): void {
    const bill = this.getBill(billId);
    if (!bill) return;

    let newInvoice: Invoice;

    if (invoice.id === NEW_ID) {
      newInvoice = { ...invoice, id: crypto.randomUUID() };
      bill.invoices.push(newInvoice);
    } else {
      const index = bill.invoices.findIndex((inv) => inv.id === invoice.id);
      if (index >= 0) {
        bill.invoices[index] = invoice;
      } else {
        throw new Error("Invoice not found and also not a new invoice");
      }
    }

    this.addOrUpdateBill(bill);
  }

  public deleteInvoiceFromBill(billId: string, invoiceId: string): void {
    const bill = this.getBill(billId);
    if (!bill) return;

    bill.invoices = bill.invoices.filter((invoice) => invoice.id !== invoiceId);
    this.addOrUpdateBill(bill);
  }

  public async exportBillToZip(billId: string): Promise<Blob> {
    const bill = this.getBill(billId);
    if (!bill) throw new Error("Bill not found");

    // Convert dates to ISO strings for JSON serialization
    const serializedBill = {
      ...bill,
      date: bill.date.toISOString(),
      invoices: bill.invoices.map((invoice) => ({
        ...invoice,
        date: invoice.date.toISOString(),
      })),
    };

    // extract all files from the bill and all invoices and replace them with their names
    let files: CustomFileType[] = [];
    if (serializedBill.files) {
      files = [...files, ...serializedBill.files];
      // @ts-expect-error
      serializedBill.files = files.map((f) => f.name);
    }
    const { invoices, ...metadata } = serializedBill;

    const invoicesFormated = invoices.map((invoice) => {
      if (!invoice.files) return { ...invoice, files: [] };
      files.push(...invoice.files);

      return {
        ...invoice,
        amount: invoice.amount.toLocaleString("de-DE") + "€",
        files: invoice.files.map((f) => f.name),
      };
    });

    const invoiceTotals = invoices.reduce(
      (acc, invoice) => {
        const type = invoice.type;
        acc[type] = (acc[type] || 0) + invoice.amount;
        return acc;
      },
      {} as Record<InvoiceType, number>,
    );

    const metadataSerialized = JSON.stringify(metadata, null, 2);

    const zip = new JSZip();
    zip.file("info.json", metadataSerialized);

    // We store the invoices in a single csv file
    const csvContent = invoicesFormated
      .map((invoice) => {
        const { id, files, ...rest } = invoice;
        const filesStr = files ? files.map((f) => f.replace(/;/g, "\\;")).join(",") : "";
        const values = Object.values(rest).map((v) => String(v).replace(/;/g, "\\;"));
        return values.join(";") + ";" + filesStr + "\n";
      })
      .join("");
    const csvHeader = "Belegnummer;Betrag;Typ;Beschreibung;Datum;Dateien\n";
    // Object.keys(invoices[0])
    //   .filter((key) => key !== "id")
    //   .join(";") + "\n";

    zip.file("invoices.csv", csvHeader + csvContent);

    // We store the invoice totals in a separate csv
    const totalsCsvContent = InvoiceTypes.map((type) => {
      const amount = invoiceTotals[type] || 0;
      return `${type};${amount.toLocaleString("de-DE") + "€"}\n`;
    }).join("");

    const gesamtausgaben = InvoiceTypes.filter((type) => type !== "Einahme" && type !== "Vorschuss").reduce(
      (acc, type) => {
        return acc + (invoiceTotals[type] || 0);
      },
      0,
    );

    const gesamteinnahmen = (invoiceTotals["Einahme"] || 0) + (invoiceTotals["Vorschuss"] || 0);

    const endbestand = gesamteinnahmen - gesamtausgaben;

    const summaryCsvContent =
      `Gesamtausgaben;${gesamtausgaben.toLocaleString("de-DE") + "€"}\n` +
      `Gesamteinnahmen;${gesamteinnahmen.toLocaleString("de-DE") + "€"}\n` +
      `Endbestand;${endbestand.toLocaleString("de-DE") + "€"}\n`;

    zip.file("invoice_totals.csv", "Kategorie;Betrag\n" + totalsCsvContent + summaryCsvContent);

    // Add each file to the zip with an index and appropriate extension
    files.forEach((f) => {
      zip.file(f.name, f.data.split(",")[1], { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    return new Blob([content], { type: "application/zip" });
  }
}

export const db = new LocalStorageDB();
