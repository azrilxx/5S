import { useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface AutoSaveOptions {
  data: any;
  saveFunction: (data: any) => void;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ data, saveFunction, delay = 30000, enabled = true }: AutoSaveOptions) {
  const debouncedData = useDebounce(data, delay);
  const lastSavedRef = useRef<string>('');
  const initialRender = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    
    // Skip initial render to prevent saving empty forms
    if (initialRender.current) {
      initialRender.current = false;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }

    const currentDataString = JSON.stringify(debouncedData);
    
    // Only save if data has actually changed
    if (currentDataString !== lastSavedRef.current && currentDataString !== '{}') {
      console.log('Auto-saving form data...');
      saveFunction(debouncedData);
      lastSavedRef.current = currentDataString;
    }
  }, [debouncedData, saveFunction, enabled]);

  return {
    isSaving: false // Could be enhanced with actual saving state
  };
}