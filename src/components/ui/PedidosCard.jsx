import React, { useState, useRef, useEffect } from 'react'

const Card = ({ title, description, actions, loading = false, maxHeight = 150, icon, iconDescription }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && !loading) {
      const contentHeight = contentRef.current.scrollHeight;
      setShowExpandButton(contentHeight > maxHeight);
    }
  }, [description, loading, maxHeight]);

  // Detectar clicks fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse" style={{ minWidth: 300 }}>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="relative bg-white rounded-lg shadow-md border border-gray-200"
      style={{ minWidth: 300 }}
    >
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[2rem]">
                {icon}
                {iconDescription && (
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5 leading-none text-center max-w-[4rem]">
                    {iconDescription}
                  </span>
                )}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
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
              disabled={action.disabled}
              className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${action.disabled
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                : 'text-gray-700 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
            >
              {action.icon && (
                <div className="flex flex-col items-center justify-center">
                  <span className="flex-shrink-0 text-xl">{action.icon}</span>
                  {action.iconDescription && (
                    <span className="text-[10px] font-normal mt-0.5 leading-none">
                      {action.iconDescription}
                    </span>
                  )}
                </div>
              )}
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
              <div className="flex items-center gap-3 mb-2">
                {icon && (
                  <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[2rem]">
                    {icon}
                    {iconDescription && (
                      <span className="text-[10px] text-gray-500 font-medium mt-0.5 leading-none text-center max-w-[4rem]">
                        {iconDescription}
                      </span>
                    )}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <div className="text-gray-600 text-sm">
                {description}
              </div>
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
                  disabled={action.disabled}
                  className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${action.disabled
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  {action.icon && (
                    <div className="flex flex-col items-center justify-center">
                      <span className="flex-shrink-0 text-xl">{action.icon}</span>
                      {action.iconDescription && (
                        <span className="text-[10px] font-normal mt-0.5 leading-none">
                          {action.iconDescription}
                        </span>
                      )}
                    </div>
                  )}
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