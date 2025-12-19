'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import CierreCajaPDF from './CierreCajaPDF';

export default function PDFDownloadButton({ cajaDetails, cierreData, ventasData = [] }) {
    return (
        <PDFDownloadLink
            document={<CierreCajaPDF cajaDetails={cajaDetails} cierreData={cierreData} ventasData={ventasData} />}
            fileName={`cierre_caja_${cajaDetails.id_caja}_${new Date().toISOString().split('T')[0]}.pdf`}
        >
            {({ loading }) => (
                <button
                    disabled={loading || !cierreData.monto_final}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generando PDF...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar Reporte PDF
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
}
