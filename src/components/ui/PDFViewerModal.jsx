import React from 'react';

const PDFViewerModal = ({ isOpen, pdfUrl, onClose, title = "Ticket de Venta", autoPrint = false }) => {
    if (!isOpen || !pdfUrl) return null;

    const handleClose = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        onClose();
    };

    if (autoPrint) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, opacity: 0, overflow: 'hidden' }}>
                <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="PDF Viewer"
                    onLoad={(e) => {
                        try {
                            const iframe = e.target;
                            if (iframe.dataset.printed === 'true') return;
                            iframe.dataset.printed = 'true';

                            // NUEVA LÓGICA: Si estamos en Electron
                            if (window.electronAPI) {
                                // Extraemos el PDF del blob URL
                                fetch(pdfUrl)
                                    .then(res => res.arrayBuffer())
                                    .then(buffer => {
                                        // Lo mandamos al backend de Electron
                                        window.electronAPI.printPdfFile(buffer);

                                        // Cerramos el modal casi de inmediato
                                        setTimeout(() => handleClose(), 500);
                                    })
                                    .catch(err => {
                                        console.error("Error leyendo PDF:", err);
                                        handleClose();
                                    });
                            } else {
                                // TU LÓGICA ORIGINAL INTACTA: Por si abres el sistema en Firefox/Chrome normal
                                setTimeout(() => {
                                    iframe.contentWindow.focus();
                                    const closeAfterPrint = () => {
                                        setTimeout(() => handleClose(), 500);
                                    };
                                    iframe.contentWindow.onafterprint = closeAfterPrint;
                                    const onFocus = () => {
                                        window.removeEventListener('focus', onFocus);
                                        closeAfterPrint();
                                    };
                                    window.addEventListener('focus', onFocus);
                                    iframe.contentWindow.print();
                                }, 500);
                            }
                        } catch (err) {
                            console.error("Auto-print error:", err);
                            handleClose();
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            X
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="PDF Viewer"
                    // Fallback simple print trigger if somehow autoPrint is false but we want manual action
                    />
                </div>
            </div>
        </div>
    );
};

export default PDFViewerModal;
