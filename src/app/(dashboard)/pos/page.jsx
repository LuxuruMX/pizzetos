'use client';

// components/POS.jsx (o .tsx)
import { useState, useEffect } from 'react';
import api from '@/services/api';

const POS = () => {
  // Estado para almacenar los productos de cada categoría
  const [productos, setProductos] = useState({
    hamburguesas: [],
    alitas: [],
    costillas: [],
  });

  // Estado para la categoría activa actualmente
  const [categoriaActiva, setCategoriaActiva] = useState('hamburguesas');

  // Estado para la orden actual
  const [orden, setOrden] = useState([]);
  const [total, setTotal] = useState(0);

  // Cargar productos al montar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const resHamb = await api.get('/prices/hamburguesas');
        const resAlis = await api.get('/prices/alitas');
        const resCos = await api.get('/prices/costillas');

        setProductos({
          hamburguesas: resHamb.data,
          alitas: resAlis.data,
          costillas: resCos.data,
        });
      } catch (error) {
        console.error('Error al cargar productos:', error);
        // Manejar el error (mostrar mensaje, etc.)
      }
    };

    fetchProductos();
  }, []);

  // Función para agregar un producto al carrito
  const agregarAlCarrito = (producto, tipoId) => { // tipoId: 'id_hamb', 'id_alis', 'id_cos'
    const idProducto = producto[tipoId];
    const precioNumerico = parseFloat(producto.precio);

    setOrden(prevOrden => {
      const itemExistenteIndex = prevOrden.findIndex(item => item.id === idProducto && item.tipoId === tipoId);

      let nuevaOrden;
      if (itemExistenteIndex > -1) {
        // Si ya existe, actualiza la cantidad
        nuevaOrden = [...prevOrden];
        nuevaOrden[itemExistenteIndex] = {
          ...nuevaOrden[itemExistenteIndex],
          cantidad: nuevaOrden[itemExistenteIndex].cantidad + 1,
          subtotal: (nuevaOrden[itemExistenteIndex].cantidad + 1) * nuevaOrden[itemExistenteIndex].precioUnitario
        };
      } else {
        // Si no existe, agrégalo como nuevo ítem
        nuevaOrden = [
          ...prevOrden,
          {
            id: idProducto,
            nombre: producto.nombre,
            precioUnitario: precioNumerico,
            cantidad: 1,
            subtotal: precioNumerico,
            tipoId: tipoId // Almacenamos el tipo de ID para usarlo al construir el JSON
          }
        ];
      }
      return nuevaOrden;
    });
  };

  // Función para actualizar la cantidad de un ítem en el carrito
  const actualizarCantidad = (id, tipoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId);
      return;
    }

    setOrden(prevOrden => {
      return prevOrden.map(item => {
        if (item.id === id && item.tipoId === tipoId) {
          const nuevoSubtotal = nuevaCantidad * item.precioUnitario;
          return { ...item, cantidad: nuevaCantidad, subtotal: nuevoSubtotal };
        }
        return item;
      });
    });
  };

  // Función para eliminar un ítem del carrito
  const eliminarDelCarrito = (id, tipoId) => {
    setOrden(prevOrden => prevOrden.filter(item => !(item.id === id && item.tipoId === tipoId)));
  };

  // Recalcular total cuando cambia la orden
  useEffect(() => {
    const nuevoTotal = orden.reduce((acc, item) => acc + item.subtotal, 0);
    setTotal(nuevoTotal);
  }, [orden]);

  // Función para enviar la orden al backend
  const enviarOrden = async () => {
    if (orden.length === 0) {
      alert('La orden está vacía.');
      return;
    }

    // Asumiendo que tienes valores fijos o seleccionados para id_suc e id_cliente
    const id_suc = 1; // Reemplaza con el valor real
    const id_cliente = 1; // Reemplaza con el valor real

    // Transformar el estado de la orden al formato del backend
    const itemsParaBackend = [];
    const groupedItems = {};

    orden.forEach(item => {
        if (!groupedItems[item.tipoId]) {
            groupedItems[item.tipoId] = { [item.tipoId]: item.id, cantidad: 0 };
        }
        groupedItems[item.tipoId].cantidad += item.cantidad;
    });

    Object.values(groupedItems).forEach(itemGroup => {
        itemsParaBackend.push(itemGroup);
    });


    const ordenParaEnviar = {
      id_suc,
      id_cliente,
      items: itemsParaBackend
    };

    console.log('Enviando orden:', ordenParaEnviar); // Para debugging

    try {
      // Enviar al backend usando la instancia `api` (baseURL configurado en src/services/api.js)
      const response = await api.post('/pos/', ordenParaEnviar);
      console.log('Orden enviada exitosamente:', response.data);
      // Opcional: Limpiar la orden después de enviar
      setOrden([]);
      alert('Orden enviada correctamente.');
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert('Hubo un error al enviar la orden.');
    }
  };

  const productosActuales = productos[categoriaActiva] || [];

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">Punto de Venta</h1>

      {/* Selector de Categorías */}
      <div className="flex justify-center space-x-4 mb-6">
        {Object.keys(productos).map(categoria => (
          <button
            key={categoria}
            onClick={() => setCategoriaActiva(categoria)}
            className={`px-4 py-2 rounded-lg ${
              categoriaActiva === categoria
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {categoria.charAt(0).toUpperCase() + categoria.slice(1)} {/* Capitalizar primera letra */}
          </button>
        ))}
      </div>

      {/* Lista de Productos de la Categoría Activa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {productosActuales.map(producto => {
          const tipoId = Object.keys(producto).find(key => key.startsWith('id_'));
          return (
            <div key={producto[tipoId]} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
              <h3 className="font-semibold text-lg">{producto.nombre}</h3>
              <p className="text-gray-600">Precio: ${parseFloat(producto.precio).toFixed(2)}</p> {/* Formatear precio */}
              <button
                onClick={() => agregarAlCarrito(producto, tipoId)}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded self-start"
              >
                Agregar
              </button>
            </div>
          );
        })}
      </div>

      {/* Carrito de Compras */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Carrito</h2>
        {orden.length === 0 ? (
          <p className="text-gray-500">El carrito está vacío.</p>
        ) : (
          <div>
            <ul className="mb-4">
              {orden.map((item, index) => (
                <li key={`${item.tipoId}-${item.id}`} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-medium">{item.nombre}</span> x <span>{item.cantidad}</span>
                    <br />
                    <span className="text-sm text-gray-600">Subtotal: ${item.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => actualizarCantidad(item.id, item.tipoId, item.cantidad - 1)}
                      className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item.id, item.tipoId, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border rounded"
                    />
                    <button
                      onClick={() => actualizarCantidad(item.id, item.tipoId, item.cantidad + 1)}
                      className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 flex items-center justify-center rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => eliminarDelCarrito(item.id, item.tipoId)}
                      className="ml-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="text-right">
              <strong>Total: ${total.toFixed(2)}</strong>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={enviarOrden}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
              >
                Enviar Orden
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;