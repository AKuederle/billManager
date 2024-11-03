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

export const Route = createFileRoute('/bills/')({
  component: RouteComponent,
})


const formSchema = z.object({
  name: z.string().min(1),
  responsiblePerson: z.string().min(1),
  iban: z.string().min(1),
  date: z.string(),
})

function RouteComponent() {
  const [bills, setBills] = useState<Bill[]>([])
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      responsiblePerson: '',
      iban: '',
      date: new Date().toISOString().split('T')[0],
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
    }
    db.saveBill(newBill)
    setBills(db.getBills())
    form.reset()
  }

  return (
    <div className="container mx-auto p-4">
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
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                <p>Date: {new Date(bill.date).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

