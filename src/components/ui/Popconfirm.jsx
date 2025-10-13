'use client';

import { useState, useRef, useEffect } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

export default function Popconfirm({ 
  children, 
  title = '¿Estás seguro?', 
  okText = 'Sí', 
  cancelText = 'No',
  onConfirm,
  onCancel 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    setIsOpen(false);
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]"
          style={{ transform: 'translateY(-4px)' }}
        >
          <div className="flex items-start gap-2 mb-3">
            <FaExclamationCircle className="text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{title}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              {okText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
