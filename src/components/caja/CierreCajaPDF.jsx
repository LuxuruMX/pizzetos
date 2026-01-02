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
        // Eliminamos el estilo original de paymentMethod
        // Lo reemplazamos con un estilo más compacto para la cuadrícula
        padding: 8, // Reducido
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        // Añadimos propiedades para que se comporte como un ítem de grid
        flex: 1,
        minWidth: '30%', // Ajusta según sea necesario
        margin: 2, // Espacio entre ítems
    },
    paymentGrid: { // Añadimos este nuevo estilo para contener la cuadrícula
        display: 'flex',
        flexDirection: 'row', // Disposición horizontal
        flexWrap: 'wrap', // Permitir envoltura si no caben en una línea
        justifyContent: 'space-between', // Distribuir espacio entre ítems
        gap: 4, // Pequeño espacio entre ítems
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
    },
    salesSection: {
        marginTop: 15
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        alignItems: 'center'
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        color: '#374151',
        fontSize: 10
    },
    tableCell: {
        flex: 1,
        padding: 6,
        fontSize: 9,
        textAlign: 'center'
    },
    textGreen: {
        color: '#16a34a',
        fontWeight: 'bold'
    },
    textBlue: {
        color: '#2563eb',
        fontWeight: 'bold'
    },
    textPurple: {
        color: '#9333ea',
        fontWeight: 'bold'
    },
    textRed: {
        color: '#dc2626',
        fontWeight: 'bold'
    },
    gastosCard: {
        padding: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fecaca',
        marginBottom: 8
    },
    gastosHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    gastosConcepto: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#991b1b'
    },
    gastosMonto: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#dc2626'
    },
    gastosCategoria: {
        fontSize: 8,
        color: '#7f1d1d',
        fontStyle: 'italic'
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
        textAlign: 'center',
        paddingBottom: 10,
        borderBottom: 2,
        borderBottomColor: '#2563eb'
    }
});

export default function CierreCajaPDF({ cajaDetails, cierreData, ventasData = [], gastosData = [] }) {
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

    const totalGastos = gastosData.reduce((acc, gasto) =>
        acc + (parseFloat(gasto.precio || gasto.monto) || 0), 0
    );

    const balanceEsperado = montoInicial + totalVentas - totalGastos;
    const montoFinal = parseFloat(cierreData.monto_final || 0);
    const diferencia = montoFinal - balanceEsperado;

    const groupedSales = ventasData.reduce((acc, venta) => {
        if (!acc[venta.id_venta]) {
            acc[venta.id_venta] = {
                id_venta: venta.id_venta,
                referencias: new Set(),
                pagos: {}
            };
        }

        if (venta.referencia) {
            acc[venta.id_venta].referencias.add(venta.referencia);
        }
        const metodo = venta.Metodo;
        const monto = parseFloat(venta.monto) || 0;

        if (!acc[venta.id_venta].pagos[metodo]) {
            acc[venta.id_venta].pagos[metodo] = 0;
        }
        acc[venta.id_venta].pagos[metodo] += monto;

        return acc;
    }, {});

    const groupedArray = Object.values(groupedSales);

    return (
        <Document>
            {/* PÁGINA 1: RESUMEN COMPLETO */}
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
                            <Text style={styles.infoLabel}>Total Gastos</Text>
                            <Text style={[styles.infoValue, styles.textRed]}>{formatCurrency(totalGastos)}</Text>
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
                    <View style={styles.paymentGrid}>
                        {/* Efectivo */}
                        <View style={styles.paymentMethod}>
                            <View>
                                <Text style={styles.paymentLabel}>Efectivo</Text>
                                <Text style={styles.paymentPercent}>
                                    {totalVentas > 0 ? ((efectivo / totalVentas) * 100).toFixed(1) : 0}% del total
                                </Text>
                            </View>
                            <Text style={styles.paymentAmount}>{formatCurrency(efectivo)}</Text>
                        </View>

                        {/* Tarjeta */}
                        <View style={styles.paymentMethod}>
                            <View>
                                <Text style={styles.paymentLabel}>Tarjeta</Text>
                                <Text style={styles.paymentPercent}>
                                    {totalVentas > 0 ? ((tarjeta / totalVentas) * 100).toFixed(1) : 0}% del total
                                </Text>
                            </View>
                            <Text style={styles.paymentAmount}>{formatCurrency(tarjeta)}</Text>
                        </View>

                        {/* Transferencia */}
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
                </View>

                {/* Balance Final */}
                <View style={styles.balanceSection}>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Fondo Inicial:</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(montoInicial)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>+ Total Ventas:</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(totalVentas)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>- Total Gastos:</Text>
                        <Text style={[styles.balanceValue, styles.textRed]}>{formatCurrency(totalGastos)}</Text>
                    </View>
                    <View style={styles.balanceDivider} />
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

            {/* PÁGINA 2: DETALLE DE GASTOS */}
            {gastosData && gastosData.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.pageTitle}>Detalle de Gastos - Caja #{cajaDetails.id_caja}</Text>

                    <View style={styles.section}>
                        {gastosData.map((gasto, index) => (
                            <View key={index} style={styles.gastosCard}>
                                <View style={styles.gastosHeader}>
                                    <Text style={styles.gastosConcepto}>
                                        {gasto.descripcion}
                                    </Text>
                                    <Text style={styles.gastosMonto}>
                                        {formatCurrency(gasto.precio || gasto.monto)}
                                    </Text>
                                </View>
                                {gasto.categoria && (
                                    <Text style={styles.gastosCategoria}>
                                        Categoría: {gasto.categoria}
                                    </Text>
                                )}
                            </View>
                        ))}

                        <View style={[styles.paymentMethod, { backgroundColor: '#fee2e2', borderColor: '#fecaca', marginTop: 15 }]}>
                            <Text style={[styles.paymentLabel, { color: '#991b1b', fontSize: 14 }]}>Total de Gastos</Text>
                            <Text style={[styles.paymentAmount, { color: '#dc2626', fontSize: 16 }]}>
                                {formatCurrency(totalGastos)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Página 2 - Detalle de Gastos
                        </Text>
                    </View>
                </Page>
            )}

            {/* PÁGINA 3: DETALLE DE VENTAS */}
            {groupedArray && groupedArray.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.pageTitle}>Detalle de Ventas - Caja #{cajaDetails.id_caja}</Text>

                    <View style={styles.salesSection}>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={styles.tableCell}>ID Venta</Text>
                                <Text style={styles.tableCell}>Referencia</Text>
                                <Text style={[styles.tableCell, { flex: 2 }]}>Desglose de Pagos</Text>
                                <Text style={styles.tableCell}>Total</Text>
                            </View>
                            {groupedArray.map((group, index) => {
                                const totalVenta = Object.values(group.pagos).reduce((sum, monto) => sum + monto, 0);
                                const desgloseElements = Object.entries(group.pagos).map(([metodo, monto], i) => {
                                    let style = {};
                                    if (metodo === 'Efectivo') style = styles.textGreen;
                                    else if (metodo === 'Tarjeta') style = styles.textBlue;
                                    else if (metodo === 'Transferencia') style = styles.textPurple;

                                    return (
                                        <Text key={i} style={style}>
                                            {metodo}: {formatCurrency(monto)}{i < Object.entries(group.pagos).length - 1 ? '\n' : ''}
                                        </Text>
                                    );
                                });

                                return (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={styles.tableCell}>#{group.id_venta}</Text>
                                        <Text style={styles.tableCell}>
                                            {group.referencias.size > 0
                                                ? Array.from(group.referencias).join('\n')
                                                : '-'}
                                        </Text>
                                        <View style={[styles.tableCell, { flex: 2 }]}>
                                            {desgloseElements}
                                        </View>
                                        <Text style={styles.tableCell}>{formatCurrency(totalVenta)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Página 3 - Detalle de Ventas
                        </Text>
                    </View>
                </Page>
            )}
        </Document>
    );
}