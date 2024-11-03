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
    date: string
    files: string[]
}

export type Bill = {
    id: string
    name: string
    responsiblePerson: string
    iban: string
    date: string
    invoices: Invoice[]
    files: string[]
}


export class LocalStorageDB {
    private readonly BILLS_KEY = 'bills';

    public getBills(): Bill[] {
        const data = localStorage.getItem(this.BILLS_KEY);
        return data ? JSON.parse(data) : [];
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

        localStorage.setItem(this.BILLS_KEY, JSON.stringify(bills));
    }

    public deleteBill(id: string): void {
        const bills = this.getBills().filter(bill => bill.id !== id);
        localStorage.setItem(this.BILLS_KEY, JSON.stringify(bills));
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
}

export const db = new LocalStorageDB();