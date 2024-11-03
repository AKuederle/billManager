import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'

export const Route = createFileRoute('/bills/$billId')({
  component: RouteComponent,
  loader: ({ params: { billId }}) => {
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

  return JSON.stringify(bill)
}
