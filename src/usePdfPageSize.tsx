import { useState } from 'react';

/**
 * React hook to extract and store the PDF page size (width & height) once, assuming all pages are the same size.
 * Rather than using a renderPage function (which seems to conflict with the PDF viewer),
 * we'll use an event-based approach to extract sizes when the document loads.
 * 
 * Returns: { pdfSize, setPdfSize }
 */
export function usePdfPageSize() {
    const [pdfSize, setPdfSize] = useState<{ width: number; height: number } | null>(null);
    
    /**
     * Function to extract page size from a loaded PDF document
     * This can be called manually or from document load events
     */
    const extractPageSize = (pdfDocument: any) => {
        if (!pdfSize && pdfDocument) {
            pdfDocument.getPage(1).then((page: any) => {
                const viewport = page.getViewport({ scale: 1 });
                console.log('Extracted PDF size:', viewport.width, viewport.height);
                setPdfSize({ width: viewport.width, height: viewport.height });
            }).catch((error: any) => {
                console.error('Error extracting PDF page size:', error);
            });
        }
    };
    return { pdfSize, setPdfSize, extractPageSize };
}
