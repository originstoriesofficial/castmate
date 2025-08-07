"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const RETRO_RED = '#a13d2d';

export default function PdfPreview({ file }: { file: File }) {
  if (!file) {
    return (
      <div className="p-8 text-center text-lg font-mono text-red-600">
        No PDF file selected.
      </div>
    );
  }
  return (
    <Document
      file={file}
      loading={
        <div className="p-8 text-center text-lg font-mono" style={{ color: RETRO_RED }}>
          Loading PDF…
        </div>
      }
      error={
        <div className="p-8 text-center text-lg font-mono text-red-600">
          Failed to load PDF
        </div>
      }
    >
      <Page pageNumber={1} width={350} />
    </Document>
  );
}
