"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/browser'

const storageBase = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public` : ''))

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase.storage.from('public-assets').list('', { limit: 100 })
    if (error) {
      setMessage('Erro ao listar arquivos: ' + error.message)
      return
    }
    setFiles(data || [])
  }

  async function upload() {
    if (!file) return setMessage('Selecione um ficheiro')
    const filePath = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('public-assets').upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (error) return setMessage('Upload falhou: ' + error.message)
    setMessage('Upload bem-sucedido')
    fetchFiles()
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage('Erro ao enviar link: ' + error.message)
    else setMessage('Link enviado para o email')
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">Admin — Upload de imagens</h2>

      <div className="mt-6">
        <h3 className="font-semibold">Login (email)</h3>
        <div className="flex gap-2 mt-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="border p-2" />
          <button onClick={signIn} className="bg-blue-600 text-white px-3 py-2">Enviar link</button>
        </div>
      </div>

      <div className="mt-6">
        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <div className="mt-2">
          <button onClick={upload} className="bg-green-600 text-white px-3 py-2">Upload</button>
        </div>
        {message && <p className="mt-2">{message}</p>}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Arquivos no bucket</h3>
        <ul className="mt-2">
          {files.map((f) => (
            <li key={f.name} className="mb-1">
              <a href={`${storageBase}/public-assets/${f.name}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">{f.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
