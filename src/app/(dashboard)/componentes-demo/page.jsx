'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/utils/toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { FaSave, FaTrash, FaPlus, FaUser, FaSearch } from 'react-icons/fa';

export default function ComponentesDemoPage() {
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Efecto para mostrar toasts automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      showToast.info('Visualizando diseño de notificación (Automático)');
      showToast.success('Visualizando diseño de notificación (Automático)');
      showToast.error('Visualizando diseño de notificación (Automático)');
      showToast.warning('Visualizando diseño de notificación (Automático)');
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Datos de ejemplo para la tabla
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Precio', accessor: 'precio', render: (row) => `$${row.precio}` },
  ];

  const data = [
    { id: 1, nombre: 'Alitas BBQ', precio: 120 },
    { id: 2, nombre: 'Hamburguesa Clásica', precio: 85 },
    { id: 3, nombre: 'Pizza Pepperoni', precio: 150 },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Demostración de Componentes
      </h1>

      {/* Botones */}
      <Card title="Botones" subtitle="Diferentes variantes y tamaños">
        <div className="space-y-6">
          {/* Variantes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Variantes</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="info">Info</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Tamaños */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tamaños</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </div>

          {/* Con iconos */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Con Iconos</h4>
            <div className="flex flex-wrap gap-3">
              <Button icon={FaSave} variant="success">Guardar</Button>
              <Button icon={FaTrash} variant="danger">Eliminar</Button>
              <Button icon={FaPlus} variant="primary">Agregar</Button>
            </div>
          </div>

          {/* Estados */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Estados</h4>
            <div className="flex flex-wrap gap-3">
              <Button>Normal</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
          </div>

          {/* Full Width */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Ancho Completo</h4>
            <Button fullWidth variant="primary">Botón de Ancho Completo</Button>
          </div>
        </div>
      </Card>

      {/* Inputs */}
      <Card title="Inputs" subtitle="Campos de entrada con diferentes configuraciones">
        <div className="space-y-4 max-w-md">
          <Input
            label="Nombre"
            placeholder="Ingresa tu nombre"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <Input
            label="Usuario"
            placeholder="Buscar usuario"
            icon={FaUser}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          <Input
            label="Búsqueda"
            placeholder="Buscar..."
            icon={FaSearch}
          />

          <Input
            label="Campo Requerido"
            placeholder="Este campo es obligatorio"
            required
          />

          <Input
            label="Con Error"
            placeholder="Campo con error"
            error="Este campo tiene un error"
          />

          <Input
            label="Deshabilitado"
            placeholder="Campo deshabilitado"
            disabled
            value="No editable"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Ingresa tu contraseña"
          />
        </div>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Card Simple" subtitle="Con título y subtítulo">
          <p className="text-gray-600">Contenido de la tarjeta</p>
        </Card>

        <Card title="Sin Padding" padding="none">
          <div className="p-4 bg-yellow-50">
            <p className="text-gray-600">Card sin padding por defecto</p>
          </div>
        </Card>

        <Card padding="lg">
          <p className="text-gray-600">Card con padding grande</p>
        </Card>
      </div>

      {/* Tabla */}
      <Card title="Tabla" subtitle="Tabla con datos de ejemplo">
        <Table
          columns={columns}
          data={data}
          onEdit={(row) => alert(`Editar: ${row.nombre}`)}
          onDelete={(row) => alert(`Eliminar: ${row.nombre}`)}
        />
      </Card>

      {/* Tabla vacía */}
      <Card title="Tabla Vacía" subtitle="Sin datos">
        <Table columns={columns} data={[]} />
      </Card>
    </div>
  );
}