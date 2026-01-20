import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuente estándar si es necesario, o usar Helvetica por defecto
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        padding: 5,
        width: 164, // ~58mm
    },
    header: {
        marginBottom: 5,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        paddingBottom: 3,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 9,
        marginBottom: 2,
    },
    bold: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        borderBottomStyle: 'dashed',
        paddingBottom: 3,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    col1: {
        width: '15%',
        textAlign: 'left',
    },
    col2: {
        width: '60%',
        textAlign: 'left',
    },
    col3: {
        width: '25%',
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#000',
        borderTopStyle: 'solid',
        paddingTop: 2,
    },
    footer: {
        marginTop: 5,
        textAlign: 'center',
        fontSize: 8,
    },
    itemDetail: {
        fontSize: 8,
        fontStyle: 'italic',
        paddingLeft: 5,
    },
});

const TicketPDF = ({ orden, total, datosExtra, fecha, cliente, tipoServicio, comentarios }) => {
    const formatoMoneda = (cantidad) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(cantidad);
    };

    const fechaImpresion = fecha ? new Date(fecha).toLocaleString('es-MX') : new Date().toLocaleString('es-MX');

    return (
        <Document>
            <Page size={[164, 400]} style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Pizzetos</Text>
                    <Text style={styles.subtitle}>Ticket de Venta</Text>
                    <Text style={styles.subtitle}>{fechaImpresion}</Text>
                    {datosExtra?.mesa && <Text style={styles.bold}>MESA: {datosExtra.mesa}</Text>}
                    {tipoServicio === 1 && <Text style={styles.bold}>PARA LLEVAR</Text>}
                    {tipoServicio === 2 && <Text style={styles.bold}>DOMICILIO</Text>}
                    {tipoServicio === 3 && <Text style={styles.bold}>PEDIDO ESPECIAL</Text>}
                </View>

                {/* Cliente - Mostrar para Domicilio y Pedido Especial */}
                {(tipoServicio === 2 || tipoServicio === 3) && (
                    <View style={styles.section}>
                        <Text style={{ fontWeight: 'bold' }}>Cliente:</Text>
                        <Text>{datosExtra?.nombreClie || cliente?.nombre || cliente?.razon_social || 'No especificado'}</Text>
                        {(datosExtra?.direccion_completa || datosExtra?.id_direccion) && (
                            <Text style={{ fontSize: 8 }}>Dirección: {datosExtra.direccion_completa || 'Dirección registrada'}</Text>
                        )}
                    </View>
                )}

                {/* Items */}
                <View style={styles.section}>
                    <View style={[styles.row, { borderBottomWidth: 0.5, marginBottom: 4 }]}>
                        <Text style={styles.col1}>Cant</Text>
                        <Text style={styles.col2}>Prod</Text>
                        <Text style={styles.col3}>$$</Text>
                    </View>

                    {orden.map((item, index) => (
                        <View key={index} style={{ marginBottom: 4 }}>
                            {/* Si es un grupo de pizzas, mostrar agrupado */}
                            {item.tipoId === 'pizza_group' && item.productos ? (
                                <>
                                    {/* Encabezado del grupo */}
                                    <View style={styles.row}>
                                        <Text style={styles.col1}>{item.cantidad}</Text>
                                        <Text style={styles.col2}>Pizzas {item.tamano}</Text>
                                        <Text style={styles.col3}>{formatoMoneda(item.subtotal)}</Text>
                                    </View>
                                    {/* Lista de pizzas indentada */}
                                    {item.productos.map((pizza, pizzaIndex) => (
                                        <View key={`${index}-${pizzaIndex}`} style={{ paddingLeft: 10, marginBottom: 1 }}>
                                            <Text style={[styles.itemDetail, { fontSize: 8 }]}>
                                                {pizza.cantidad} {pizza.nombre}
                                                {pizza.conQueso && ' + Orilla de Queso'}
                                            </Text>
                                            {pizza.ingredientesNombres && pizza.ingredientesNombres.length > 0 && (
                                                <Text style={[styles.itemDetail, { paddingLeft: 5 }]}>
                                                    Ing: {pizza.ingredientesNombres.join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </>
                            ) : (
                                /* Para otros items (no grupos de pizzas) */
                                <>
                                    <View style={styles.row}>
                                        <Text style={styles.col1}>{item.cantidad}</Text>
                                        <Text style={styles.col2}>{item.nombre}</Text>
                                        <Text style={styles.col3}>{formatoMoneda(item.subtotal || (item.precio * item.cantidad))}</Text>
                                    </View>
                                    {/* Detalles */}
                                    <View>
                                        {item.tamano && item.tamano !== 'N/A' && <Text style={styles.itemDetail}>Tam: {item.tamano}</Text>}
                                        {item.conQueso && <Text style={styles.itemDetail}>+ Orilla de Queso</Text>}
                                        {item.numeroPaquete && item.detallePaquete && (
                                            <Text style={styles.itemDetail}>
                                                {item.numeroPaquete === 1 && `Slices: ${item.detallePaquete}`}
                                                {item.numeroPaquete === 3 && `Pizzas: ${item.detallePaquete}`}
                                            </Text>
                                        )}
                                        {item.ingredientesNombres && item.ingredientesNombres.length > 0 && (
                                            <Text style={styles.itemDetail}>Ing: {item.ingredientesNombres.join(', ')}</Text>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalRow}>
                    <Text style={styles.bold}>TOTAL:</Text>
                    <Text style={styles.bold}>{formatoMoneda(total)}</Text>
                </View>

                {/* Comentarios */}
                {comentarios && (
                    <View style={[styles.section, { marginTop: 5 }]}>
                        <Text style={[styles.bold, { fontSize: 8 }]}>NOTAS:</Text>
                        <Text style={{ fontStyle: 'italic' }}>{comentarios}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>¡Gracias por su compra!</Text>
                </View>
            </Page>
        </Document>
    );
};

export default TicketPDF;
