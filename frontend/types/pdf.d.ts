declare module 'pdfjs-dist/legacy/build/pdf' {
  interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  interface TextContent {
    items: Array<{
      str: string;
      [key: string]: any;
    }>;
  }

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    onProgress?: (progressData: { loaded: number; total: number }) => void;
  }

  interface PDFDocumentOptions {
    data: ArrayBuffer;
  }

  interface PDFDocument {
    getDocument(options: PDFDocumentOptions): PDFDocumentLoadingTask;
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  }

  const pdfjs: PDFDocument;
  export default pdfjs;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.entry' {
  const worker: string;
  export default worker;
} 