import { InvoiceForm } from "@/components/single-invoice-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db, Invoice, NEW_ID } from "@/db";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { PenIcon, TrashIcon } from "lucide-react";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DownloadDialog = ({ children, onContinue }: { children: React.ReactNode; onContinue: () => void }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Download Data</AlertDialogTitle>
        <AlertDialogDescription>
          Wenn du auf "Weiter" klickst, wird eine Zip-Datei mit allen Daten heruntergeladen. Schicke diese Datei per
          Email an die Schatzmeister:in.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
        <AlertDialogAction onClick={onContinue}>Weiter</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const searchSchema = z.object({
  editInvoiceId: z.string().optional(),
});

export const Route = createFileRoute("/bills/$billId")({
  component: RouteComponent,
  validateSearch: zodSearchValidator(searchSchema),
  loaderDeps: ({ search: { editInvoiceId } }) => ({ editInvoiceId }),
  loader: ({ params: { billId }, deps: { editInvoiceId } }) => {
    const bill = db.getBill(billId);
    if (!bill) {
      throw new Error("Bill not found");
    }
    // We check here, if the invoice id is valid, if not we navigate to undefined otherwise we return the editInvoice
    type InvoiceWithOptionalType = Omit<Invoice, "type"> & {
      type?: Invoice["type"];
    };
    let editInvoice: InvoiceWithOptionalType | undefined;
    if (editInvoiceId !== undefined) {
      if (editInvoiceId === NEW_ID) {
        editInvoice = {
          id: NEW_ID,
          manual_id: "",
          amount: 0,
          type: undefined,
          description: "",
          date: new Date(),
          files: [],
        };
      } else {
        editInvoice = bill.invoices.find((invoice) => invoice.id === editInvoiceId);
        if (!editInvoice) {
          throw redirect({
            to: ".",
            search: (prev) => ({ ...prev, editInvoiceId: undefined }),
            replace: true,
          });
        }
      }
    }
    return {
      bill,
      editInvoice,
      editInvoiceId,
    };
  },
});

function RouteComponent() {
  // TODO: Add blocker, when form is modified, but not saved
  const { bill, editInvoice, editInvoiceId } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });

  const router = useRouter();

  const handleInvoiceAdded = async (invoice: Invoice) => {
    const invoiceFormated = { ...invoice, date: new Date(invoice.date) };
    db.addOrUpdateInvoiceToBill(bill.id, invoiceFormated);
    await router.invalidate();
    await navigate({
      to: ".",
      search: (prev) => ({ ...prev, editInvoiceId: undefined }),
    });
  };

  const handleCancel = async () => {
    await navigate({
      to: ".",
      search: (prev) => ({ ...prev, editInvoiceId: undefined }),
      replace: true,
    });
  };

  const handleExport = async () => {
    const dataBlob = await db.exportBillToZip(bill.id);
    if (!dataBlob) return;

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${bill.name}.zip`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{bill.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4">
          <div className="">
            <p>Verantwortliche:r: {bill.responsiblePerson}</p>
            <p>IBAN: {bill.iban}</p>
            <p>Datum: {bill.date.toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={editInvoiceId !== undefined} asChild>
              <Link to="." search={(prev) => ({ ...prev, editInvoiceId: NEW_ID })} hash="EDIT_CARD" replace={true}>
                Beleg hinzufügen
              </Link>
            </Button>

            <DownloadDialog onContinue={() => handleExport()}>
              <Button className="flex-1">zip exportieren</Button>
            </DownloadDialog>
          </div>
        </CardContent>
      </Card>

      {editInvoice !== undefined && (
        <Card className="mb-4" id="EDIT_CARD">
          <CardHeader>
            <CardTitle>{editInvoiceId !== NEW_ID ? "Rechnung bearbeiten" : "Neue Rechnung"}</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              onNewInvoice={handleInvoiceAdded}
              onCancel={handleCancel}
              initialValues={editInvoice}
              isNew={editInvoiceId === NEW_ID}
            />
          </CardContent>
        </Card>
      )}
      <h2 className="text-2xl font-bold">Belege</h2>
      <div className="flex flex-col gap-y-2">
        {bill.invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>{invoice.description}</CardTitle>
                  <CardDescription>{invoice.manual_id}</CardDescription>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      db.deleteInvoiceFromBill(bill.id, invoice.id);
                      router.invalidate();
                    }}
                  >
                    <TrashIcon />
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link
                      to="."
                      search={(prev) => ({
                        ...prev,
                        editInvoiceId: invoice.id,
                      })}
                      hash="EDIT_CARD"
                      replace={true}
                    >
                      <PenIcon />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>Betrag: {invoice.amount} &euro;</p>
              <p>Datum: {invoice.date.toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
