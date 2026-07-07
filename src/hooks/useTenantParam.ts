import { useSearchParams } from "next/navigation";

export function useTenantParam(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get("tenant");
}
