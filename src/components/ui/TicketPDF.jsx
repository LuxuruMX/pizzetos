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

const TicketPDF = ({ orden, total, datosExtra, fecha, cliente, tipoServicio, comentarios, folio }) => {
    const formatoMoneda = (cantidad) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(cantidad);
    };

    const fechaImpresion = fecha ? new Date(fecha).toLocaleString('es-MX') : new Date().toLocaleString('es-MX');

    // Helper to determine if an item is a group
    const isGroup = (item) => {
        return (item.tipoId === 'pizza_group' ||
            item.tipoId === 'id_rec' ||
            item.tipoId === 'id_barr' ||
            item.tipoId === 'id_magno') && item.productos;
    };

    // Helper to get group label
    const getGroupLabel = (item) => {
        if (item.tipoId === 'id_rec') return 'Rectangular';
        if (item.tipoId === 'id_barr') return 'Barra';
        if (item.tipoId === 'id_magno') return 'Magno';
        return `Pizzas ${item.tamano}`;
    };

    // Función para estimar la altura del contenido
    const calculateContentHeight = () => {
        let height = 0;

        // Padding inicial + márgenes de seguridad 
        height += 20;

        // Header (Titulo, Subtitulo, Fecha, Tipo Servicio)
        height += 60;
        if (folio) height += 12; // Altura para folio
        if (datosExtra?.mesa) height += 12;
        if (tipoServicio) height += 12;

        // Sección Cliente
        if (tipoServicio === 2 || tipoServicio === 3) {
            height += 45; // Header cliente + nombre + telefono (added extra space)
            if (datosExtra?.direccion_completa || datosExtra?.id_direccion) {
                // Estimar líneas de dirección (aprox 35 chars por línea para font 8)
                const dir = datosExtra.direccion_completa || 'Dirección registrada';
                const lines = Math.ceil(dir.length / 35);
                height += lines * 10;
            }
        }

        // Headers de columnas (Cant, Prod, $$)
        height += 15;

        // Items
        orden.forEach(item => {
            // Espacio entre items
            height += 4;

            if (isGroup(item)) {
                // Header del grupo
                height += 12;
                // Items dentro del grupo
                item.productos.forEach(pizza => {
                    height += 10; // Línea principal del item
                    if (pizza.ingredientesNombres && pizza.ingredientesNombres.length > 0) {
                        const ingText = `Ing: ${pizza.ingredientesNombres.join(', ')}`;
                        const lines = Math.ceil(ingText.length / 35);
                        height += lines * 10;
                    }
                });
            } else {
                // Item normal
                height += 12; // Línea principal

                // Detalles adicionales
                if (item.tamano && item.tamano !== 'N/A') height += 10;
                if (item.conQueso) height += 10;
                if (item.numeroPaquete && item.nombresDetalle) {
                    // Estimar altura de detalles del paquete
                    if (item.numeroPaquete === 1) height += 20; // Slices + Refresco
                    if (item.numeroPaquete === 2) height += 30; // Complemento + Pizza + Refresco
                    if (item.numeroPaquete === 3) {
                        // Pizzas array + Refresco
                        height += (item.nombresDetalle.pizzas ? item.nombresDetalle.pizzas.length : 0) * 10 + 10;
                    }
                } else if (item.numeroPaquete && item.detallePaquete) {
                    height += 10;
                }

                if (item.ingredientesNombres && item.ingredientesNombres.length > 0) {
                    const ingText = `Ing: ${item.ingredientesNombres.join(', ')}`;
                    const lines = Math.ceil(ingText.length / 35);
                    height += lines * 10;
                }
            }
        });

        // Totales row
        height += 30;

        // Comentarios
        if (comentarios) {
            height += 20; // Header Notas
            const lines = Math.ceil(comentarios.length / 40);
            height += lines * 10;
        }

        // Footer
        height += 30;

        // Min height para asegurar que no quede demasiado pequeño en tickets vacíos o muy simples
        return Math.max(height, 200);
    };

    const dynamicHeight = calculateContentHeight();

    return (
        <Document>
            <Page size={[164, dynamicHeight]} style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Pizzetos</Text>
                    <Text style={styles.subtitle}>Ticket de Venta</Text>
                    {folio && <Text style={[styles.subtitle, { fontWeight: 'bold' }]}>FOLIO: {folio}</Text>}
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
                        {cliente?.telefono && <Text>Tel: {cliente.telefono}</Text>}
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
                            {/* Si es un grupo (Pizzas, Rectangular, Barra, Magno), mostrar agrupado */}
                            {isGroup(item) ? (
                                <>
                                    {/* Encabezado del grupo */}
                                    <View style={styles.row}>
                                        <Text style={styles.col1}>{item.cantidad}</Text>
                                        <Text style={styles.col2}>{getGroupLabel(item)}</Text>
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
                                        {item.numeroPaquete && item.nombresDetalle ? (
                                            <View>
                                                {item.numeroPaquete === 1 && (
                                                    <>
                                                        <Text style={styles.itemDetail}>2 Pizzas: {item.nombresDetalle?.rectangular || item.detallePaquete}</Text>
                                                        <Text style={styles.itemDetail}>{item.nombresDetalle.refresco}</Text>
                                                    </>
                                                )}
                                                {item.numeroPaquete === 2 && (
                                                    <>
                                                        <Text style={styles.itemDetail}>{item.nombresDetalle.complemento}</Text>
                                                        <Text style={styles.itemDetail}>Pizza: {item.nombresDetalle.pizza}</Text>
                                                        <Text style={styles.itemDetail}>{item.nombresDetalle.refresco}</Text>
                                                    </>
                                                )}
                                                {item.numeroPaquete === 3 && (
                                                    <>
                                                        {item.nombresDetalle.pizzas && item.nombresDetalle.pizzas.map((p, i) => (
                                                            <Text key={i} style={styles.itemDetail}>Pizza {i + 1}: {p}</Text>
                                                        ))}
                                                        <Text style={styles.itemDetail}>{item.nombresDetalle.refresco}</Text>
                                                    </>
                                                )}
                                            </View>
                                        ) : (
                                            item.numeroPaquete && item.detallePaquete && (
                                                <Text style={styles.itemDetail}>
                                                    {item.numeroPaquete === 1 && `Slices: ${item.detallePaquete}`}
                                                    {item.numeroPaquete === 3 && `Pizzas: ${item.detallePaquete}`}
                                                </Text>
                                            )
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
