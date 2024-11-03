import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Download } from 'lucide-react'
import JSZip from 'jszip'

export function AddInvoice() {
  const [invoices, setInvoices] = useState<{ type: 'image' | 'pdf', data: string }[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setInvoices(prev => [...prev, {
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          data: reader.result as string
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const prepareData = async () => {
    if (invoices.length === 0) {
      alert('Bitte laden Sie mindestens einen Beleg hoch')
      return
    }

    const data = {
      title,
      description,
    }

    const zip = new JSZip()
    zip.file('metadata.json', JSON.stringify(data, null, 2))
    
    // Add each file to the zip with an index and appropriate extension
    invoices.forEach((beleg, index) => {
      const fileData = beleg.data.split(',')[1]
      const extension = beleg.type === 'pdf' ? 'pdf' : 'png'
      zip.file(`beleg${index + 1}.${extension}`, fileData, { base64: true })
    })

    const content = await zip.generateAsync({ type: 'blob' })
    const dataBlob = new Blob([content], { type: 'application/zip' })

    return dataBlob
  }

  const handleDownload = async () => {
    const dataBlob = await prepareData()
    if (!dataBlob) return

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title || 'belege'}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Belege Upload</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Belege hochladen</Label>
          <Input 
            id="file-upload" 
            type="file" 
            accept="image/*,application/pdf" 
            multiple 
            onChange={handleFileUpload} 
          />
        </div>
        {invoices.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {invoices.map((beleg, index) => (
              beleg.type === 'image' ? (
                <img 
                  key={index} 
                  src={beleg.data} 
                  alt={`Beleg ${index + 1}`} 
                  className="w-full rounded-md" 
                />
              ) : (
                <div key={index} className="p-4 border rounded-md text-center">
                  PDF Dokument {index + 1}
                </div>
              )
            ))}
          </div>
        )}
        <div>
          <Label htmlFor="title">Titel</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel eingeben" />
        </div>
        <div>
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung eingeben" />
        </div>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
      </>
  )
}
