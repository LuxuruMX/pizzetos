'use client';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de ejemplo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Bienvenido
          </h2>
          <p className="text-gray-600">
            Sistema de administración de Pizzetos
          </p>
        </div>
      </div>
    </div>
  );
}
