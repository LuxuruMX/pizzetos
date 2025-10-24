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

  return (
    <li className="flex justify-between items-center border-b pb-2">
      <div className="flex-grow">
        <span className="font-medium">{item.nombre}</span> x <span>{item.cantidad}</span>
        <br />
        <span className="text-sm text-gray-600">Subtotal: ${item.subtotal.toFixed(2)}</span>
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
          className="w-12 text-center border rounded"
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