import { InvoiceForm } from '@/components/single-invoice-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db, Invoice } from '@/db'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'


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
  // TODO: Turn into search param
  const [showForm, setShowForm] = useState(false)

  const router = useRouter()


  const handleInvoiceAdded = (invoice: Omit<Invoice, "id">) => {
    const invoiceFormated = { ...invoice, date: new Date(invoice.date) }
    db.addInvoiceToBill(bill.id, invoiceFormated)
    router.invalidate()
  }

  const handleExport = async () => {
    const dataBlob = await db.exportBillToZip(bill.id)
    if (!dataBlob) return

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${bill.name}.zip`)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

      <Button
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Hide Form' : 'Add Invoice'}
      </Button>
      <Button onClick={() => handleExport()}>
        Export as zip
      </Button>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <InvoiceForm onNewInvoice={handleInvoiceAdded} defaultValues={undefined} />
          </CardContent>
        </Card>
      )}
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
                <p>Date: {invoice.date.toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
