import { createFileRoute, Link } from '@tanstack/react-router'



import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { Bill } from '@/db'
import { db } from '@/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Calendar } from "@/components/ui/calendar"
import { FormDescription, FormMessage } from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, ChevronRight } from "lucide-react"

export const Route = createFileRoute('/bills/')({
  component: RouteComponent,
})


const formSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  responsiblePerson: z.string().min(1, 'Zuständige Person ist erforderlich'),
  iban: z.string().min(1, 'IBAN ist erforderlich')
    .refine((val) => /^DE\d{20}$/.test(val), {
      message: 'IBAN muss dem Format DE + 20 Ziffern entsprechen. Nur deutsche IBANs sind erlaubt.',
    }),
  date: z.date()
    .refine((date) => date <= new Date(), {
      message: 'Datum darf nicht in der Zukunft liegen.',
    }),
})

function RouteComponent() {
  const [bills, setBills] = useState<Bill[]>([])
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      responsiblePerson: '',
      iban: '',
      date: new Date(),
    },
  })

  useEffect(() => {
    setBills(db.getBills())
  }, [])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newBill: Bill = {
      id: crypto.randomUUID(),
      files: [],
      invoices: [],
      ...values,
      // Note: Not sure if this is the correct way to handle dates here
      //       There should be a better way...
      date: new Date(values.date),
    }
    db.saveBill(newBill)
    setBills(db.getBills())
    form.reset()
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Erstelle eine neue Abrechnung</CardTitle>
        </CardHeader>
        <CardContent>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abrechnungsname</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Z.B.: Sommerfahrt 2023' />
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
                    <FormDescription>
                      Name der Person, der das Geld überwiesen werden soll.
                    </FormDescription>
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
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
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
                    <FormDescription>
                      Tag an dem die Abrechnung gemacht wird. (Normalerweise der heutige Tag)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className='w-full'>Erstellen</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold">Abrechnungen</h2>
      <div className="flex flex-col gap-y-2">
        {bills.slice().reverse().map(bill => (
            <Card className='hover:shadow-md'>
              <Link key={bill.id} to="/bills/$billId" params={{ billId: bill.id }} >
              <CardHeader>
                <CardTitle>{bill.name}</CardTitle>

              </CardHeader>
              <CardContent>

                <div className="flex flex-row justify-between">
                  <div >
                    <p>Responsible: {bill.responsiblePerson}</p>
                    <p>IBAN: {bill.iban}</p>
                    <p>Date: {bill.date.toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </CardContent>
              </Link>
            </Card>
        ))}
      </div>
    </div>
  )
}

