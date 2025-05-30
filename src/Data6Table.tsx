import React from 'react';
import data6 from './data6.json';

const templateResponse = data6[0]?.templateResponse ? data6[0].templateResponse : [];

const Data6Table: React.FC = () => {
    return (
        <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
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
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{item.response}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
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
                            <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                                {item.citations && item.citations.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {item.citations.map((c, cIdx) => (
                                            <li key={`${idx}-${cIdx}`}>
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
