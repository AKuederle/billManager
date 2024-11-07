import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Invoice, InvoiceTypes } from "@/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { useEffect } from "react";

const uploadFiles = async (files: FileList | null) => {
  if (!files) return undefined;
  const results = await Promise.all(
    Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type.includes("pdf") ? "pdf" : "image",
            data: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      });
    }),
  );
  return results as { type: "image" | "pdf"; data: string; name: string }[];
};

const formSchema = z.object({
  id: z.string(),
  manual_id: z.string().min(1),
  amount: z.number().min(0, "Der Betrag muss größer als 0 sein."),
  type: z.enum(InvoiceTypes),
  description: z.string(),
  date: z.date(),
  files: z
    .object({
      name: z.string(),
      type: z.enum(["image", "pdf"]),
      data: z.string(),
    })
    .array()
    .optional(),
});

type Props = {
  onNewInvoice: (invoice: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialValues: Omit<z.infer<typeof formSchema>, "type"> & {
    type?: Invoice["type"];
  };
  isNew: boolean;
};

export function InvoiceForm({ onNewInvoice, onCancel, initialValues, isNew }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  console.log(form.getFieldState("id"));
  console.log(initialValues);

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const invoiceType = form.watch("type");
  const files = form.watch("files");

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onNewInvoice(data);
    form.reset(initialValues);
  };

  const handelCancel = () => {
    onCancel();
    form.reset(initialValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          name="manual_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select type</SelectLabel>

                    {InvoiceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {invoiceType && ["Vorschuss", "Einahme"].includes(invoiceType) && (
                <FormDescription>
                  Vorschuss und Einahmen werden als negative Werte in die Summe mit einberechnet.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
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
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Tag an dem die Ausgabe getätigt wurde.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="files"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Files</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  {...fieldProps}
                  onChange={async (event) => {
                    onChange(await uploadFiles(event.target?.files));
                  }}
                />
              </FormControl>
              <FormMessage />
              {files && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {files.map((file, index) =>
                    file.type === "image" ? (
                      <img key={index} src={file.data} alt={`File ${index + 1}`} className="w-full rounded-md" />
                    ) : (
                      <div key={index} className="rounded-md border p-4 text-center">
                        PDF Document {index + 1}
                      </div>
                    ),
                  )}
                </div>
              )}
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1">
            {isNew ? "Add" : "Update"}
          </Button>
          <Button variant="outline" type="reset" className="flex-1" onClick={() => handelCancel()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
