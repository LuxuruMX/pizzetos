import { useState } from 'react';
import { IoClose } from "react-icons/io5";


// Modal para Paquete 1 (sin opciones, solo confirmar)
export const ModalPaquete1 = ({ isOpen, onClose, onConfirmar }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Paquete 1</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">Este paquete incluye:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>2 Pizzas Grandes (Hawaiana y Pepperoni)</li>
            <li>1 Refresco de 2L Jarrito</li>
          </ul>
          <p className="text-xl font-bold text-green-600 mt-4">Precio: $295.00</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para Paquete 2
export const ModalPaquete2 = ({ isOpen, onClose, onConfirmar, pizzas, hamburguesas, alitas }) => {
  const [seleccion, setSeleccion] = useState({
    tipo: 'hamburguesa', // 'hamburguesa' o 'alitas'
    idProducto: null,
    idPizza: null
  });

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!seleccion.idProducto || !seleccion.idPizza) {
      alert('Por favor selecciona todos los productos');
      return;
    }
    onConfirmar(seleccion);
    setSeleccion({ tipo: 'hamburguesa', idProducto: null, idPizza: null });
  };

  const productosDisponibles = seleccion.tipo === 'hamburguesa' ? hamburguesas : alitas;

  return (
    <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Paquete 2</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>

        <p className="text-xl font-bold text-green-600 mb-4">Precio: $265.00</p>

        {/* Selector de tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el tipo de producto:
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setSeleccion({ ...seleccion, tipo: 'hamburguesa', idProducto: null })}
              className={`flex-1 py-2 px-4 rounded font-medium ${seleccion.tipo === 'hamburguesa'
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Hamburguesa
            </button>
            <button
              onClick={() => setSeleccion({ ...seleccion, tipo: 'alitas', idProducto: null })}
              className={`flex-1 py-2 px-4 rounded font-medium ${seleccion.tipo === 'alitas'
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Alitas
            </button>
          </div>
        </div>

        {/* Selector de producto */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu {seleccion.tipo}:
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {productosDisponibles.map((producto) => (
              <button
                key={producto[seleccion.tipo === 'hamburguesa' ? 'id_hamb' : 'id_alis']}
                onClick={() => setSeleccion({
                  ...seleccion,
                  idProducto: producto[seleccion.tipo === 'hamburguesa' ? 'id_hamb' : 'id_alis']
                })}
                className={`p-3 rounded border-2 text-left ${seleccion.idProducto === producto[seleccion.tipo === 'hamburguesa' ? 'id_hamb' : 'id_alis']
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-300 hover:border-yellow-300'
                  }`}
              >
                <p className="font-medium text-gray-900">{producto.nombre}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de pizza */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu Pizza Grande:
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {pizzas
              .filter(p => p.tamano === 'Grande Especial')
              .map((pizza) => (
                <button
                  key={pizza.id_pizza}
                  onClick={() => setSeleccion({ ...seleccion, idPizza: pizza.id_pizza })}
                  className={`p-3 rounded border-2 text-left ${seleccion.idPizza === pizza.id_pizza
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-300 hover:border-yellow-300'
                    }`}
                >
                  <p className="font-medium text-gray-900">{pizza.nombre}</p>
                </button>
              ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>El paquete también incluye: 1 Refresco de 2L Jarrito</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para Paquete 3
export const ModalPaquete3 = ({ isOpen, onClose, onConfirmar, pizzas }) => {
  const [pizzasSeleccionadas, setPizzasSeleccionadas] = useState([]);

  if (!isOpen) return null;

  const handleTogglePizza = (idPizza) => {
    if (pizzasSeleccionadas.includes(idPizza)) {
      setPizzasSeleccionadas(pizzasSeleccionadas.filter(id => id !== idPizza));
    } else if (pizzasSeleccionadas.length < 3) {
      setPizzasSeleccionadas([...pizzasSeleccionadas, idPizza]);
    }
  };

  const handleConfirmar = () => {
    if (pizzasSeleccionadas.length !== 3) {
      alert('Debes seleccionar exactamente 3 pizzas');
      return;
    }
    onConfirmar(pizzasSeleccionadas);
    setPizzasSeleccionadas([]);
  };

  return (
    <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Paquete 3</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>

        <p className="text-xl font-bold text-green-600 mb-2">Precio: $395.00</p>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona 3 Pizzas Grandes ({pizzasSeleccionadas.length}/3 seleccionadas)
        </p>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {pizzas
              .filter(p => p.tamano === 'Grande Especial')
              .map((pizza) => (
                <button
                  key={pizza.id_pizza}
                  onClick={() => handleTogglePizza(pizza.id_pizza)}
                  disabled={!pizzasSeleccionadas.includes(pizza.id_pizza) && pizzasSeleccionadas.length >= 3}
                  className={`p-3 rounded border-2 text-left ${pizzasSeleccionadas.includes(pizza.id_pizza)
                    ? 'border-yellow-400 bg-yellow-50'
                    : pizzasSeleccionadas.length >= 3
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                      : 'border-gray-300 hover:border-yellow-300'
                    }`}
                >
                  <p className="font-medium text-gray-900">{pizza.nombre}</p>
                  {pizzasSeleccionadas.includes(pizza.id_pizza) && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ✓ Seleccionada (#{pizzasSeleccionadas.indexOf(pizza.id_pizza) + 1})
                    </p>
                  )}
                </button>
              ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>El paquete también incluye: 1 Refresco de 2L Jarrito</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};