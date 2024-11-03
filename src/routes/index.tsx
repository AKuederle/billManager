import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AddInvoice } from '@/components/add-invoice'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return  <AddInvoice />

}
