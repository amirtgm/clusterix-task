import type {
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchApi } from "./fetch-client";

export function useApi<T>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey: [endpoint],
    queryFn: () => fetchApi<T>(endpoint),
    ...options,
  });
}

export function useMutateApi<TData, TError = Error, TVariables = void>(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables) =>
      fetchApi<TData>(endpoint, {
        method,
        body: variables ? JSON.stringify(variables) : undefined,
      }),
    ...options,
  });
}
