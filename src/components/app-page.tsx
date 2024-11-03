import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Share2 } from 'lucide-react'

export function Page() {
  const [image, setImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleShare = async () => {
    if (!image) {
      alert('Please upload an image first')
      return
    }

    const data = {
      title,
      description,
      image
    }
    console.log(data)

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Image',
          text: 'Check out this image!',
          files: [dataURItoBlob(image)],
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      alert('Web Share API is not supported in your browser')
    }
  }

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Image Sharing PWA</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-upload">Upload Image</Label>
          <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        {image && (
          <div className="mt-4">
            <img src={image} alt="Uploaded" className="w-full rounded-md" />
          </div>
        )}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a description" />
        </div>
        <Button onClick={handleShare} className="w-full">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  )
}