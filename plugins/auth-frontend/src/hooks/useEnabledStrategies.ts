import { useState, useEffect } from "react";
import { useApi } from "@checkmate/frontend-api";
import { authApiRef, EnabledAuthStrategy } from "../api";

export interface UseEnabledStrategiesResult {
  strategies: EnabledAuthStrategy[];
  loading: boolean;
  error?: Error;
}

export const useEnabledStrategies = (): UseEnabledStrategiesResult => {
  const authApi = useApi(authApiRef);
  const [strategies, setStrategies] = useState<EnabledAuthStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let mounted = true;

    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const result = await authApi.getEnabledStrategies();
        if (mounted) {
          setStrategies(result);
          setError(undefined);
        }
      } catch (error_) {
        if (mounted) {
          setError(
            error_ instanceof Error
              ? error_
              : new Error("Failed to fetch strategies")
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStrategies();

    return () => {
      mounted = false;
    };
  }, [authApi]);

  return { strategies, loading, error };
};
