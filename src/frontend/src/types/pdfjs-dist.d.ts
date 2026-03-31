declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc: string };

  interface TextItem {
    str: string;
  }

  interface TextMarkedContent {
    type: string;
  }

  interface TextContent {
    items: (TextItem | TextMarkedContent)[];
  }

  interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export function getDocument(src: {
    data: ArrayBuffer;
  }): PDFDocumentLoadingTask;
}
