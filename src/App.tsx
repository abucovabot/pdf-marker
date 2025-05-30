import { Worker } from '@react-pdf-viewer/core';
import PDFViewer from './PDFViewer';
import Data6Table from './Data6Table';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const pdfFile = 'Perenti.pdf';
console.log('Loading PDF from:', pdfFile);

const App = () => {
    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
            <div style={{ display: 'flex', height: '100vh' }}>
                <div style={{ flex: 1, padding: '2rem', background: '#f5f5f5', overflowY: 'auto' }}>
                    <h2>Data6 Table</h2>
                    <Data6Table />
                </div>
                <div style={{ width:'70%', height:'80%', borderLeft: '1px solid #ddd' }}>
                  <div style={{ margin: 0 }}>
                    <PDFViewer fileUrl={pdfFile} />
                  </div>
                </div>
            </div>
        </Worker>
    );
};

export default App;