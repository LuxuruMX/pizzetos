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
    return nuevaOrden.map((item) => {
      // Si el item está cancelado (status 0) y no es un grupo, su subtotal es 0
      if (item.status === 0 && !item.productos) {
        return {
          ...item,
          subtotal: 0,
        };
      }

      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad,
        };
      }
      
      // Nueva lógica grupo pizza unificado
      if (item.tipoId === 'pizza_group') {
        const unidades = [];
        let costoTotalQueso = 0;
        
        if (item.productos) {
            item.productos.forEach(prod => {
                // Ignorar cancelados para el cálculo 2x1, PERO...
                // Si el item está cancelado, no suma a la cuenta.
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

      // Categorías con descuento 2x1 (Legacy fallback)
      const categoriasConDescuento = ["id_pizza", "id_maris"];

      if (!categoriasConDescuento.includes(item.tipoId)) {
        return {
          ...item,
          precioUnitario: item.precioOriginal,
          subtotal: item.precioOriginal * item.cantidad,
        };
      }

      // Para items agrupados, filtrar los que tienen status 0 antes de calcular pares
      let cantidadParaCalculo = item.cantidad;
      if (item.productos) {
        cantidadParaCalculo = item.productos.reduce((acc, p) => {
          return p.status === 0 ? acc : acc + p.cantidad;
        }, 0);
      }

      // Aplicar descuento para pizzas/mariscos
      const { precioUnitario, subtotal } = calcularPrecioYSubtotal(
        item.precioOriginal,
        cantidadParaCalculo
      );

      return {
        ...item,
        precioUnitario,
        subtotal,
      };
    });
  };

  // Cargar productos desde el backend y completar con datos de la caché
  const cargarProductosOriginales = (productosBackend, productosCache, ingredientesCacheData = []) => {
    // Definir tipoMap al inicio
    const tipoMap = {
      'id_pizza': 'pizzas',
      'id_hamb': 'hamburguesas',
      'id_alis': 'alitas',
      'id_cos': 'costillas',
      'id_spag': 'spaguetty',
      'id_papa': 'papas',
      'id_rect': 'rectangular',
      'id_barr': 'barra',
      'id_maris': 'mariscos',
      'id_refresco': 'refrescos',
      'id_paquete': 'paquetes'
      // custom_pizza no está en caché de productos normal
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
          productos: null, // Custom pizzas no se agrupan en lógica legacy, pero sí en pizza_group
          // Guardar detalle de ingredientes
          ingredientes: {
             tamano: tamanoId || 0,
             ingredientes: idsOnly
          },
          ingredientesNombres: nombresIng
        };
      }

      // --- LOGICA PRODUCTO NORMAL ---
      // Buscar en la caché de productos
      const categoria = tipoMap[prod.tipo];
      if (categoria && productosCache[categoria]) {
        const categoriaProductos = productosCache[categoria];
        const tipoIdCampo = prod.tipo; 

        // Para pizzas, mariscos y refrescos que tienen tamaño/subcategoría
        if (['id_pizza', 'id_maris', 'id_refresco'].includes(prod.tipo) && (prod.tamaño || prod.tamano)) {
          const sizeBuscar = prod.tamaño || prod.tamano;
          // Buscar por ID del producto y tamaño específico
          const variante = categoriaProductos.find(p => 
            p[tipoIdCampo] === prod.id && 
            (p.subcategoria === sizeBuscar || p.tamaño === sizeBuscar || p.tamano === sizeBuscar)
          );
          
          if (variante) {
            nombre = variante.nombre;
            precio = parseFloat(variante.precio);
          } else {
            // Fallback: buscar solo por ID
            const productoBase = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
            if (productoBase) {
              nombre = `${productoBase.nombre} ${sizeBuscar}`;
              precio = parseFloat(productoBase.precio);
            }
          }
        } else {
          // Para productos sin variantes de tamaño
          const producto = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
          
          if (producto) {
            nombre = producto.nombre;
            precio = parseFloat(producto.precio);
          }
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
          } else {
             // Es Paquete con objeto de detalles
             detallePaqueteObj = prod.id;
             realId = detallePaqueteObj.id_paquete || index;
          }
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
      const idCarrito = `original_${prod.tipo}_${realId}_${index}_${prod.tamaño || 'std'}`;

      const itemBase = {
        id: idCarrito,
        idProducto: realId,
        tipoId: prod.tipo,
        nombre: nombre,
        tamano: prod.tamaño || prod.tamano || 'N/A',
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
                  let nombreSub = 'Ingrediente';
                  
                  // Buscar nombre en caché (pizzas)
                  if (productosCache && productosCache.pizzas) {
                      const p = productosCache.pizzas.find(x => x.id === idProd);
                      if (p) nombreSub = p.nombre;
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
        // Buscar todos los productos del mismo tipo y tamaño (incluyendo custom)
        // Nota: para custom_pizza, prod.tipoId es 'custom_pizza', pero queremos agruparlas con 'id_pizza' (o en un grupo 'pizza_group' genérico)
        // Vamos a normalizar el tipo de grupo.
        
        let targetGroupType = prod.tipoId;
        if (prod.tipoId === 'id_pizza' || prod.tipoId === 'custom_pizza') {
            targetGroupType = 'pizza_group';
        }

        // Buscar items compatibles para este grupo
        const grupo = productos.filter(
          (p, i) =>
            !yaAgrupados.has(i) &&
            ((p.tipoId === 'id_pizza' || p.tipoId === 'custom_pizza') ? targetGroupType === 'pizza_group' : p.tipoId === prod.tipoId) &&
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
        
        // Si es mariscos, el grupo es normal
        if (prod.tipoId === 'id_maris') {
             const cantidadTotal = grupo.reduce((sum, p) => sum + p.cantidad, 0);
             const productosDetalle = grupo.map((p) => ({
                id: p.id,
                idProducto: p.idProducto,
                nombre: p.nombre,
                cantidad: p.cantidad,
                status: p.status,
                esOriginal: p.esOriginal,
                precio: p.precioOriginal,
                conQueso: p.conQueso || false
            }));

            const statusGrupo = grupo.some(p => p.status !== 0) ? 1 : 0;

            agrupados.push({
                id: `${prod.tipoId}_${prod.tamano}_${Date.now()}_${Math.random()}`,
                tipoId: prod.tipoId, // id_maris
                nombre: `Mariscos ${prod.tamano}`,
                tamano: prod.tamano,
                precioOriginal: prod.precioOriginal,
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
             // Es PIZZA GROUP (id_pizza o custom_pizza)
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
                tipoId: p.tipoId // guardar tipo original (id_pizza o custom_pizza)
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
        }

      } else {
        agrupados.push(prod);
      }
    });

    return agrupados;
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamano =
      producto.subcategoria || producto.tamano || producto.tamaño || "N/A";
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      const categoriasConDescuento = ["id_pizza", "id_maris"];

      if (categoriasConDescuento.includes(tipoId)) {
        // Buscar grupo del mismo tamaño
        const itemMismoTamano = prevOrden.find(
          (item) =>
            item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete
        );

        let nuevaOrden;

        if (itemMismoTamano) {
          // Agregar al grupo existente
          nuevaOrden = prevOrden.map((item) => {
            if (
              item.tipoId === tipoId &&
              item.tamano === tamano &&
              !item.esPaquete
            ) {
              const productoExistente = item.productos?.find(
                (p) => p.idProducto === id && (p.status === 1 || p.esNuevo)
              );

              if (productoExistente) {
                // Incrementar cantidad del producto existente (solo si es editable)
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar grupo si estaba cancelado
                  productos: item.productos.map((p) =>
                    p.id === productoExistente.id ? { ...p, cantidad: p.cantidad + 1, status: 1 } : p
                  ),
                  esModificado: item.esOriginal,
                };
              } else {
                // Agregar nuevo producto al grupo (nueva línea)
                const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar grupo
                  productos: [
                    ...(item.productos || []),
                    { 
                      id: nuevoIdSubItem, 
                      idProducto: id, 
                      nombre, 
                      cantidad: 1, 
                      status: 1, 
                      esOriginal: false,
                      esNuevo: true 
                    },
                  ],
                  esModificado: item.esOriginal,
                };
              }
            }
            return item;
          });
        } else {
          // Crear nuevo grupo
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${tamano}_${Date.now()}`,
              idProducto: id,
              tipoId: tipoId,
              nombre: `${
                tipoId === "id_pizza" ? "Pizza" : "Marisco"
              } ${tamano}`,
              tamano,
              precioOriginal,
              precioUnitario: precioOriginal * 0.6,
              cantidad: 1,
              subtotal: precioOriginal * 0.6,
              status: 1,
              esPaquete: false,
              esOriginal: false,
              esNuevo: true,
              esOriginal: false,
              esNuevo: true,
              productos: [{ 
                id: `${tipoId}_${id}_${Date.now()}_sub`, 
                idProducto: id, 
                nombre, 
                cantidad: 1, 
                status: 1, 
                esOriginal: false,
                esNuevo: true 
              }],
            },
          ];
        }

        return recalcularPrecios(nuevaOrden);
      } else {
        const itemExistente = prevOrden.find(
          (item) =>
            item.idProducto === id && item.tipoId === tipoId && !item.esPaquete
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            item.idProducto === id && item.tipoId === tipoId && !item.esPaquete
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar si estaba cancelado
                  esModificado: item.esOriginal,
                }
              : item
          );
        } else {
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${id}_${Date.now()}`,
              idProducto: id,
              tipoId: tipoId,
              nombre,
              tamano: "N/A",
              precioOriginal,
              precioUnitario: precioOriginal,
              cantidad: 1,
              subtotal: precioOriginal,
              status: 1,
              esPaquete: false,
              esOriginal: false,
              esNuevo: true,
              productos: null,
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

  // Actualizar cantidad
  const actualizarCantidad = (id, tipoId, nuevaCantidad, productoId = null) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId, productoId);
      return;
    }

    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        if (item.id === id && item.tipoId === tipoId) {
          if (productoId && item.productos) {
            // Actualizar cantidad de un producto específico en un grupo
            const productoActual = item.productos.find(
              (p) => p.id === productoId
            );

            // Si el producto tiene status 2, no permitir cambios
            if (productoActual.status === 2) return item;

            const diferencia = nuevaCantidad - productoActual.cantidad;

            // Para grupos especiales, mantener la lógica correcta
            const gruposEspeciales = ['id_rec', 'id_barr', 'id_magno'];
            let nuevaCantidadPadre = item.cantidad + diferencia;
            
            if (gruposEspeciales.includes(item.tipoId)) {
                nuevaCantidadPadre = item.cantidad; // No cambia al mover subproductos
            }

            return {
              ...item,
              cantidad: nuevaCantidadPadre,
              productos: item.productos.map((p) =>
                p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
              ),
              esModificado: item.esOriginal, // Marcar como modificado aunque sea original
            };
          } else {
            // Actualizar cantidad del item completo
            return {
              ...item,
              cantidad: nuevaCantidad,
              esModificado: item.esOriginal,
              status: item.status === 2 ? 2 : 1 // Mantener status 2 si ya lo tiene
            };
          }
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  
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
           let cantidadAjustada = item.cantidad;

           item.productos.forEach(prod => {
             if (prod.id === productoId) {
                // Verificar si se puede editar (status != 2)
                if (prod.status === 2) {
                    nuevosProductos.push(prod);
                    return;
                }

                const conQuesoNuevo = !prod.conQueso;
                
                // Opción 1: Si es producto unico (cantidad 1), togglear
                if (prod.cantidad === 1) {
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
                } else {
                     // Opción 2: Si hay multiples, separar
                     nuevosProductos.push({
                        ...prod,
                        cantidad: prod.cantidad - 1,
                     });
                     
                     // Crear nuevo
                     let precioUnitario = parseFloat(prod.precio);
                     // Ajustar baseprice: el precio de prod ya incluye o no queso actual
                     // Si prod.conQueso es false, precio es base.
                     // Si prod.conQueso es true, precio es base + extra.
                     
                     // Queremos el nuevo item con conQuesoNuevo.
                     // Si ahora es conQueso, base + extra.
                     // Si ahora sin queso, base.
                     
                     let precioBase = prod.conQueso ? (precioUnitario - extraPrecio) : precioUnitario;
                     let nuevoPrecioFinal = conQuesoNuevo ? (precioBase + extraPrecio) : precioBase;

                     nuevosProductos.push({
                        ...prod,
                        id: `${prod.id}_queso_${Date.now()}`,
                        cantidad: 1,
                        conQueso: conQuesoNuevo,
                        precio: nuevoPrecioFinal,
                        esModificado: true,
                        esNuevo: true
                     });
                }
             } else {
               nuevosProductos.push(prod);
             }
           });

           return {
               ...item,
               cantidad: cantidadAjustada, // No cambia total items
               productos: nuevosProductos,
               esModificado: true
           };
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Eliminar del carrito (o cambiar status a 0 si es original)
  const eliminarDelCarrito = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      let nuevaOrden;

      if (productoId) {
        // Eliminar/Cancelar producto específico de un grupo
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId && item.productos) {
            const productoAEliminar = item.productos.find(
              (p) => p.id === productoId
            );

            // Si el producto tiene status 2, no permitir eliminar
            if (productoAEliminar.status === 2) return item;

            // Verificar si es un producto original usando la propiedad del objeto
            const esOriginal = productoAEliminar.esOriginal;

            if (esOriginal) {
              // Toggle status: si es 0 pasa a 1, si es otro pasa a 0
              const nuevoStatus = productoAEliminar.status === 0 ? 1 : 0;
              
              const nuevosProductos = item.productos.map((p) =>
                p.id === productoId ? { ...p, status: nuevoStatus } : p
              );

              // Actualizar status del grupo: si todos están en 0, grupo en 0. Si hay alguno activo (no 0), grupo en 1.
              const algunActivo = nuevosProductos.some(p => p.status !== 0);

              return {
                ...item,
                status: algunActivo ? 1 : 0,
                productos: nuevosProductos,
                esModificado: true,
              };
            } else {
              // Si no es original, eliminarlo físicamente
              const nuevosProductos = item.productos.filter(
                (p) => p.id !== productoId
              );

              if (nuevosProductos.length === 0) {
                return null; // Eliminar el item completo si no quedan productos
              }

              return {
                ...item,
                cantidad: item.cantidad - productoAEliminar.cantidad,
                productos: nuevosProductos,
                esModificado: item.esOriginal,
              };
            }
          }
          return item;
        }).filter(Boolean); // Filtrar nulos
      } else {
        // Eliminar/Cancelar item completo
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId) {
            // Si el item tiene status 2, no permitir eliminar
            if (item.status === 2) return item;

            if (item.esOriginal) {
              // Toggle status
              const nuevoStatus = item.status === 0 ? 1 : 0;
              
              // Si es un grupo, propagar el status a todos los hijos
              let productosActualizados = item.productos;
              if (item.productos) {
                productosActualizados = item.productos.map(p => ({
                  ...p,
                  status: nuevoStatus
                }));
              }

              return {
                ...item,
                status: nuevoStatus,
                productos: productosActualizados,
                esModificado: true
              };
            } else {
              // Marcar para eliminar
              return null;
            }
          }
          return item;
        }).filter(Boolean);
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Generar payload para actualizar el pedido
  const getPayloadActualizacion = () => {
    const items = [];

    // Procesar productos actuales del carrito
    orden.forEach((item) => {
      if (item.esPaquete) {
        // Paquetes
        const paqueteData = {
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          id_paquete: item.datoPaquete.id_paquete,
          status: item.status ?? 1,
        };

        // Si es nuevo, incluir detalles de composición
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

      } else if (item.productos && item.productos.length > 0) {
        // Items agrupados (pizzas/mariscos del mismo tamaño)
        item.productos.forEach((prod) => {
          
          if (item.tipoId === 'pizza_group') {
              // Manejo nuevo pizza_group
              if (prod.tipoId === 'custom_pizza' || prod.esCustom) {
                  items.push({
                      cantidad: prod.cantidad,
                      precio_unitario: parseFloat(prod.precio),
                      ingredientes: {
                          tamano: prod.ingredientes.tamano,
                          ingredientes: prod.ingredientes.ingredientes
                      },
                      tipo: 'custom_pizza',
                      status: prod.status !== undefined ? prod.status : (item.status ?? 1),
                      conQueso: prod.conQueso
                  });
              } else {
                  // Pizza normal o marisco dentro de grupo
                  items.push({
                    cantidad: prod.cantidad,
                    precio_unitario: parseFloat(prod.precio),
                    [prod.tipoId || 'id_pizza']: prod.idProducto || prod.id,
                    status: prod.status !== undefined ? prod.status : (item.status ?? 1),
                    conQueso: prod.conQueso
                  });
              }
          } else {
              // Legacy
              items.push({
                cantidad: prod.cantidad,
                precio_unitario: item.precioUnitario || 0,
                [item.tipoId]: prod.idProducto || prod.id, // Usar idProducto si existe, sino id
                status: prod.status !== undefined ? prod.status : (item.status ?? 1),
              });
          }
        });
      } else {
        // Items individuales
        items.push({
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || 0,
          [item.tipoId]: item.idProducto,
          status: item.status ?? 1,
        });
      }
    });

    // Marcar productos eliminados con status 0
    productosOriginales.forEach((prodOrig) => {
      const existeEnOrden = orden.some((item) => {
        if (item.productos) {
          // Verificar si el producto original existe en algún sub-item
          // Nota: prodOrig.idProducto es el ID del catálogo
          return item.productos.some((p) => p.idProducto === prodOrig.idProducto);
        }
        return item.idProducto === prodOrig.idProducto;
      });

      // Si no existe en la orden actual, agregarlo como cancelado
      // PERO cuidado: si se separó en múltiples líneas (una status 2, una status 1), 
      // la lógica de "existeEnOrden" podría ser engañosa si no cuidamos los IDs únicos.
      // Sin embargo, aquí estamos verificando si el PRODUCTO (catálogo) sigue presente.
      // Si el usuario eliminó TODAS las instancias de ese producto, entonces sí se manda status 0.
      // Si queda al menos una instancia (ej: la status 2), entonces no se manda este bloque de eliminación global.
      // La eliminación individual (bajar cantidad o quitar un sub-item) ya se maneja en el loop de `orden` 
      // si es que mantenemos los items con status 0 en `orden`.
      // REVISIÓN: `eliminarDelCarrito` mantiene los items originales con status 0 en `orden`.
      // Por lo tanto, `productosOriginales` solo es necesario si por alguna razón se eliminó físicamente del array `orden`.
      // En la lógica actual, los items originales NO se eliminan de `orden`, solo cambian de status.
      // Los items NUEVOS sí se eliminan físicamente.
      // Así que este bloque de `productosOriginales` es redundante si garantizamos que los originales nunca salen de `orden`.
      // Pero por seguridad, lo dejaremos, asegurando que use el formato correcto.

      if (!existeEnOrden) {
        items.push({
          cantidad: 0,
          precio_unitario: prodOrig.precioOriginal || 0,
          [prodOrig.tipoId]: prodOrig.idProducto,
          status: 0, // Cancelado
        });
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
