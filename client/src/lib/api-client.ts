export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem("noc_token");
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    if (response.status === 401) {
      // Auto logout on unauthorized if needed, but handled by app logic
      throw new Error(errorData.message || "Unauthorized");
    }
    
    throw new Error(errorData.message || "An error occurred");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
