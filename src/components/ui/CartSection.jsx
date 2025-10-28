import CartItem from '@/components/ui/CartItem';

const CartSection = ({ orden, total, onUpdateQuantity, onRemove, onEnviarOrden }) => {
  return (
    <div className="w-1/3 bg-white rounded-lg shadow-lg flex flex-col justify-between overflow-y-auto" 
         style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div>
        <h2 className="text-2xl font-bold mb-4 px-6 pt-6 text-black">Carrito</h2>
        {orden.length === 0 ? (
          <p className="text-gray-500 px-6">El carrito está vacío.</p>
        ) : (
          <div>
            <ul className="mb-4 space-y-2 px-6">
              {orden.map((item) => (
                <CartItem
                  key={`${item.tipoId}-${item.id}`}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </ul>
            <div className="border-t pt-2 px-6">
              <div className="flex justify-between text-black">
                <strong>Total:</strong>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 px-6 pb-6">
        <button
          onClick={onEnviarOrden}
          className="w-full bg-orange-400 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded"
        >
          Enviar Orden
        </button>
      </div>
    </div>
  );
};

export default CartSection;