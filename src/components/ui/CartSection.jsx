import CartItem from '@/components/ui/CartItem';
import { MdComment, MdBrightness1 } from "react-icons/md";
import { FaChevronDown, FaChevronUp, FaUtensils, FaMotorcycle, FaShoppingBag } from "react-icons/fa";
import { useState, useRef, useEffect } from 'react';

const CartSection = ({
  orden,
  total,
  onUpdateQuantity,
  onRemove,
  onEnviarOrden,
  comentarios,
  onAbrirComentarios,
  tipoServicio,
  onTipoServicioChange,
  mesa,
  onMesaChange
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const opcionesServicio = [
    { id: 0, label: 'Comedor', icon: <FaUtensils /> },
    { id: 1, label: 'Para Llevar', icon: <FaShoppingBag /> },
    { id: 2, label: 'Domicilio', icon: <FaMotorcycle /> },
  ];

  const servicioActual = opcionesServicio.find(op => op.id === tipoServicio) || opcionesServicio[2];

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
                    key={`${item.tipoId}-${item.id}`}
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

        {/* Input de Mesa (Solo para Comedor - Tipo 0) */}
        {tipoServicio === 0 && (
          <div className="mb-4 text-black">
            <label className="block text-sm font-bold mb-1">Mesa:</label>
            <input
              type="number"
              value={mesa}
              onChange={(e) => onMesaChange(e.target.value)}
              placeholder="Número de mesa"
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
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
        {/* Botón Enviar Orden con Selector Split */}
        <div className="flex rounded-lg shadow-sm" ref={menuRef}>
          {/* Botón Izquierdo: Selector */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-3 rounded-l border-r border-orange-600 flex items-center justify-center gap-2 transition-colors h-full min-w-[140px]"
            >
              <span className="text-lg">{servicioActual.icon}</span>
              <span className="text-sm">{servicioActual.label}</span>
              {menuAbierto ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>

            {/* Menú Dropdown */}
            {menuAbierto && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                {opcionesServicio.map((opcion) => (
                  <button
                    key={opcion.id}
                    onClick={() => {
                      onTipoServicioChange(opcion.id);
                      setMenuAbierto(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors ${tipoServicio === opcion.id ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <span className={tipoServicio === opcion.id ? 'text-orange-600' : 'text-gray-500'}>
                      {opcion.icon}
                    </span>
                    {opcion.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Derecho: Enviar */}
          <button
            onClick={onEnviarOrden}
            disabled={orden.length === 0}
            className="flex-1 bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-r transition-colors flex items-center justify-center"
          >
            Enviar Orden
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSection;