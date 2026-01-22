import React from 'react';

const PDFViewerModal = ({ isOpen, pdfUrl, onClose, title = "Ticket de Venta" }) => {
    if (!isOpen || !pdfUrl) return null;

    const handleClose = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
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
                    />
                </div>
            </div>
        </div>
    );
};

export default PDFViewerModal;
