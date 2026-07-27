import { create } from "zustand"

export interface DocMeta {
  id: number
  filename: string
  status: string
  created_at: string
}

interface DocumentStore {
  docs: DocMeta[]
  selectedDoc: DocMeta | null
  uploading: boolean
  isActive: boolean
  setDocs: (docs: DocMeta[]) => void
  setSelectedDoc: (doc: DocMeta | null) => void
  setUploading: (val: boolean) => void
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  docs: [],
  selectedDoc: null,
  uploading: false,
  isActive: false,
  setDocs: (docs) => set({ docs }),
  setSelectedDoc: (doc) => set({ selectedDoc: doc }),
  setUploading: (val) => set({ uploading: val }),
}))
