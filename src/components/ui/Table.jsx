// @/components/ui/Table.js
export default function Table({
  columns,
  data,
  // onEdit, // <-- Puedes remover esta prop si ya no se usa internamente
  // onDelete, // <-- Puedes remover esta prop si ya no se usa internamente
  renderActions, // <-- Acepta la nueva prop
  className = ''
}) {
  const hasActions = !!renderActions; // Determina si hay acciones basado en si se pasó renderActions

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
              >
                {column.header}
              </th>
            ))}
            {hasActions && ( // <-- Ahora el encabezado de acciones depende de renderActions
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)} // <-- Ajusta el colspan
                className="px-6 py-4 text-center text-gray-500"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
                {hasActions && ( // <-- Renderiza la celda de acciones si se provee renderActions
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderActions(row)} {/* <-- Llama a la función renderActions */}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}