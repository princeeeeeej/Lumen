'use client';
import { use, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  FileText,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';

const API_BASE = 'http://127.0.0.1:8000';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("")
  const [ dragActive, setDragActive] = useState(false)
  let { docs, selectedDoc, uploading, setDocs, setSelectedDoc, setUploading, isActive } = useDocumentStore()

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
          fetchDocs();
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  const fetchDocs = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]));
  }, []);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return;
    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const doc = await res.json();
      if (res.ok && doc.status == 'indexed') {
        fetchDocs();
      } else {
        fetchDocs();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center px-6 py-3 border-b border-[#242424]">
        <h1 className="text-2xl">Lumen</h1>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-1.5 text-[#0c0c0c] text-sm bg-[#adf73f] rounded-[10px] p-2 cursor-pointer" id='sidebar-file-input'>
            <Plus size={15} />
            UPLOAD DOCUMENT
            <input
                type="file"
                accept="application/pdf"
                className="hidden"
                id="sidebar-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
          </label>
          {email && <span className="text-[#414140] text-sm">{email}</span>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#0c0c0c] text-sm transition-colors bg-gray-300 hover:bg-red-500 rounded-[10px] p-2 cursor-pointer"
          >
            <LogOut size={15} />
            LOG OUT
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="border-r  border-[#242424] flex flex-col min-w-65">
          <div className="flex flex-col gap-3 border-b border-[#242424] p-5 ">
            <label
              htmlFor="sidebar-file-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`flex flex-col border border-dashed rounded-[10px] p-5 items-center justify-center gap-1 cursor-pointer
                    ${dragActive ? 'border-green-500 bg-green-50' : ''}`}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                id="sidebar-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {uploading ? (
                <Loader2 size={20} className="text-black animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              <p className="text-black text-md font-medium">
                {uploading ? 'Uploading...' : 'Drop a file, or click to upload'}
              </p>
              <h1 className="text-[12px]">(Only PDF)</h1>
            </label>
          </div>
          <div className="flex flex-col p-4 gap-5">
            <h1>Recent Uploads</h1>
            <div className="flex flex-col  gap-1 overflow-y-auto-">
              {docs.length === 0 && (
                <p className="text-[#555] text-xs text-center py-8">
                  No documents yet
                </p>
              )}
              {docs.map((doc) => {
                isActive = selectedDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    disabled={doc.status !== 'indexed'}
                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-[10px] text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-[#141414] border border-[#adf73f]/30'
                        : 'hover:bg-[#141414] border border-transparent'
                    }`}
                    onClick={() => {
                      if (doc.status === 'indexed') {
                        setSelectedDoc(doc);
                      }
                    }}
                  >
                    <FileText
                      size={15}
                      className={
                        isActive
                          ? 'text-[#adf73f] shrink-0'
                          : 'text-[#888787] shrink-0'
                      }
                    />
                    <span
                      className={`text-sm truncate flex-1 ${isActive ? 'text-white' : 'text-[#c0bfbf]'}`}
                    >
                      {doc.filename}
                    </span>
                    {doc.status === 'indexed' && (
                      <Trash2 size={15} className={`${isActive ? `text-red-500` : `hidden`}`} />
                    )}
                    {(doc.status === 'processing' ||
                      doc.status === 'uploaded') && (
                      <Loader2
                        size={12}
                        className="text-[#888787] animate-spin shrink-0"
                      />
                    )}
                    {doc.status === 'failed' && (
                      <AlertCircle
                        size={12}
                        className="text-red-400 shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
