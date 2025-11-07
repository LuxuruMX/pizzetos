import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const handleDecrement = () => {
    onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    onUpdateQuantity(item.id, item.tipoId, value);
  };

  // Verificar si tiene descuento
  const tieneDescuento = item.precioUnitario < item.precioOriginal;
  const porcentajeDescuento = tieneDescuento 
    ? Math.round(((item.precioOriginal - item.precioUnitario) / item.precioOriginal) * 100)
    : 0;

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
          {tieneDescuento && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold">
              -{porcentajeDescuento}%
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {tieneDescuento ? (
            <>
              <span className="line-through text-red-500 mr-2">
                ${item.precioOriginal.toFixed(2)}
              </span>
              <span className="text-green-600 font-semibold">
                ${item.precioUnitario.toFixed(2)}
              </span>
              <span className="ml-1">x {item.cantidad}</span>
            </>
          ) : (
            <>
              <span>${item.precioUnitario.toFixed(2)}</span>
              <span className="ml-1">x {item.cantidad}</span>
            </>
          )}
        </div>
        <span className="text-sm text-gray-600">
          Subtotal: <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDecrement}
          className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          value={item.cantidad}
          onChange={handleQuantityChange}
          className="w-12 text-center border rounded text-black border-gray-300"
        />
        <button
          onClick={handleIncrement}
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