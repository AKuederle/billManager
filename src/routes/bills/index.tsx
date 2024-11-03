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
import { CalendarIcon } from "lucide-react"

export const Route = createFileRoute('/bills/')({
  component: RouteComponent,
})


const formSchema = z.object({
  name: z.string().min(1),
  responsiblePerson: z.string().min(1),
  iban: z.string().min(1),
  date: z.date(),
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="responsiblePerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsible Person</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
          <Button type="submit">Add Bill</Button>
        </form>
      </Form>

      <div className="grid gap-4 mt-8">
        {bills.map(bill => (
          <Link key={bill.id} to="/bills/$billId" params={{ billId: bill.id }}>
            <Card>
              <CardHeader>
                <CardTitle>{bill.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Responsible: {bill.responsiblePerson}</p>
                <p>IBAN: {bill.iban}</p>
                <p>Date: {bill.date.toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

