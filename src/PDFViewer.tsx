import * as React from 'react';
import { Button, type DocumentLoadEvent, PdfJs, Position, PrimaryButton, Tooltip, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import {
    type HighlightArea,
    highlightPlugin,
    MessageIcon,
    type RenderHighlightContentProps,
    type RenderHighlightTargetProps,
    type RenderHighlightsProps,
} from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { chunks } from './highlights';
import { convertChunksToNotes } from '../bboxToAreaHighlight';
import { usePdfPageSize } from '../usePdfPageSize';

interface Note {
    id: number;
    content: string;
    highlightAreas: HighlightArea[];
    quote: string;
}

interface HighlightExampleProps {
    fileUrl: string;
}

const HighlightExample: React.FC<HighlightExampleProps> = ({ fileUrl }) => {
    const [message, setMessage] = React.useState('');
    const [notes, setNotes] = React.useState<Note[]>([]);
    const notesContainerRef = React.useRef<HTMLDivElement | null>(null);
    let noteId = notes.length;

    const noteEles: Map<number, HTMLElement> = new Map();
    const [currentDoc, setCurrentDoc] = React.useState<PdfJs.PdfDocument | null>(null);

    // Use pdfSize to convert chunks to HighlightArea notes only after pdfSize is known
    const { pdfSize, extractPageSize } = usePdfPageSize();

    const handleDocumentLoad = (e: DocumentLoadEvent) => {
        console.log('PDF document loaded successfully:', e);
        setCurrentDoc(e.doc);
        
        // Extract the PDF size from the loaded document
        if (e.doc) {
            extractPageSize(e.doc);
        }
        
        if (currentDoc && currentDoc !== e.doc) {
            // User opens new document
            setNotes([]);
        }
    };
    
    React.useEffect(() => {
        if (pdfSize) {
            const notes = convertChunksToNotes(pdfSize, chunks);
            setNotes(notes);
        }
    }, [pdfSize]);

    const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
        <div
            style={{
                background: '#eee',
                display: 'flex',
                position: 'absolute',
                left: `${props.selectionRegion.left}%`,
                top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
                transform: 'translate(0, 8px)',
                zIndex: 1,
            }}
        >
            <Tooltip
                position={Position.TopCenter}
                target={
                    <Button onClick={props.toggle}>
                        <MessageIcon />
                    </Button>
                }
                content={() => <div style={{ width: '100px' }}>Add a note</div>}
                offset={{ left: 0, top: -8 }}
            />
        </div>
    );

    const renderHighlightContent = (props: RenderHighlightContentProps) => {
        const addNote = () => {
            if (message !== '') {
                const note: Note = {
                    id: ++noteId,
                    content: message,
                    highlightAreas: props.highlightAreas,
                    quote: props.selectedText,
                };
                setNotes(notes.concat([note]));
                props.cancel();
            }
        };

        return (
            <div
                style={{
                    background: '#fff',
                    border: '1px solid rgba(0, 0, 0, .3)',
                    borderRadius: '2px',
                    padding: '8px',
                    position: 'absolute',
                    left: `${props.selectionRegion.left}%`,
                    top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
                    zIndex: 999,
                }}
            >
                <div>
                    <textarea
                        rows={3}
                        style={{
                            border: '1px solid rgba(0, 0, 0, .3)',
                        }}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: '8px',
                    }}
                >
                    <div style={{ marginRight: '8px' }}>
                        <PrimaryButton onClick={addNote}>Add</PrimaryButton>
                    </div>
                    <Button onClick={props.cancel}>Cancel</Button>
                </div>
            </div>
        );
    };

    const jumpToNote = (note: Note) => {
        activateTab(3);
        const notesContainer = notesContainerRef.current;
        if (noteEles.has(note.id) && notesContainer) {
            const noteElement = noteEles.get(note.id);
            if (noteElement) {
                const containerRect = notesContainer.getBoundingClientRect();
                const noteRect = noteElement.getBoundingClientRect();
                notesContainer.scrollTop += noteRect.top - containerRect.top;
            }
        }
    };

    // Helper function to get CSS properties for highlight areas
    const getHighlightCssProperties = (area: HighlightArea, rotation: number) => {
        return {
            position: 'absolute' as const,
            left: `${area.left * 100}%`,
            top: `${area.top * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
            background: 'yellow',
            opacity: 0.4,
            pointerEvents: 'none' as const,
            transform: `rotate(${rotation}deg)`,
        };
    };

    const renderHighlights = (props: RenderHighlightsProps) => (
        <div>
            {notes.map((note) => (
                <React.Fragment key={note.id}>
                    {note.highlightAreas
                        .filter((area) => area.pageIndex === props.pageIndex)
                        .map((area, idx) => (
                            <div
                                key={idx}
                                style={getHighlightCssProperties(area, props.rotation)}
                                onClick={() => jumpToNote(note)}
                            />
                        ))}
                </React.Fragment>
            ))}
        </div>
    );

    const highlightPluginInstance = highlightPlugin({
        renderHighlightTarget,
        renderHighlightContent,
        renderHighlights,
    });

    const { jumpToHighlightArea } = highlightPluginInstance;

    React.useEffect(() => {
        return () => {
            noteEles.clear();
        };
    }, []);

    const sidebarNotes = (
        <div
            ref={notesContainerRef}
            style={{
                overflow: 'auto',
                width: '100%',
            }}
        >
            {notes.length === 0 && <div style={{ textAlign: 'center' }}>There is no note</div>}
            {notes.map((note) => {
                return (
                    <div
                        key={note.id}
                        style={{
                            borderBottom: '1px solid rgba(0, 0, 0, .3)',
                            cursor: 'pointer',
                            padding: '8px',
                        }}
                        onClick={() => jumpToHighlightArea(note.highlightAreas[0])}
                        ref={(ref): void => {
                            noteEles.set(note.id, ref as HTMLElement);
                        }}
                    >
                        <blockquote
                            style={{
                                borderLeft: '2px solid rgba(0, 0, 0, 0.2)',
                                fontSize: '.75rem',
                                lineHeight: 1.5,
                                margin: '0 0 8px 0',
                                paddingLeft: '8px',
                                textAlign: 'justify',
                            }}
                        >
                            {note.quote}
                        </blockquote>
                        {note.content}
                    </div>
                );
            })}
        </div>
    );

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) =>
            defaultTabs.concat({
                content: sidebarNotes,
                icon: <MessageIcon />,
                title: 'Notes',
            }),
    });
    const { activateTab } = defaultLayoutPluginInstance;

    return (
        <div
        style={{
            height: '750px',
            width: '80%',
            marginLeft: 'auto',
            marginRight: 'auto',
        }}
        >
            <Viewer
                fileUrl={fileUrl}
                plugins={[highlightPluginInstance, defaultLayoutPluginInstance]}
                onDocumentLoad={handleDocumentLoad}
            />
        </div>
    );
};

export default HighlightExample;