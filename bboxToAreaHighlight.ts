// Utility to convert a bounding box (bbox) to AreaHighlight shape for react-pdf-viewer highlight plugin
// https://react-pdf-viewer.dev/plugins/highlight/

import type { ChunkWithBBox } from "./src/highlights";

export type BBox = {
    x1: number; // left
    y1: number; // top
    x2: number; // right
    y2: number; // bottom
};

export type AreaHighlight = {
    pageIndex: number;
    left: number;   // relative [0,1]
    top: number;    // relative [0,1]
    width: number;  // relative [0,1]
    height: number; // relative [0,1]
};

/**
 * Converts a bbox (absolute coordinates) to AreaHighlight (relative coordinates)
 * @param bbox - { x1, y1, x2, y2 } in absolute PDF coordinates
 * @param pageIndex - page index (0-based)
 * @param pageWidth - width of the page (same units as bbox)
 * @param pageHeight - height of the page (same units as bbox)
 * @returns AreaHighlight object
 */
export function bboxToAreaHighlight(
    bbox: BBox,
    pageIndex: number,
    pageWidth: number,
    pageHeight: number
): AreaHighlight {
    const left = bbox.x1 / pageWidth;
    const top = bbox.y1 / pageHeight;
    const width = (bbox.x2 - bbox.x1) / pageWidth;
    const height = (bbox.y2 - bbox.y1) / pageHeight;
    return {
        pageIndex,
        left,
        top,
        width,
        height,
    };
}

export const convertChunksToNotes = (pdfSize: { width: number; height: number }, chunks: ChunkWithBBox[]) => {
        if (pdfSize) {
            const convertedNotes = chunks.map((chunk, idx) => {
                // chunk_bbox: [x1, y1, x2, y2] bbox coordinates
                // AreaHighlight expects relative [left, top, width, height] and pageIndex
                const area = bboxToAreaHighlight(
                    {
                        x1: chunk.chunk_bbox[0],
                        y1: chunk.chunk_bbox[1],
                        x2: chunk.chunk_bbox[2],
                        y2: chunk.chunk_bbox[3],
                    },
                    chunk.page_num,
                    pdfSize.width,
                    pdfSize.height
                );
                return {
                    id: idx,
                    content: chunk.reference_text.slice(0, 10) + '...',
                    highlightAreas: [area],
                    quote: chunk.reference_text.slice(0, 50) + '...',
                };
            });
            return convertedNotes;
        }
        return [];
    };
