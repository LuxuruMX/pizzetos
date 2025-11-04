'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/PedidosCard'

export default function App() {
    const [loading, setLoading] = useState(false);
    const actions = [
      { label: 'Editar', onClick: () => alert('Editar') },
      { label: 'Listo', onClick: () => alert('Eliminar') },
      { label: 'AAAA', onClick: () =>alert('aa') }
    ];

    const cardsData = [
    {
      id: 1,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    },
    {
      id: 2,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    },
    {
      id: 3,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    },
    {
      id: 4,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    },
    {
      id: 5,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    },
    {
      id: 6,
      title: 'Producto desde Backend',
      description: (
        <>
          <p className="mb-2"><b>Precio:</b> $99.99</p>
          <p className="mb-2"><b>Stock:</b> 50 unidades</p>
          <p className="mb-2"><b>Descripción:</b> Este es un producto de ejemplo que viene desde tu API.</p>
          <p className="mb-2">Puedes iterar sobre un array de productos y mostrar cada uno en una tarjeta.</p>
          <p className="mb-2">El componente es totalmente reutilizable y customizable.</p>
        </>
      ),
    }
    ];

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-4 gap-4 items-start">
            {cardsData.map((card) => (
              <Card
                key={card.id}
                title={card.title}
                description={card.description}
                actions={actions}
                loading={loading}
                maxHeight={200}
              />
            ))}
          </div>
        </div>
      </div>
    );
}