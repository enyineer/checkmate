import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";

export const usePermissions = () => {
  const { data: session } = authClient.useSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res = await fetch("/api/auth-backend/permissions");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.permissions)) {
            setPermissions(data.permissions as string[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch permissions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [session?.user?.id]);

  return { permissions, loading };
};
