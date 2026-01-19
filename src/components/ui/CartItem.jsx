// CartItem.js
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";

const CartItem = ({ item, onUpdateQuantity, onRemove, onToggleQueso }) => {
  // Función para determinar la clase de color basada en el status
  const getStatusClass = (status) => {
    switch (status) {
      case 0: return 'border-red-500 bg-red-50';
      case 2: return 'border-green-500 bg-green-50';
      case 1:
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Si es un paquete, renderizar de manera especial
  if (item.esPaquete) {
    const statusClass = getStatusClass(item.status); // Usa el status del paquete
    return (
      <li className={`flex flex-col p-3 rounded border ${statusClass}`}>
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
            <FaTrash size={20} />
          </button>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
            >
              <FaMinus size={16} />
            </button>
            <span className="font-medium text-gray-800 min-w-[30px] text-center">
              {item.cantidad}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
            >
              <FaPlus size={16} />
            </button>
          </div>
          <span className="font-bold text-gray-800">
            ${item.subtotal.toFixed(2)}
          </span>
        </div>
      </li>
    );
  }

  if (item.productos && Array.isArray(item.productos)) {
    // En este caso, el contenedor del grupo puede tener un estilo base
    return (
      <li className="flex flex-col p-3 rounded border border-gray-300 bg-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded p-1 transition-colors"
                >
                  <FaMinus size={12} />
                </button>
                <span className="font-bold text-gray-800 text-sm">
                  {item.cantidad}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded p-1 transition-colors"
                >
                  <FaPlus size={12} />
                </button>
                <span className="text-sm text-gray-600 ml-2">
                  | Precio c/u: ${item.precioUnitario.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onRemove(item.id, item.tipoId)}
            className="text-red-500 hover:text-red-700 transition-colors ml-2"
            title="Eliminar todo el grupo"
          >
            <FaTrash size={20} />
          </button>
        </div>

        {/* Lista de productos */}
        <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
          {item.productos.map((producto) => {
            const statusClass = getStatusClass(producto.status);
            return (
              <div key={producto.id} className={`flex items-center justify-between text-sm p-2 rounded border ${statusClass}`}>
                <div className="flex-1">
                  <p className="text-gray-700">{producto.nombre}</p>
                  {/* Checkbox Queso solo para Pizzas/Mariscos en grupo */}
                  {(item.tipoId === 'pizza_group' || item.tipoId === 'id_maris') && (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id={`queso-${producto.id}`}
                        checked={producto.conQueso || false}
                        onChange={(e) => onToggleQueso(item.id, item.tipoId, producto.id)}
                        className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500 cursor-pointer"
                      />
                      <label htmlFor={`queso-${producto.id}`} className="text-xs text-gray-500 cursor-pointer select-none">
                        Orilla Queso {producto.conQueso ? '(Extra aplicado)' : ''}
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.tipoId, producto.cantidad - 1, producto.id)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded p-1 transition-colors"
                  >
                    <FaMinus size={14} />
                  </button>
                  <span className="font-medium text-gray-800 min-w-[25px] text-center">
                    {producto.cantidad}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.tipoId, producto.cantidad + 1, producto.id)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded p-1 transition-colors"
                  >
                    <FaPlus size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(item.id, item.tipoId, producto.id)}
                    className="text-red-500 hover:text-red-700 transition-colors ml-2"
                    title="Eliminar este producto"
                  >
                    <FaTrash size={17} />
                  </button>
                </div>
              </div>
            );
          })}
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
  const statusClass = getStatusClass(item.status); // Usa el status del ítem individual
  return (
    <li className={`flex items-center justify-between p-3 rounded border ${statusClass}`}>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
        <p className="text-sm text-gray-600">
          ${item.precioUnitario.toFixed(2)} x {item.cantidad}
        </p>
        {/* Checkbox Queso solo para single items de legacy pizzas/mariscos */}
        {(item.tipoId === 'id_pizza' || item.tipoId === 'id_maris') && (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id={`queso-single-${item.id}`}
              checked={item.conQueso || false}
              onChange={(e) => onToggleQueso(item.id, item.tipoId)}
              className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500 cursor-pointer"
            />
            <label htmlFor={`queso-single-${item.id}`} className="text-xs text-gray-500 cursor-pointer select-none">
              Orilla Queso {item.conQueso ? '(Extra aplicado)' : ''}
            </label>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad - 1)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
          >
            <FaMinus size={16} />
          </button>
          <span className="font-medium text-gray-800 min-w-[30px] text-center">
            {item.cantidad}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.tipoId, item.cantidad + 1)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded p-1 transition-colors"
          >
            <FaPlus size={16} />
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
          <FaTrash size={20} />
        </button>
      </div>
    </li>
  );
};

export default CartItem;