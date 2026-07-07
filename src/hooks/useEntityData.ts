import { useState, useCallback, useEffect } from "react";

export function useEntityData<T>(
  fetchFn: (tenantParam: string | null) => Promise<T[]>,
  tenantParam: string | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(tenantParam);
      setData(result);
    } catch (err: any) {
      setError(err);
      console.error("Error loading entity data:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, tenantParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refresh: loadData };
}
