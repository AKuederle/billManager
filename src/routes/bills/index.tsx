import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Bill } from "@/db";
import { db, NEW_ID } from "@/db";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Calendar } from "@/components/ui/calendar";
import { FormDescription, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ChevronRight, PenIcon, TrashIcon } from "lucide-react";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

const searchSchema = z.object({
  editBillId: z.string().optional(),
});

export const Route = createFileRoute("/bills/")({
  component: RouteComponent,
  validateSearch: zodSearchValidator(searchSchema),
  loaderDeps: ({ search: { editBillId } }) => ({ editBillId }),
  loader: ({ deps: { editBillId } }) => {
    let editBill: Bill | undefined;
    if (editBillId !== undefined) {
      if (editBillId === NEW_ID) {
        editBill = {
          id: NEW_ID,
          name: "",
          responsiblePerson: "",
          iban: "",
          date: new Date(),
          invoices: [],
        };
      } else {
        editBill = db.getBill(editBillId);
        if (!editBill) {
          throw redirect({
            to: ".",
            search: (prev) => ({ ...prev, editBillId: undefined }),
            replace: true,
          });
        }
      }
    } else {
      throw redirect({
        to: ".",
        search: (prev) => ({ ...prev, editBillId: NEW_ID }),
        replace: true,
      });
    }

    return {
      bills: db.getBills(),
      editBill,
      editBillId,
    };
  },
});

function RouteComponent() {
  const { bills, editBill, editBillId } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();

  const isNew = editBillId === NEW_ID;

  const handleBillSaved = async (values: Omit<Bill, "invoices">) => {
    // TODO: We should move this to the db
    let bill: Bill;
    if (values.id === NEW_ID) {
      bill = { ...values, invoices: [] };
    } else {
      bill = { ...values, invoices: db.getBill(values.id)?.invoices ?? [] };
    }

    db.addOrUpdateBill(bill);
    await navigate({
      to: ".",
      search: (prev) => ({ ...prev, editBillId: undefined }),
      replace: true,
    });
  };

  const handleCancel = async () => {
    await navigate({
      to: ".",
      search: (prev) => ({ ...prev, editBillId: undefined }),
      replace: true,
    });
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Erstelle eine neue Abrechnung" : "Abrechnung bearbeiten"}</CardTitle>
        </CardHeader>
        <CardContent>
          <BillForm onBillSaved={handleBillSaved} onCancel={handleCancel} initialValues={editBill} isNew={isNew} />
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold">Abrechnungen</h2>
      <div className="flex flex-col gap-y-2">
        {bills
          .slice()
          .reverse()
          .map((bill) => (
            <Card
              key={bill.id}
              className="cursor-pointer hover:shadow-md"
              onClick={(e) => {
                // This is needed to prevent the click event from the nested buttons to trigger
                // The nested button sets preventDefault on the event.
                if (e.defaultPrevented) return;
                navigate({
                  to: "/bills/$billId",
                  params: { billId: bill.id },
                });
              }}
            >
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{bill.name}</CardTitle>
                  <div>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        db.deleteBill(bill.id);
                        router.invalidate();
                      }}
                      aria-label="Abrechnung löschen"
                    >
                      <TrashIcon />
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link
                        to="."
                        search={(prev) => ({
                          ...prev,
                          editBillId: bill.id,
                        })}
                        replace={true}
                        aria-label="Abrechnung bearbeiten"
                      >
                        <PenIcon />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row justify-between">
                  <div>
                    <p>Verantwortliche:r: {bill.responsiblePerson}</p>
                    <p>IBAN: {bill.iban}</p>
                    <p>Datum: {bill.date.toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name ist erforderlich"),
  responsiblePerson: z.string().min(1, "Zuständige Person ist erforderlich"),
  iban: z
    .string()
    .min(1, "IBAN ist erforderlich")
    .refine((val) => /^DE\d{20}$/.test(val), {
      message: "IBAN muss dem Format DE + 20 Ziffern entsprechen. Nur deutsche IBANs sind erlaubt.",
    }),
  date: z.date().refine((date) => date <= new Date(), {
    message: "Datum darf nicht in der Zukunft liegen.",
  }),
});

type Props = {
  onBillSaved: (bill: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialValues: Bill;
  isNew: boolean;
};

const BillForm = ({ onBillSaved, onCancel, initialValues, isNew }: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const handleBillSaved = (data: z.infer<typeof formSchema>) => {
    onBillSaved(data);
    form.reset(initialValues);
  };

  const handleCancel = () => {
    onCancel();
    form.reset(initialValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleBillSaved)} className="space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abrechnungsname</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Z.B.: Sommerfahrt 2023" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsiblePerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zuständige Person</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
              <FormDescription>Name der Person, der das Geld überwiesen werden soll.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="iban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IBAN</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      aria-label="Datum auswählen"
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    showOutsideDays={true}
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Tag an dem die Abrechnung gemacht wird. (Normalerweise der heutige Tag)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1" aria-label={isNew ? "Abrechnung erstellen" : "Abrechnung speichern"}>
            {isNew ? "Erstellen" : "Speichern"}
          </Button>
          <Button variant="outline" type="reset" className="flex-1" onClick={handleCancel} aria-label="Abbrechen">
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
};
