const getLocalStorage = (key, defaultValue) => {
  if (typeof window !== 'undefined') {
    const value = localStorage.getItem(key);
    if (value !== null) {
      // Handle boolean strings
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }
  }
  return defaultValue;
};

export const POS_CONFIG = {
  lockViewport: getLocalStorage('POS_LOCK_VIEWPORT', true),
  PRINTER_SIZE: getLocalStorage('POS_PRINTER_SIZE', '58mm'), // Options: '58mm', '80mm'
};
