import React from 'react';
import data6 from './data6.json';

interface Data6Item {
    name: string;
    response: string;
    citations?: Array<{
        reference_text?: string;
        chunk_bbox?: any;
    }>;
}

const templateResponse: Data6Item[] = Array.isArray(data6) ? (data6 as Data6Item[]) : [];

const Data6Table: React.FC = () => {
    return (
        <div style={{ overflowX: 'auto', height: '100%', maxHeight: 'none', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', tableLayout: 'fixed' }}>
                <colgroup>
                    <col style={{ width: '14%' }} /> {/* Name */}
                    <col style={{ width: '36%' }} /> {/* Response */}
                    <col style={{ width: '36%' }} /> {/* Reference Text(s) */}
                    <col style={{ width: '14%' }} /> {/* Chunk BBox(es) */}
                </colgroup>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Response</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Reference Text(s)</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Chunk BBox(es)</th>
                    </tr>
                </thead>
                <tbody>
                    {templateResponse.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-line', fontSize: '20px' }}>{item.response}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top', fontSize: '20px' }}>
                                {item.citations && item.citations.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {item.citations.map((c, cIdx) => (
                                            <li key={`${idx}-${cIdx}`}>{c.reference_text}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span style={{ color: '#888' }}>-</span>
                                )}
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                {item.citations && item.citations.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {item.citations.map((c, cIdx) => (
                                            <li key={`${idx}-${cIdx}`} style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                                {Array.isArray(c.chunk_bbox) && c.chunk_bbox.length > 0
                                                    ? JSON.stringify(c.chunk_bbox[0])
                                                    : JSON.stringify(c.chunk_bbox)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span style={{ color: '#888' }}>-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Data6Table;
