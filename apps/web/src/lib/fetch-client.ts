type PrimitiveParam = string | number | boolean;
type ParamValue = PrimitiveParam | PrimitiveParam[];

interface FetchOptions extends RequestInit {
  params?: Record<string, ParamValue | null | undefined>;
}

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function appendSearchParam(
  url: URL,
  key: string,
  value: ParamValue | null | undefined
) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      url.searchParams.append(key, String(item));
    });
    return;
  }

  url.searchParams.append(key, String(value));
}

function buildUrl(
  endpoint: string,
  params?: Record<string, ParamValue | null | undefined>
): string {
  const url = new URL(
    endpoint.startsWith("http") ? endpoint : `${baseURL}${endpoint}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      appendSearchParam(url, key, value);
    });
  }

  return url.toString();
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
