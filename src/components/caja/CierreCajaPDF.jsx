'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 3
    },
    section: {
        marginTop: 15,
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 10,
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 4
    },
    infoGrid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    infoCard: {
        width: '48%',
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    infoLabel: {
        fontSize: 9,
        color: '#6b7280',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    paymentMethod: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    paymentLabel: {
        fontSize: 11,
        color: '#374151',
        fontWeight: 'bold'
    },
    paymentAmount: {
        fontSize: 11,
        color: '#111827',
        fontWeight: 'bold'
    },
    paymentPercent: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 2
    },
    balanceSection: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#fef3c7',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fbbf24'
    },
    balanceRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    balanceLabel: {
        fontSize: 11,
        color: '#78716c'
    },
    balanceValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#292524'
    },
    balanceDivider: {
        borderTop: 2,
        borderTopColor: '#d6d3d1',
        marginVertical: 10
    },
    diferenciaPositiva: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#16a34a'
    },
    diferenciaNegativa: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#dc2626'
    },
    diferenciaCero: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#16a34a'
    },
    observaciones: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    observacionesTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 6
    },
    observacionesText: {
        fontSize: 10,
        color: '#4b5563',
        lineHeight: 1.5
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10
    },
    footerText: {
        fontSize: 9,
        color: '#9ca3af',
        textAlign: 'center'
    }
});

export default function CierreCajaPDF({ cajaDetails, cierreData }) {
    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(num);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const montoInicial = parseFloat(cajaDetails.monto_inicial || 0);
    const totalVentas = parseFloat(cajaDetails.total_ventas || 0);
    const efectivo = parseFloat(cajaDetails.total_efectivo || 0);
    const tarjeta = parseFloat(cajaDetails.total_tarjeta || 0);
    const transferencia = parseFloat(cajaDetails.total_transferencia || 0);
    const balanceEsperado = montoInicial + totalVentas;
    const montoFinal = parseFloat(cierreData.monto_final || 0);
    const diferencia = montoFinal - balanceEsperado;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Cierre de Caja #{cajaDetails.id_caja}</Text>
                    <Text style={styles.subtitle}>
                        Apertura: {formatDate(cajaDetails.fecha_apertura)}
                    </Text>
                    <Text style={styles.subtitle}>
                        Cierre: {formatDate(new Date())}
                    </Text>
                    <Text style={styles.subtitle}>
                        Cajero: {cajaDetails.usuario_apertura || 'N/A'}
                    </Text>
                </View>

                {/* Información General */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información General</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Fondo Inicial</Text>
                            <Text style={styles.infoValue}>{formatCurrency(montoInicial)}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Total Ventas</Text>
                            <Text style={styles.infoValue}>{formatCurrency(totalVentas)}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Número de Ventas</Text>
                            <Text style={styles.infoValue}>{cajaDetails.numero_ventas || 0}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Balance Esperado</Text>
                            <Text style={styles.infoValue}>{formatCurrency(balanceEsperado)}</Text>
                        </View>
                    </View>
                </View>

                {/* Métodos de Pago */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Desglose por Método de Pago</Text>

                    <View style={styles.paymentMethod}>
                        <View>
                            <Text style={styles.paymentLabel}>Efectivo</Text>
                            <Text style={styles.paymentPercent}>
                                {totalVentas > 0 ? ((efectivo / totalVentas) * 100).toFixed(1) : 0}% del total
                            </Text>
                        </View>
                        <Text style={styles.paymentAmount}>{formatCurrency(efectivo)}</Text>
                    </View>

                    <View style={styles.paymentMethod}>
                        <View>
                            <Text style={styles.paymentLabel}>Tarjeta</Text>
                            <Text style={styles.paymentPercent}>
                                {totalVentas > 0 ? ((tarjeta / totalVentas) * 100).toFixed(1) : 0}% del total
                            </Text>
                        </View>
                        <Text style={styles.paymentAmount}>{formatCurrency(tarjeta)}</Text>
                    </View>

                    <View style={styles.paymentMethod}>
                        <View>
                            <Text style={styles.paymentLabel}>Transferencia</Text>
                            <Text style={styles.paymentPercent}>
                                {totalVentas > 0 ? ((transferencia / totalVentas) * 100).toFixed(1) : 0}% del total
                            </Text>
                        </View>
                        <Text style={styles.paymentAmount}>{formatCurrency(transferencia)}</Text>
                    </View>
                </View>

                {/* Balance Final */}
                <View style={styles.balanceSection}>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Balance Esperado:</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(balanceEsperado)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Monto Final Contado:</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(montoFinal)}</Text>
                    </View>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Diferencia:</Text>
                        <Text style={
                            diferencia > 0
                                ? styles.diferenciaPositiva
                                : diferencia < 0
                                    ? styles.diferenciaNegativa
                                    : styles.diferenciaCero
                        }>
                            {diferencia > 0 && '+'}{formatCurrency(diferencia)}
                            {diferencia > 0 && ' (Sobrante)'}
                            {diferencia < 0 && ' (Faltante)'}
                            {diferencia === 0 && ' ✓ Cuadra perfecto'}
                        </Text>
                    </View>
                </View>

                {/* Observaciones */}
                {cierreData.observaciones_cierre && (
                    <View style={styles.observaciones}>
                        <Text style={styles.observacionesTitle}>Observaciones de Cierre</Text>
                        <Text style={styles.observacionesText}>
                            {cierreData.observaciones_cierre}
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Documento generado automáticamente - {new Date().toLocaleString('es-MX')}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}