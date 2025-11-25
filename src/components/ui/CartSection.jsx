import CartItem from '@/components/ui/CartItem';
import { MdComment, MdBrightness1 } from "react-icons/md";

const CartSection = ({ 
  orden, 
  total, 
  onUpdateQuantity, 
  onRemove, 
  onEnviarOrden,
  comentarios,
  onAbrirComentarios 
}) => {
  return (
    <div className="w-1/3 bg-white rounded-lg shadow-lg flex flex-col" 
         style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      {/* Sección superior: Título y Lista de Artículos (se desplaza) */}
      <div className="flex-1 overflow-y-auto">
        <div>
          <h2 className="text-2xl font-bold mb-4 px-6 pt-6 text-black">Carrito</h2>
          {orden.length === 0 ? (
            <p className="text-gray-500 px-6">El carrito está vacío.</p>
          ) : (
            <div>
              <ul className="mb-4 space-y-2 px-6">
                {orden.map((item) => (
                  <CartItem
                    key={`${item.tipo}-${item.id}`}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sección inferior fija: Total, Botón Comentarios y Botón Enviar */}
      <div className="border-t pt-4 px-6 pb-6 bg-white">
        {orden.length > 0 && (
          <div className="flex justify-between text-black mb-4">
            <strong>Total:</strong>
            <span>${total.toFixed(2)}</span>
          </div>
        )}
        
        {/* Botón de Comentarios */}
        <button
          onClick={onAbrirComentarios}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded mb-3 flex items-center justify-center gap-2 transition-colors"
        >
          <MdComment className="text-xl" />
          <span>{comentarios ? 'Editar comentarios' : 'Agregar comentarios'}</span>
          {comentarios && (
            <span className="ml-1 text-xs text-green-600 font-bold"><MdBrightness1 /></span>
          )}
        </button>

        {/* Botón Enviar Orden */}
        <button
          onClick={onEnviarOrden}
          disabled={orden.length === 0}
          className="w-full bg-orange-400 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded transition-colors"
        >
          Enviar Orden
        </button>
      </div>
    </div>
  );
};

export default CartSection;