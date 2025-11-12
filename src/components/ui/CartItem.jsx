import { Trash2, Plus, Minus } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  // Si es un paquete, renderizar de manera especial
  if (item.esPaquete) {
    return (
      <li className="flex flex-col bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
            <p className="text-sm text-gray-600">
              Precio: ${item.precioUnitario.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.id, item.tipoId)}
            className="text-red-500 hover:text-red-700 transition-colors ml-2"
            title="Eliminar paquete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="font-medium text-gray-800 min-w-[30px] text-center">
              {item.cantidad}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="font-bold text-gray-800">
            ${item.subtotal.toFixed(2)}
          </span>
        </div>
      </li>
    );
  }

  // Si es un item agrupado (pizzas/mariscos)
  if (item.productos && Array.isArray(item.productos)) {
    return (
      <li className="flex flex-col bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
            <p className="text-sm text-gray-600">
              Cantidad total: {item.cantidad} | 
              Precio c/u: ${item.precioUnitario.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.id, item.tipoId)}
            className="text-red-500 hover:text-red-700 transition-colors ml-2"
            title="Eliminar todo el grupo"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Lista de productos */}
        <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
          {item.productos.map((producto) => (
            <div key={producto.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
              <div className="flex-1">
                <p className="text-gray-700">{producto.nombre}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.tipoId, producto.cantidad - 1, producto.id)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded p-1 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-medium text-gray-800 min-w-[25px] text-center">
                  {producto.cantidad}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.tipoId, producto.cantidad + 1, producto.id)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded p-1 transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => onRemove(item.id, item.tipoId, producto.id)}
                  className="text-red-500 hover:text-red-700 transition-colors ml-2"
                  title="Eliminar este producto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal del grupo */}
        <div className="flex justify-end mt-2 pt-2 border-t border-gray-200">
          <span className="font-bold text-gray-800">
            Subtotal: ${item.subtotal.toFixed(2)}
          </span>
        </div>
      </li>
    );
  }

  // Item normal (no agrupado)
  return (
    <li className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
        <p className="text-sm text-gray-600">
          ${item.precioUnitario.toFixed(2)} x {item.cantidad}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="font-medium text-gray-800 min-w-[30px] text-center">
            {item.cantidad}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <span className="font-bold text-gray-800 min-w-[80px] text-right">
          ${item.subtotal.toFixed(2)}
        </span>
        <button
          onClick={() => onRemove(item.id, item.tipoId)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
};

export default CartItem;