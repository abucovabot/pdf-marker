import { Worker } from '@react-pdf-viewer/core';
import PDFViewer from './PDFViewer';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const pdfFile = '/UDC_file.pdf';
console.log('Loading PDF from:', pdfFile);

const App = () => {
    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
          <PDFViewer fileUrl={pdfFile}/>
        </Worker>
    );
};

export default App;