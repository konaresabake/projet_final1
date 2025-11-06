import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, showToast = true } = options;

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        if (showToast) {
          toast.success('Opération réussie');
        }
        
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        
        if (onError) {
          onError(error);
        }
        
        if (showToast) {
          toast.error(`Erreur: ${error.message}`);
        }
        
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, showToast]
  );

  return {
    data,
    loading,
    error,
    execute,
  };
}

export default useApi;
