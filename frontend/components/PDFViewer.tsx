'use client';

import { useEffect, useMemo } from 'react';
import { Document as PDFDocument, Page } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import '@/lib/pdfWorker';

export default function PDFViewer({
  fileUrl,
  pageNumber,
  onLoadSuccess,
}: {
  fileUrl: string;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
    console.log("PDFViewer mounted");
    return () => console.log("PDFViewer unmounted");
  }, []);

  const file = useMemo(
    () => ({
      url: fileUrl,
    }),
    [fileUrl]
  );

  const options = useMemo(
    () => ({
      httpHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  return (
    <PDFDocument
      file={file}
      options={options}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      onLoadError={(error) => console.error(error)}
      loading={<Loader2 className="animate-spin text-[#888787]" />}
    >
      <Page pageNumber={pageNumber} width={480} />
    </PDFDocument>
  );
}
