import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const handleDecrement = (productoId = null) => {
    if (productoId && item.productos) {
      const producto = item.productos.find(p => p.id === productoId);
      onUpdateQuantity(item.id, item.tipoId, producto.cantidad - 1, productoId);
    } else {
      onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1);
    }
  };

  const handleIncrement = (productoId = null) => {
    if (productoId && item.productos) {
      const producto = item.productos.find(p => p.id === productoId);
      onUpdateQuantity(item.id, item.tipoId, producto.cantidad + 1, productoId);
    } else {
      onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1);
    }
  };

  const handleQuantityChange = (e, productoId = null) => {
    const value = parseInt(e.target.value) || 1;
    onUpdateQuantity(item.id, item.tipoId, value, productoId);
  };

  // Verificar si tiene descuento (solo cuando hay 2 o más)
  const tieneDescuento = item.cantidad >= 2 && item.precioUnitario < item.precioOriginal;
  const porcentajeDescuento = tieneDescuento 
    ? Math.round(((item.precioOriginal - item.precioUnitario) / item.precioOriginal) * 100)
    : 0;

  // Si es un item agrupado (pizzas o mariscos)
  if (item.productos && item.productos.length > 0) {
    return (
      <li className="border-b pb-3 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-grow text-black">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{item.nombre}</span>
              {tieneDescuento && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold">
                  Oferta 2×1
                </span>
              )}
            </div>
            
            {/* Lista de productos agrupados */}
            <div className="ml-4 space-y-1 mb-2">
              {item.productos.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">• {producto.nombre}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDecrement(producto.id)}
                      className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-gray-600">×{producto.cantidad}</span>
                    <button
                      onClick={() => handleIncrement(producto.id)}
                      className="bg-green-500 hover:bg-green-600 text-white w-5 h-5 flex items-center justify-center rounded text-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemove(item.id, item.tipoId, producto.id)}
                      className="ml-1 text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 mb-1">
              {item.cantidad >= 2 ? (
                <>
                </>
              ) : (
                <>
                  <span className="line-through text-red-500 mr-2">
                    ${item.precioOriginal.toFixed(2)}
                  </span>
                  <span className="text-green-600 font-semibold">
                    ${item.precioUnitario.toFixed(2)} (40% desc.)
                  </span>
                </>
              )}
            </div>
            <span className="text-sm text-gray-600 font-semibold">
              Subtotal: ${item.subtotal.toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={() => onRemove(item.id, item.tipoId)}
            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-sm"
          >
            Eliminar todo
          </button>
        </div>
      </li>
    );
  }

  // Item normal (no agrupado)
  return (
    <li className="flex justify-between items-center border-b pb-2">
      <div className="flex-grow text-black">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.nombre}</span>
          {item.tamano && item.tamano !== 'N/A' && (
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
              {item.tamano}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span>${item.precioUnitario.toFixed(2)}</span>
          <span className="ml-1">x {item.cantidad}</span>
        </div>
        <span className="text-sm text-gray-600">
          Subtotal: <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleDecrement()}
          className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          value={item.cantidad}
          onChange={(e) => handleQuantityChange(e)}
          className="w-12 text-center border rounded text-black border-gray-300"
        />
        <button
          onClick={() => handleIncrement()}
          className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 flex items-center justify-center rounded"
        >
          +
        </button>
        <button
          onClick={() => onRemove(item.id, item.tipoId)}
          className="ml-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-sm"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
};

export default CartItem;