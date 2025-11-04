import React, { useState } from 'react'

const Card = ({ title, description, actions, loading = false, maxHeight = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = React.useRef(null);

  React.useEffect(() => {

    if (contentRef.current && !loading) {
      const contentHeight = contentRef.current.scrollHeight;
      setShowExpandButton(contentHeight > maxHeight);
    }
  }, [description, loading, maxHeight]);

  if (loading) {

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse" style={{ minWidth: 300 }}>

      </div>
    );
  }


  return (
    <div 
      className="relative bg-white rounded-lg shadow-md border border-gray-200" 
      style={{ minWidth: 300 }}
    >
      

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <div className="relative">
            <div
              ref={contentRef} 
              className="text-gray-600 text-sm overflow-hidden"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              {description}
            </div>

            {showExpandButton && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
          {showExpandButton && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Mostrar más
            </button>
          )}
        </div>
      </div>
      {actions && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {isExpanded && (
        <div 
          className="absolute top-0 left-0 z-10 w-full 
                     bg-white rounded-lg shadow-xl 
                     border border-gray-300"
        >

          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <div className="text-gray-600 text-sm">
                {description}
              </div>
              {/* El botón 'Mostrar menos' solo cierra (pone 'isExpanded' en 'false') */}
              <button
                onClick={() => setIsExpanded(false)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Mostrar menos
              </button>
            </div>
          </div>
          {actions && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex gap-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Card;