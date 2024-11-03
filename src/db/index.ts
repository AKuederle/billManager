import * as devalue from 'devalue';
import JSZip from 'jszip';

export type CustomFileType = {
    name: string
    type: "image" | "pdf"
    data: string
}
export const InvoiceTypes = [
    'Vorschuss',
    'Einahme',
    'Fahrkosten',
    'Unterkunft',
    'Verpflegung',
    'Material',
    'Sonstiges'
] as const;

export type InvoiceType = typeof InvoiceTypes[number];


export type Invoice = {
    id: string
    manual_id: string
    amount: number
    type: InvoiceType
    description: string
    date: Date
    files?: CustomFileType[]
}

export type Bill = {
    id: string
    name: string
    responsiblePerson: string
    iban: string
    date: Date
    invoices: Invoice[]
    files?: CustomFileType[]
}


export class LocalStorageDB {
    private readonly BILLS_KEY = 'bills';

    public getBills(): Bill[] {
        const data = localStorage.getItem(this.BILLS_KEY);
        return data ? devalue.parse(data) : [];
    }

    public getBill(id: string): Bill | undefined {
        return this.getBills().find(bill => bill.id === id);
    }

    public saveBill(bill: Bill): void {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === bill.id);

        if (index >= 0) {
            bills[index] = bill;
        } else {
            bills.push(bill);
        }

        localStorage.setItem(this.BILLS_KEY, devalue.stringify(bills));
    }

    public deleteBill(id: string): void {
        const bills = this.getBills().filter(bill => bill.id !== id);
        localStorage.setItem(this.BILLS_KEY, devalue.stringify(bills));
    }

    public addInvoiceToBill(billId: string, invoice: Omit<Invoice, 'id'>): void {
        const bill = this.getBill(billId);
        if (!bill) return;

        const newInvoice = {
            ...invoice,
            id: crypto.randomUUID()
        };

        bill.invoices.push(newInvoice);
        this.saveBill(bill);
    }

    public deleteInvoiceFromBill(billId: string, invoiceId: string): void {
        const bill = this.getBill(billId);
        if (!bill) return;

        bill.invoices = bill.invoices.filter(invoice => invoice.id !== invoiceId);
        this.saveBill(bill);
    }

    public updateInvoiceInBill(billId: string, invoice: Invoice): void {
        const bill = this.getBill(billId);
        if (!bill) return;

        const index = bill.invoices.findIndex(inv => inv.id === invoice.id);
        if (index >= 0) {
            bill.invoices[index] = invoice;
            this.saveBill(bill);
        }
    }

    public async exportBillToZip(billId: string): Promise<Blob> {

        const bill = this.getBill(billId);
        if (!bill) throw new Error('Bill not found');



        // Convert dates to ISO strings for JSON serialization
        const serializedBill = {
            ...bill,
            date: bill.date.toISOString(),
            invoices: bill.invoices.map(invoice => ({
                ...invoice,
                date: invoice.date.toISOString()
            }))
        };

        // extract all files from the bill and all invoices and replace them with their names
        let files: CustomFileType[] = [];
        if (serializedBill.files) {
            files = [...files, ...serializedBill.files];
            serializedBill.files = files.map((f) => f.name);
        }
        serializedBill.invoices.forEach(invoice => {
            if (!invoice.files) return;
            files.push(...invoice.files);
            invoice.files = invoice.files.map((f) => f.name);
        });

        const data = JSON.stringify(serializedBill, null, 2);

        const zip = new JSZip()
        zip.file('data.json', data)
        
        // Add each file to the zip with an index and appropriate extension
        files.forEach((f) => {
            zip.file(f.name, f.data.split(',')[1], { base64: true })
        })

        const content = await zip.generateAsync({ type: 'blob' })
        return new Blob([content], { type: 'application/zip' })
    }
}

export const db = new LocalStorageDB();