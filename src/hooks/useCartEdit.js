import { useState } from "react";
import { PRECIOS_ORILLA_QUESO } from '@/config/prices';

export const useCartEdit = () => {
  const [orden, setOrden] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [statusPrincipal, setStatusPrincipal] = useState(1);
  const [ingredientesCache, setIngredientesCache] = useState([]); // Nuevo estado para cache de ingredientes/nombres

  const calcularPrecioYSubtotal = (precioBase, cantidad) => {
    const pares = Math.floor(cantidad / 2);
    const sueltos = cantidad % 2;
    const subtotal = pares * precioBase + sueltos * precioBase * 0.6;
    const precioUnitario = subtotal / cantidad;

    return {
      precioUnitario,
      subtotal,
    };
  };

  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map(item => {
      // Si el item está cancelado (status 0) y no es un grupo, su subtotal es 0
      // Nota: Para grupos, manejamos el status interno de los productos para la suma
      if (item.status === 0 && !item.productos) {
        return { ...item, subtotal: 0 };
      }

      // Caso 1: Grupo de Pizzas Unificadas (Normales, Mariscos, Custom)
      if (item.tipoId === 'pizza_group') {
        const unidades = [];
        let costoTotalQueso = 0;
        
        if (item.productos) {
            item.productos.forEach(prod => {
                // Ignorar cancelados para el cálculo 2x1
                if (prod.status === 0) return;

                let precioBase = parseFloat(prod.precio || 0);
                
                if (prod.conQueso) {
                    const sizeName = item.tamano;
                    const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
                        key => key.toLowerCase() === sizeName.toLowerCase()
                    ) || sizeName;
                    const extraPrecio = PRECIOS_ORILLA_QUESO[tamanoKey] || 0;
                    precioBase -= extraPrecio;
                    costoTotalQueso += extraPrecio * prod.cantidad;
                }
                
                for (let i = 0; i < prod.cantidad; i++) {
                    unidades.push({
                        precio: precioBase
                    });
                }
            });
        }

        unidades.sort((a, b) => b.precio - a.precio);

        const pares = Math.floor(unidades.length / 2);
        const sobra = unidades.length % 2;
        let nuevoSubtotal = 0;
        let unitIndex = 0;
        
        for (let i = 0; i < pares; i++) {
            nuevoSubtotal += unidades[unitIndex].precio; // Paga
            unitIndex++;
            unitIndex++; // Gratis
        }

        if (sobra > 0) {
            nuevoSubtotal += unidades[unitIndex].precio * 0.6;
            unitIndex++;
        }

        nuevoSubtotal += costoTotalQueso;

        return {
            ...item,
            subtotal: nuevoSubtotal,
            precioUnitario: unidades.length > 0 ? (nuevoSubtotal / unidades.length) : 0
        };
      }

      // Caso 2: Paquetes
      if (item.esPaquete) {
         if (item.status === 0) return { ...item, subtotal: 0 };
         return {
           ...item,
           subtotal: item.precioUnitario * item.cantidad
         };
      }
      
      // Caso 3: Otros Grupos (Rec, Barr, Magno)
      // Rec/Barr/Magno tienen precio fijo por GRUPO.
      // Si el grupo está activo (status 1), cobra completo por grupo.
      // Si status es 0, no cobra.
      
      return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad
      };
    });
  };

  // Cargar productos desde el backend y completar con datos de la caché
  const cargarProductosOriginales = (productosBackend, productosCache, ingredientesCacheData = []) => {
    // Definir tipoMap al inicio
    // Definir tipoMap al inicio
    const tipoMap = {
      'id_pizza': 'pizzas',
      'id_hamb': 'hamburguesas',
      'id_alis': 'alitas',
      'id_cos': 'costillas',
      'id_spag': 'spaguetty',
      'id_papa': 'papas',
      'id_rec': 'rectangular',
      'id_barr': 'barra',
      'id_maris': 'mariscos',
      'id_refresco': 'refrescos',
      'id_paquete': 'paquetes'
    };

    const catToIdField = {
      'pizzas': 'id_pizza',
      'hamburguesas': 'id_hamb',
      'alitas': 'id_alis',
      'costillas': 'id_cos',
      'spaguetty': 'id_spag',
      'papas': 'id_papa',
      'rectangular': 'id_rec',
      'barra': 'id_barr',
      'mariscos': 'id_maris',
      'refrescos': 'id_refresco',
      'magno': 'id_magno'
    };

    setIngredientesCache(ingredientesCacheData);

    const productosConvertidos = productosBackend.map((prod, index) => {
      const esPaquete = prod.tipo === 'id_paquete';
      const esCustomPizza = prod.tipo === 'custom_pizza';
      
      let nombre = `Producto ${prod.id}`;
      let precio = parseFloat(prod.precio || prod.precio_unitario || 0);

      // --- LOGICA CUSTOM PIZZA ---
      if (esCustomPizza) {
        // Reconstruir nombre basado en ingredientes
        const ingredientesIds = prod.ingredientes || []; 
        // Asumiendo prod.ingredientes sea array de IDs. Si viene como objeto {tamano, ingredientes}, ajustar.
        let idsOnly = [];
        let tamanoId = 0;
        
        if (prod.ingredientes && typeof prod.ingredientes === 'object' && !Array.isArray(prod.ingredientes)) {
            idsOnly = prod.ingredientes.ingredientes || [];
            tamanoId = prod.ingredientes.tamano;
        } else if (Array.isArray(prod.ingredientes)) {
            idsOnly = prod.ingredientes;
        }

        const nombresIng = idsOnly.map(id => {
            const ing = ingredientesCacheData.find(i => i.id_ingrediente === id);
            return ing ? ing.nombre : '';
        }).filter(n => n !== '');
        
        const nombreIngredientes = nombresIng.length > 0
          ? nombresIng.slice(0, 3).join(', ') + (nombresIng.length > 3 ? '...' : '')
          : 'Personalizada';
          
        nombre = `Pizza Custom - ${nombreIngredientes}`;
        
        // Crear item para carrito
        const idCarrito = `original_custom_${index}_${Date.now()}`;
        
        return {
          id: idCarrito,
          idProducto: null, // No tiene ID de producto de catálogo
          tipoId: 'custom_pizza',
          nombre: nombre,
          tamano: prod.tamaño || prod.tamano || 'Grande', // Asumiendo default
          precioOriginal: precio,
          precioUnitario: precio,
          cantidad: prod.cantidad,
          subtotal: precio * prod.cantidad,
          status: prod.status,
          esPaquete: false,
          esCustom: true,
          esOriginal: true,
          esModificado: false,
          productos: null,
          ingredientes: {
             tamano: tamanoId || 0,
             ingredientes: idsOnly
          },
          ingredientesNombres: nombresIng,
          conQueso: prod.queso && parseFloat(prod.queso) > 0 ? true : false
        };
      }

      // --- LOGICA PRODUCTO NORMAL ---
      // Buscar en la caché de productos
      const categoria = tipoMap[prod.tipo];
      let cachedTamano = null;

      if (categoria && productosCache[categoria]) {
        const categoriaProductos = productosCache[categoria];
        const tipoIdCampo = prod.tipo; 
        
        let producto = null;

        // Para pizzas, mariscos y refrescos que tienen tamaño/subcategoría
        if (['id_pizza', 'id_maris', 'id_refresco'].includes(prod.tipo) && (prod.tamaño || prod.tamano)) {
          const sizeBuscar = prod.tamaño || prod.tamano;
          // Buscar por ID del producto y tamaño específico
          const variante = categoriaProductos.find(p => 
            p[tipoIdCampo] === prod.id && 
            (p.subcategoria === sizeBuscar || p.tamaño === sizeBuscar || p.tamano === sizeBuscar)
          );
          
          if (variante) {
            producto = variante;
            nombre = variante.nombre;
            precio = parseFloat(variante.precio);
          } else {
            // Fallback: buscar solo por ID
            const productoBase = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
            if (productoBase) {
              producto = productoBase;
              nombre = `${productoBase.nombre} ${sizeBuscar}`;
              precio = parseFloat(productoBase.precio);
            }
          }
        } else {
          // Para productos sin variantes de tamaño o sin tamaño especificado en payload
          producto = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
          
          if (producto) {
            nombre = producto.nombre;
            precio = parseFloat(producto.precio);
          }
        }

        if (producto) {
            cachedTamano = producto.subcategoria || producto.tamano || producto.tamaño;
        }
      }

      // --- Lógica para manejar "id" como objeto/array (Backend nuevo) ---
      let realId = prod.id;
      let detallePaqueteObj = null;
      let detalleRectangularArr = null;

      if (typeof prod.id === 'object' && prod.id !== null) {
          if (Array.isArray(prod.id)) {
             // Es Rectangular/Barra con array de IDs
             detalleRectangularArr = prod.id;
             realId = `composite_${Date.now()}_${index}`; // Generar un ID temporal seguro
             
             // Asignar nombre correcto basado en tipo
             if(['rectangular', 'id_rec'].includes(prod.tipo)) nombre = 'Pizza Rectangular';
             else if(['barra', 'id_barr'].includes(prod.tipo)) nombre = 'Pizza Barra';
             else if(['magno', 'id_magno'].includes(prod.tipo)) nombre = 'Pizza Magno';
             else nombre = 'Pizza Compuesta';
             
             // Construir sub-productos (slices)
             // Esto requiere buscar los nombres de los slices en su catalogo correspondiente
             const categoriaSlices = tipoMap[prod.tipo] || 'rectangular'; // Default a rectangular si falla
             const productosCategoria = productosCache[categoriaSlices] || [];
             
             const productosDetalle = detalleRectangularArr.map(sliceId => {
                 
                 const sliceProducto = productosCategoria.find(p => 
                    p.id === sliceId || p[prod.tipo] === sliceId || p.id_rec === sliceId || p.id_barr === sliceId || p.id_magno === sliceId
                 );
                 
                 return {
                     id: sliceId,
                     idProducto: sliceId,
                     nombre: sliceProducto ? sliceProducto.nombre : `Slice ${sliceId}`,
                     cantidad: 1, // Cada ID cuenta como 1 slice
                     precio: 0, // El precio va al grupo
                     status: prod.status, // Heredar status del padre
                     tipoId: prod.tipo // id_rec, id_barr...
                 };
             });
             
             return {
                 id: realId,
                 tipoId: prod.tipo, // id_rec
                 nombre: nombre,
                 tamano: 'Único',
                 precioOriginal: precio,
                 precioUnitario: precio,
                 cantidad: prod.cantidad, // Cantidad de GRUPOS
                 subtotal: precio * prod.cantidad,
                 status: prod.status,
                 esPaquete: false,
                 esOriginal: true,
                 esModificado: false,
                 productos: productosDetalle
             };

          } else {
             // Es Paquete con objeto de detalles
             detallePaqueteObj = prod.id;
             realId = detallePaqueteObj.id_paquete || index;
          }
      } else {
          // Si no es objeto, intentar nombres standard
          if(['rectangular', 'id_rec'].includes(prod.tipo)) nombre = 'Pizza Rectangular';
          else if(['barra', 'id_barr'].includes(prod.tipo)) nombre = 'Pizza Barra';
          else if(['magno', 'id_magno'].includes(prod.tipo)) nombre = 'Pizza Magno';
      }

      // Si es un paquete, establecer nombre y precio fijo (si no vino del backend ya correcto)
      if (esPaquete) {
        nombre = `Paquete ${realId}`;
        // Si el precio viene del backend (prod.precio), usarlo. Si no, hardcode.
        if (!precio) {
             precio = realId === 1 ? 295 : realId === 2 ? 265 : realId === 3 ? 395 : 0;
        }
      }

      // Crear ID único para el carrito
      // Usar cachedTamano como fallback si prod.tamaño no existe
      const tamanoFinal = prod.tamaño || prod.tamano || cachedTamano || 'N/A';
      
      const idCarrito = `original_${prod.tipo}_${realId}_${index}_${tamanoFinal}`;

      const itemBase = {
        id: idCarrito,
        idProducto: realId,
        tipoId: prod.tipo,
        nombre: nombre,
        tamano: tamanoFinal,
        precioOriginal: precio,
        precioUnitario: precio,
        cantidad: prod.cantidad,
        subtotal: precio * prod.cantidad,
        status: prod.status,
        esPaquete: esPaquete,
        esOriginal: true,
        esModificado: false,
        productos: null
      };

      if (esPaquete) {
        // Parsear detalle_paquete
        let detallePaquete = null;
        let idRefresco = null; 
        let idPizzas = [];
        let idHamb = null;
        let idAlis = null;
        let pId = null;

        if (detallePaqueteObj) {
            // Caso Nuevo: id viene como objeto
            pId = detallePaqueteObj.id_paquete;
            idPizzas = detallePaqueteObj.id_pizzas || [];
            detallePaquete = idPizzas.join(',');
            idRefresco = detallePaqueteObj.id_refresco;
            idHamb = detallePaqueteObj.id_hamb;
            idAlis = detallePaqueteObj.id_alis;
        } else if (prod.detalle_paquete && typeof prod.detalle_paquete === 'object') {
            // Caso anterior (si backend cambia parcialmente)
            pId = prod.id;
            idPizzas = prod.detalle_paquete.id_pizzas || [];
            detallePaquete = idPizzas.join(',');
            idRefresco = prod.detalle_paquete.id_refresco;
            idHamb = prod.detalle_paquete.id_hamb;
            idAlis = prod.detalle_paquete.id_alis;
        } else {
            // Caso Legacy
            pId = prod.id;
            detallePaquete = prod.detalle_paquete;
            idRefresco = prod.id_refresco;
            // id_pizza legacy?
            if (prod.id_pizza) idPizzas = [prod.id_pizza];
        }

        itemBase.datoPaquete = {
          id_paquete: pId, // el ID del paquete (1, 2, 3)
          id_refresco: idRefresco || 17, // Fallback default ref
          detalle_paquete: detallePaquete, 
          id_pizza: idPizzas.length > 0 ? idPizzas[0] : null, 
          id_hamb: idHamb || null,
          id_alis: idAlis || null,
        };
      }
      
      // LOGICA RECTANGULAR / BARRA (detalle como array de IDs)
      if (['rectangular', 'id_rec', 'id_barr', 'barra', 'id_magno', 'magno'].includes(prod.tipo)) {
          // Normalizar tipoId
          let tipoInterno = 'id_rec';
          if(['barra', 'id_barr'].includes(prod.tipo)) tipoInterno = 'id_barr';
          if(['magno', 'id_magno'].includes(prod.tipo)) tipoInterno = 'id_magno';
          
          itemBase.tipoId = tipoInterno; // Asegurar consistencia

          // Usar el array extraído arriba o buscar en otras propiedades legacy
          const detalleArray = detalleRectangularArr || prod.detalle_rectangular || prod.detalle_barra || prod.detalle || [];
          
          if (Array.isArray(detalleArray) && detalleArray.length > 0) {
              // Convertir IDs en subproductos
              const subProductos = detalleArray.map((idProd, idx) => {
                  let nombreSub = `Ingrediente (${idProd})`;
                  const idProdInt = parseInt(idProd);
                  
                  // Buscar nombre en TODAS las categorías de la caché
                  if (productosCache) {
                      let encontrado = null;
                      
                      // Iterar sobre todas las categorías (pizzas, rectangular, etc.)
                      const categorias = Object.keys(productosCache);
                      for (const cat of categorias) {
                          if (Array.isArray(productosCache[cat])) {
                              const idField = catToIdField[cat] || 'id';
                              const p = productosCache[cat].find(x => x[idField] == idProdInt);
                              if (p) {
                                  encontrado = p;
                                  break; // Dejar de buscar si lo encontramos
                              }
                          }
                      }

                      if (encontrado) {
                          nombreSub = encontrado.nombre;
                      } else {
                          console.warn(`Sub-producto ID ${idProdInt} no encontrado en ninguna categoría (buscando por campos específicos).`);
                      }
                  } else {
                     console.warn("No existe productosCache", productosCache);
                  }
                  
                  return {
                      id: `${tipoInterno}_${idProd}_${Date.now()}_${idx}`, 
                      idProducto: idProd,
                      nombre: nombreSub,
                      cantidad: 1, 
                      status: 1, 
                      esOriginal: true,
                      esNuevo: false,
                      precio: 0 // Precio incluido en el padre
                  };
              });
              
              itemBase.productos = subProductos;
          }
      }
      
      // Manejar queso si viene del backend
      if (prod.queso && parseFloat(prod.queso) > 0) {
         itemBase.conQueso = true;
      }

      return itemBase;
    });

    // Agrupar pizzas/mariscos del mismo tamaño
    const productosAgrupados = agruparProductosPorTamano(productosConvertidos);

    setProductosOriginales(productosConvertidos);
    setOrden(recalcularPrecios(productosAgrupados));
  };

  // Agrupar pizzas/mariscos del mismo tamaño en un solo item del carrito
  const agruparProductosPorTamano = (productos) => {
    const agrupados = [];
    const categoriasAgrupables = ["id_pizza", "id_maris", "custom_pizza"]; // Añadido custom_pizza
    const yaAgrupados = new Set();

    productos.forEach((prod, index) => {
      if (yaAgrupados.has(index)) return;

      if (categoriasAgrupables.includes(prod.tipoId)) {
        
        let targetGroupType = prod.tipoId;
        if (prod.tipoId === 'id_pizza' || prod.tipoId === 'custom_pizza' || prod.tipoId === 'id_maris') {
            targetGroupType = 'pizza_group';
        }

        // Buscar items compatibles para este grupo
        const grupo = productos.filter(
          (p, i) =>
            !yaAgrupados.has(i) &&
            ((p.tipoId === 'id_pizza' || p.tipoId === 'custom_pizza' || p.tipoId === 'id_maris') ? targetGroupType === 'pizza_group' : p.tipoId === prod.tipoId) &&
            p.tamano === prod.tamano &&
            !p.esPaquete
        );

        grupo.forEach((p, i) => {
          const idx = productos.findIndex(
            (item) =>
              item.id === p.id && !yaAgrupados.has(productos.indexOf(item))
          );
          if (idx !== -1) yaAgrupados.add(idx);
        });
        
            // Es PIZZA GROUP (id_pizza, id_maris, custom_pizza)
            const cantidadTotal = grupo.reduce((sum, p) => sum + p.cantidad, 0);
            const productosDetalle = grupo.map((p) => ({
                id: p.id,
                idProducto: p.idProducto, // null si es custom
                nombre: p.nombre,
                cantidad: p.cantidad,
                status: p.status,
                esOriginal: p.esOriginal,
                esCustom: p.esCustom,
                precio: p.precioOriginal,
                conQueso: p.conQueso || false,
                ingredientes: p.ingredientes, // para custom
                tipoId: p.tipoId // guardar tipo original
            }));

            const statusGrupo = grupo.some(p => p.status !== 0) ? 1 : 0;

            agrupados.push({
                id: `pizza_group_${prod.tamano}_original_${Date.now()}`,
                tipoId: 'pizza_group', // UNIFICADO
                nombre: `Pizzas ${prod.tamano}`,
                tamano: prod.tamano,
                precioOriginal: 0, 
                precioUnitario: 0,
                cantidad: cantidadTotal,
                subtotal: 0,
                status: statusGrupo,
                esPaquete: false,
                esOriginal: true,
                esModificado: false,
                productos: productosDetalle,
            });

      } else {
        agrupados.push(prod);
      }
    });

    return agrupados;
  };

  // Agregar producto al carrito (PORTADO DE useCart.js + STATUS)
  const agregarAlCarrito = (producto, tipoId) => {
    // Intentar obtener ID usando el tipoId provisto
    let id = producto[tipoId];
    
    // Si no encuentra ID, buscar en producto
    if (id === undefined || id === null) {
        id = producto.id || producto.id_pizza || producto.id_maris || producto.id_hamb || producto.id_alis || 
             producto.id_cos || producto.id_spag || producto.id_papa || producto.id_rec || 
             producto.id_barr || producto.id_refresco || producto.id_paquete;
    }

    const precioOriginal = parseFloat(producto.precio);
    const tamanoRaw = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
    const tamano = typeof tamanoRaw === 'string' ? tamanoRaw.trim() : tamanoRaw;
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      
      // Lógica específica para agrupar id_rec en grupos de 4
      if (tipoId === 'id_rec') {
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && !item.esPaquete && 
          (item.productos.reduce((acc, p) => acc + (p.status !== 0 ? p.cantidad : 0), 0) < 4)
        );

        let nuevaOrden;

        if (grupoExistente) {
           nuevaOrden = prevOrden.map((item) => {
             if (item.id === grupoExistente.id) {
               const productoExistenteIndex = item.productos.findIndex(p => (p.idProducto == id || p.id === `${tipoId}_${id}` || p.id === id) && p.tipoId === tipoId && p.status !== 0); 
               
               let nuevosProductos = [...item.productos];
               
               if (productoExistenteIndex >= 0) {
                 // Incrementar item existente
                 nuevosProductos[productoExistenteIndex] = { ...nuevosProductos[productoExistenteIndex], cantidad: nuevosProductos[productoExistenteIndex].cantidad + 1, status: 1, esModificado: true };
               } else {
                 // Nuevo sub-item
                 const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
                 nuevosProductos.push({ id: nuevoIdSubItem, idProducto: id, nombre, cantidad: 1, precio: precioOriginal, tipoId, status: 1, esNuevo: true });
               }
               
               return {
                 ...item,
                 status: 1,
                 esModificado: true,
                 productos: nuevosProductos
               };
             }
             return item;
           });
        } else {
           const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
           nuevaOrden = [
             ...prevOrden,
             {
               id: `${tipoId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: `Rectangular`,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1,
               subtotal: precioOriginal,
               esPaquete: false,
               status: 1, esNuevo: true,
               productos: [{ id: nuevoIdSubItem, idProducto: id, nombre, cantidad: 1, precio: precioOriginal, tipoId, status: 1, esNuevo: true }]
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

      // Lógica específica para agrupar id_barr e id_magno en grupos de 2
      if (tipoId === 'id_barr' || tipoId === 'id_magno') {
        const limite = 2;
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && !item.esPaquete && 
          (item.productos.reduce((acc, p) => acc + (p.status !== 0 ? p.cantidad : 0), 0) < limite)
        );

        let nuevaOrden;

        if (grupoExistente) {
           nuevaOrden = prevOrden.map((item) => {
             if (item.id === grupoExistente.id) {
               const productoExistenteIndex = item.productos.findIndex(p => (p.idProducto == id || p.id === `${tipoId}_${id}` || p.id === id) && p.tipoId === tipoId && p.status !== 0); 

               let nuevosProductos = [...item.productos];
               if (productoExistenteIndex >= 0) {
                 nuevosProductos[productoExistenteIndex] = { ...nuevosProductos[productoExistenteIndex], cantidad: nuevosProductos[productoExistenteIndex].cantidad + 1, status: 1, esModificado: true };
               } else {
                 const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
                 nuevosProductos.push({ id: nuevoIdSubItem, idProducto: id, nombre, cantidad: 1, precio: precioOriginal, tipoId, status: 1, esNuevo: true });
               }
               return {
                 ...item, status: 1, esModificado: true, productos: nuevosProductos
               };
             }
             return item;
           });
        } else {
           const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
           const nombreGrupo = tipoId === 'id_barr' ? 'Barra' : 'Magno';
           
           nuevaOrden = [
             ...prevOrden,
             {
               id: `${tipoId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: nombreGrupo,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1,
               subtotal: precioOriginal,
               esPaquete: false,
               status: 1, esNuevo: true,
               productos: [{ id: nuevoIdSubItem, idProducto: id, nombre, cantidad: 1, precio: precioOriginal, tipoId, status: 1, esNuevo: true }]
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

      const categoriasConDescuento = ['id_pizza', 'id_maris'];

      if (categoriasConDescuento.includes(tipoId)) {
        const normalizedTamano = typeof tamano === 'string' ? tamano.trim().toLowerCase() : tamano;
        let targetGroupType = 'pizza_group';

        const existingGroupIndex = prevOrden.findIndex(
            item => item.tipoId === targetGroupType && 
            (typeof item.tamano === 'string' ? item.tamano.trim().toLowerCase() : item.tamano) === normalizedTamano && 
            !item.esPaquete
        );

        let nuevaOrden = [...prevOrden];

        if (existingGroupIndex >= 0) {
            const group = nuevaOrden[existingGroupIndex];
            
            const existingProdIndex = group.productos.findIndex(
                p => (p.idProducto === id || p.id === `${tipoId}_${id}` || p.id === id) && p.tipoId === tipoId && p.status !== 0
            );

            let nuevosProductos = [...group.productos];
            if (existingProdIndex >= 0) {
                nuevosProductos[existingProdIndex] = {
                    ...nuevosProductos[existingProdIndex],
                    cantidad: nuevosProductos[existingProdIndex].cantidad + 1,
                    status: 1
                };
            } else {
                const uniqueId = `${tipoId}_${id}_${Date.now()}`;
                nuevosProductos.push({
                    id: uniqueId,
                    idProducto: id,
                    nombre,
                    precio: precioOriginal,
                    cantidad: 1,
                    tipoId,
                    status: 1, esNuevo: true
                });
            }

            nuevaOrden[existingGroupIndex] = {
                ...group,
                cantidad: group.cantidad + 1,
                status: 1, esModificado: true,
                productos: nuevosProductos
            };

        } else {
             const uniqueId = `${tipoId}_${id}_${Date.now()}`;
             nuevaOrden.push({
                id: `pizza_group_${tamano}_${Date.now()}`,
                tipoId: 'pizza_group',
                nombre: `Pizzas ${tamano}`,
                tamano: tamano,
                esPaquete: false,
                cantidad: 1,
                precioUnitario: 0, 
                subtotal: 0,
                status: 1, esNuevo: true,
                productos: [{
                    id: uniqueId,
                    idProducto: id,
                    nombre,
                    precio: precioOriginal,
                    cantidad: 1,
                    tipoId,
                    status: 1, esNuevo: true
                }]
            });
        }

        return recalcularPrecios(nuevaOrden);

      } else {
        // Items no agrupados en array productos (como refrescos antes)
        // El useCartEdit usaba item suelto, useCart.js nuevo tambien.
        
        const itemExistente = prevOrden.find(
          (item) => (item.idProducto === id || item.id === id) && item.tipoId === tipoId && !item.esPaquete && item.status !== 0
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            (item.idProducto === id || item.id === id) && item.tipoId === tipoId && !item.esPaquete && item.status !== 0
              ? { ...item, cantidad: item.cantidad + 1, status: 1, esModificado: true }
              : item
          );
        } else {
          // Crear nuevo ID seguro para evitar colisiones
          const uniqueId = `${tipoId}_${id}_${Date.now()}`;
          nuevaOrden = [
            ...prevOrden,
            {
              id: uniqueId,
              idProducto: id,
              tipoId,
              nombre,
              precioOriginal,
              precioUnitario: precioOriginal,
              cantidad: 1,
              subtotal: precioOriginal,
              tamano: tamano,
              productos: null,
              esPaquete: false,
              status: 1, esNuevo: true
            },
          ];
        }
        return recalcularPrecios(nuevaOrden);
      }
    });
  };

  const agregarPizzaCustom = (customPizza) => {
    setOrden((prevOrden) => {
      const tamano = customPizza.nombreTamano || customPizza.tamano;
      const ingredientesNombres = customPizza.ingredientesNombres || [];
      const nombreIngredientes = ingredientesNombres.length > 0 
        ? ingredientesNombres.slice(0, 3).join(', ') + (ingredientesNombres.length > 3 ? '...' : '')
        : 'Personalizada';
      
      const idProducto = `custom_${Date.now()}`;
      const nombreProducto = `Pizza Custom - ${nombreIngredientes}`;
      const precio = customPizza.precio;

      // Buscar grupo existente por tamaño (pizza_group)
      const existingGroupIndex = prevOrden.findIndex(
        item => item.tipoId === 'pizza_group' && item.tamano === tamano
      );

      let nuevaOrden = [...prevOrden];

      if (existingGroupIndex >= 0) {
          // Agregar al grupo existente
          const group = nuevaOrden[existingGroupIndex];
          const nuevosProductos = [
              ...(group.productos || []),
              {
                  id: idProducto,
                  nombre: nombreProducto,
                  precio: precio,
                  cantidad: 1,
                  status: 1,
                  tipoId: 'custom_pizza', // Guardar tipoId
                  esCustom: true,
                  esNuevo: true,
                  ingredientes: {
                    tamano: customPizza.tamano, // ID tamano
                    ingredientes: customPizza.ingredientes // IDs ingredientes
                  }
              }
          ];
          
          nuevaOrden[existingGroupIndex] = {
              ...group,
              cantidad: group.cantidad + 1,
              status: 1, // Reactivar grupo si estaba inactivo
              productos: nuevosProductos,
              esModificado: true
          };
      } else {
          // Crear nuevo grupo
          nuevaOrden.push({
              id: `pizza_group_${tamano}_${Date.now()}`,
              tipoId: 'pizza_group',
              nombre: `Pizzas ${tamano}`,
              tamano: tamano,
              esPaquete: false,
              cantidad: 1,
              precioUnitario: 0, 
              subtotal: 0,
              status: 1,
              esNuevo: true, 
              productos: [{
                  id: idProducto,
                  nombre: nombreProducto,
                  precio: precio,
                  cantidad: 1,
                  status: 1,
                  tipoId: 'custom_pizza',
                  esCustom: true,
                  esNuevo: true,
                  ingredientes: {
                    tamano: customPizza.tamano,
                    ingredientes: customPizza.ingredientes
                  }
              }]
          });
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Agregar paquete
  const agregarPaquete = (paquete) => {
    setOrden((prevOrden) => {
      const nuevoPaquete = {
        id: `paquete_${paquete.numeroPaquete}_${Date.now()}`,
        idProducto: null, // Los paquetes no tienen ID de producto individual
        tipoId: "id_paquete",
        nombre: `Paquete ${paquete.numeroPaquete}`,
        tamano: "N/A",
        precioOriginal: paquete.precio,
        precioUnitario: paquete.precio,
        cantidad: 1,
        subtotal: paquete.precio,
        status: 1,
        esPaquete: true,
        esOriginal: false,
        esNuevo: true,
        productos: null,
        datoPaquete: {
          id_paquete: paquete.numeroPaquete,
          id_refresco: paquete.idRefresco,
          detalle_paquete: paquete.detallePaquete || null,
          id_pizza: paquete.idPizza || null,
          id_hamb: paquete.idHamb || null,
          id_alis: paquete.idAlis || null,
        },
      };

      return recalcularPrecios([...prevOrden, nuevoPaquete]);
    });
  };

  // Actualizar cantidad (PORTADO DE useCart.js + STATUS)
  const actualizarCantidad = (id, tipoId, nuevaCantidad, productoId = null) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId, productoId);
      return;
    }

    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        if (item.id === id && item.tipoId === tipoId) {
          if (productoId && item.productos) {
            // Diferencia en cantidad
            let diff = 0;
            const updatedProducts = item.productos.map(p => {
                if (p.id === productoId) {
                    diff = nuevaCantidad - p.cantidad;
                    return { ...p, cantidad: nuevaCantidad, esModificado: true };
                }
                return p;
            });
            
            const gruposEspeciales = ['id_rec', 'id_barr', 'id_magno'];
            let nuevaCantidadPadre = item.cantidad + diff;
            
            if (gruposEspeciales.includes(item.tipoId)) {
                nuevaCantidadPadre = item.cantidad; // No cambia cantidad grupos
            }

            return {
              ...item,
              cantidad: nuevaCantidadPadre,
              esModificado: true,
              productos: updatedProducts
            };
          } else {
            return { ...item, cantidad: nuevaCantidad, esModificado: true };
          }
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  


  // Eliminar del carrito (PORTADO + STATUS)
  const eliminarDelCarrito = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      let nuevaOrden;

      if (productoId) {
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId && item.productos) {
             const productoTarget = item.productos.find(p => p.id === productoId);
             if (!productoTarget) return item;

             // Marcar como cancelado (status 0) si es original, o borrar si es nuevo
             let nuevosProductos;
             if (productoTarget.esNuevo) {
                 nuevosProductos = item.productos.filter(p => p.id !== productoId);
             } else {
                 nuevosProductos = item.productos.map(p => p.id === productoId ? { ...p, status: 0, cantidad: 0 } : p);
             }

             // Si el grupo queda vacío de items activos, verificar si se borra completo
             const activos = nuevosProductos.filter(p => p.status !== 0);
             if (activos.length === 0) {
                 if (item.esNuevo) return null; // Borrar grupo nuevo vacío
                 // Para originales, marcar grupo como status 0 pero mantener productos 0 para historial
                 return { ...item, status: 0, productos: nuevosProductos, cantidad: 0 }; 
             }

             // Recalcular cantidad padre
             const cantidadRestada = productoTarget.cantidad;
             const gruposEspeciales = ['id_rec', 'id_barr', 'id_magno'];
             let nuevaCantidadPadre = item.cantidad - cantidadRestada;
             
             if (gruposEspeciales.includes(item.tipoId)) {
                nuevaCantidadPadre = item.cantidad; // No reducimos cantidad de grupos
             }

             return {
               ...item,
               cantidad: nuevaCantidadPadre,
               esModificado: true,
               productos: nuevosProductos
             };
          }
          return item;
        }).filter(item => item !== null);
      } else {
        // Eliminar item padre
        nuevaOrden = prevOrden.reduce((acc, item) => {
            if (item.id === id && item.tipoId === tipoId) {
                if (item.esNuevo) return acc; // No agregar (eliminar físico)
                
                // Original: Marcar status 0
                const productosCancelados = item.productos ? item.productos.map(p => ({...p, status: 0, cantidad: 0})) : null;
                return [...acc, { ...item, status: 0, cantidad: 0, productos: productosCancelados, esModificado: true }];
            }
            return [...acc, item];
        }, []);
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Toggle Queso (PORTADO + STATUS)
  const toggleQueso = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        // Caso específico para pizza_group
        if (item.id === id && item.tipoId === 'pizza_group' && item.productos) {
           const sizeName = item.tamano; 
           const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
             key => key.toLowerCase() === sizeName.toLowerCase()
           ) || sizeName;
           const extraPrecio = PRECIOS_ORILLA_QUESO[tamanoKey] || 0;

           if (extraPrecio === 0) return item; 

           const nuevosProductos = [];
           
           item.productos.forEach(prod => {
             if (prod.id === productoId) {
                const conQuesoNuevo = !prod.conQueso;
                
                if (conQuesoNuevo && prod.cantidad > 1) {
                  // Separar
                  nuevosProductos.push({
                    ...prod,
                    cantidad: prod.cantidad - 1,
                    // Mantener status original
                  });
                  
                  nuevosProductos.push({
                    ...prod,
                    id: `${prod.id}_queso_${Date.now()}`,
                    cantidad: 1,
                    conQueso: true,
                    status: 1, esNuevo: true, // Nuevo item separado es NUEVO
                    precio: parseFloat(prod.precio) + extraPrecio
                  });
                  
                } else {
                  let nuevoPrecio = parseFloat(prod.precio);
                  if (conQuesoNuevo) {
                      nuevoPrecio += extraPrecio;
                  } else {
                      nuevoPrecio -= extraPrecio;
                  }

                  nuevosProductos.push({
                      ...prod,
                      conQueso: conQuesoNuevo,
                      precio: nuevoPrecio,
                      esModificado: true
                  });
                }
             } else {
               nuevosProductos.push(prod);
             }
           });

           return {
               ...item,
               esModificado: true,
               productos: nuevosProductos
           };
        }
        
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Generar payload para actualizar el pedido
  const getPayloadActualizacion = () => {
    const items = [];

    // Procesar productos actuales del carrito
    orden.forEach((item) => {
      // 1. Manejo de Paquetes
      if (item.esPaquete) {
        const paqueteData = {
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          id_paquete: item.datoPaquete.id_paquete,
          status: item.status ?? 1,
        };

        if (!item.esOriginal) {
           if (item.datoPaquete.detalle_paquete) {
             paqueteData.detalle_paquete = item.datoPaquete.detalle_paquete;
           }
           if (item.datoPaquete.id_pizza) {
             paqueteData.id_pizza = item.datoPaquete.id_pizza;
           }
           if (item.datoPaquete.id_hamb) {
             paqueteData.id_hamb = item.datoPaquete.id_hamb;
           }
           if (item.datoPaquete.id_alis) {
             paqueteData.id_alis = item.datoPaquete.id_alis;
           }
           if (item.datoPaquete.id_refresco) {
             paqueteData.id_refresco = item.datoPaquete.id_refresco;
           }
        }
        items.push(paqueteData);
        return;
      }

      // 2. Manejo de Grupos Especiales (Rectangular, Barra, Magno)
      // Estos se deben enviar como UN solo item con array de IDs
      if (['id_rec', 'id_barr', 'id_magno'].includes(item.tipoId) && item.productos && item.productos.length > 0) {
          
          // Extraer IDs de los subproductos activos
          const ids = item.productos
              .filter(p => p.status !== 0) // Solo activos
              .map(p => p.idProducto);

          if (ids.length > 0) {
             const itemData = {
                 cantidad: item.cantidad, // Cantidad de GRUPOS (generalmente 1)
                 precio_unitario: item.precioUnitario, // Precio del grupo completo
                 [item.tipoId]: ids, // Array de IDs: id_rec: [1, 2, 3, 4]
                 status: item.status ?? 1
             };
             items.push(itemData);
          } else if (item.esOriginal) {
             // Si era original y se vació, enviar cancelación si es necesario, 
             // pero generalmente id_rec se maneja por reemplazo o status 0 del grupo.
             // Si el grupo tiene status 0, se maneja abajo o aquí mismo.
             if (item.status === 0) {
                 items.push({
                     cantidad: 0,
                     precio_unitario: item.precioOriginal || 0,
                     [item.tipoId]: [], // Array vacío o null?
                     status: 0
                 });
             }
          }
          return;
      }

      // 3. Manejo de Grupos de Pizzas (Normal, Mariscos, Custom) que se envían individuales
      if (item.productos && item.productos.length > 0) {
        
        item.productos.forEach((prod) => {
          // Ignorar productos con status 0 que no son originales (los nuevos borrados no se envían)
          if (prod.status === 0 && !prod.esOriginal && !item.esOriginal) return;

          // Si es un grupo de pizzas (puede tener mezclados custom, id_pizza, id_maris)
          if (item.tipoId === 'pizza_group') {
              
              if (prod.tipoId === 'custom_pizza' || prod.esCustom) {
                  // Custom Pizza
                  items.push({
                      cantidad: prod.cantidad,
                      precio_unitario: parseFloat(prod.precio),
                      ingredientes: {
                          tamano: prod.ingredientes.tamano,
                          ingredientes: Array.isArray(prod.ingredientes.ingredientes) ? prod.ingredientes.ingredientes : []
                      },
                      tipo: 'custom_pizza', // Backend puede requerir esto o deducirlo de 'ingredientes'
                      status: prod.status !== undefined ? prod.status : (item.status ?? 1),
                      queso: prod.conQueso ? 1 : 0, // Enviar como flag 1/0 o boolean según backend. User payload example shows 'queso: 0' top level.
                      // Algunos backends usan 'conQueso', otros 'queso'. En creation payload user puso 'queso: 0'.
                  });
              } else {
                  // Pizza Normal o Mariscos
                  items.push({
                    cantidad: prod.cantidad,
                    precio_unitario: parseFloat(prod.precio),
                    [prod.tipoId || 'id_pizza']: prod.idProducto || prod.id,
                    status: prod.status !== undefined ? prod.status : (item.status ?? 1),
                    queso: prod.conQueso ? 1 : 0
                  });
              }

          } else {
              // Fallback para otros grupos (legacy)
              items.push({
                cantidad: prod.cantidad,
                precio_unitario: item.precioUnitario || 0,
                [item.tipoId]: prod.idProducto || prod.id,
                status: prod.status !== undefined ? prod.status : (item.status ?? 1),
              });
          }
        });
        return;
      } 
      
      // 4. Items Individuales sin productos (Refrescos, etc.)
      items.push({
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || 0,
          [item.tipoId]: item.idProducto,
          status: item.status ?? 1,
      });

    });

    // Marcar productos originales eliminados completamente que no estén en la nueva lista
    productosOriginales.forEach((prodOrig) => {
      // Verificar si ya fue procesado en los items activos o cancelados arriba
      // (Esta lógica es compleja si IDs cambian, pero intentamos matchear)
      
      // Si es un grupo especial, ya se manejó arriba por el ID del item padre o reconstrucción.
      // Pero si el usuario borró todo el grupo Rectangular, 'orden' no lo tendrá.
      // Necesitamos detectar si falta un grupo original completo.
      
      // ... Simplificación: El backend suele manejar actualizaciones por "Diferencia" o "Reemplazo completo".
      // Si el backend reemplaza los items de la venta con los enviados, no necesitamos enviar explícitamente los borrados (salvo status 0).
      // Si el backend actualiza status, sí necesitamos enviar status 0.
      
      // Asumiremos que enviar status 0 es lo correcto para lo eliminado.
      
      const enNuevaOrden = orden.some(item => {
          // Checar items simples
          if (item.idProducto === prodOrig.idProducto && item.tipoId === prodOrig.tipoId) return true;
          // Checar dentro de productos
          if (item.productos) {
              return item.productos.some(p => p.idProducto === prodOrig.idProducto);
          }
          // Checar grupos especiales (si el grupo existe, el producto está "cubierto" aunque sea en otro formato?)
          // Si es rectangular, prodOrig.idProducto era un array? No, prodOrig venía desglosado si era item simple
          // O si venía como grupo...
          
          if (['id_rec', 'id_barr', 'id_magno'].includes(prodOrig.tipoId)) {
             // Si hay algún item de este tipo en la orden, asumimos que se está actualizando ese set.
             // (Esto puede ser arriesgado si había 2 rectangulares y borra 1)
             // Pero por ID compuesto no podemos traquear fácil.
             // Revisar si prodOrig venía de un composite...
             if (item.tipoId === prodOrig.tipoId) return true; // Asumimos continuidad por tipo
          }
          return false;
      });

      if (!enNuevaOrden) {
          // Está borrado
          // Si era parte de un grupo especial, quizás no deberíamos enviar status 0 individual si el backend espera array?
          // Si era custom pizza...
          
          if (!['id_rec', 'id_barr', 'id_magno'].includes(prodOrig.tipoId)) {
             items.push({
               cantidad: 0,
               precio_unitario: prodOrig.precioOriginal || 0,
               [prodOrig.tipoId || 'id_pizza']: prodOrig.idProducto, // Fallback
               status: 0,
             });
          }
      }
    });

    return items;
  };

  const total = orden.reduce((acc, item) => acc + item.subtotal, 0);

  return {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    actualizarCantidad,
    eliminarDelCarrito,
    cargarProductosOriginales,
    getPayloadActualizacion,
    agregarPizzaCustom,
    toggleQueso,
    statusPrincipal,
    setStatusPrincipal,
  };
};
