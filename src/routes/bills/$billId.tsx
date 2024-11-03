import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { db, Invoice } from '@/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceForm } from '@/components/single-invoice-form'

export const Route = createFileRoute('/bills/$billId')({
  component: RouteComponent,
  loader: ({ params: { billId } }) => {
    const bill = db.getBill(billId)
    if (!bill) {
      throw new Error('Bill not found')
    }
    return {
      bill,
    }
  }
})

function RouteComponent() {
  const { bill } = Route.useLoaderData()
  const router = useRouter()


  const handleInvoiceAdded = (invoice: Omit<Invoice, "id">) => {
    db.addInvoiceToBill(bill.id, invoice)
    router.invalidate()
  } 

  return (
    <>
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

      <h2 className="text-2xl font-bold">Add Invoice to bill</h2>
      <InvoiceForm onNewInvoice={handleInvoiceAdded} defaultValues={undefined}/>

      <h2 className="text-2xl font-bold">Invoices</h2>
      <ul>
        {bill.invoices.map(invoice => (
          <li key={invoice.id}>
            <Card>
              <CardHeader>
                <CardTitle>{invoice.manual_id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Amount: {invoice.amount}</p>
                <p>Date: { invoice.date.toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
