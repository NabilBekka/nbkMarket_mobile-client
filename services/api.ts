const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const { headers: optHeaders, ...restOptions } = options;
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...(optHeaders as Record<string, string>) },
      ...restOptions,
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Request failed", details: data.details };
    }

    return { data };
  } catch {
    return { error: "Network error" };
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      username: string;
      birth_date?: string;
      lang?: string;
    }) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    verifyEmail: (body: { email: string; code: string }) =>
      request<{ accessToken: string; user: Record<string, unknown> }>(
        "/auth/verify-email",
        { method: "POST", body: JSON.stringify(body) }
      ),

    resendCode: (body: { email: string }) =>
      request("/auth/resend-code", { method: "POST", body: JSON.stringify(body) }),

    checkUsername: (username: string) =>
      request<{ available: boolean }>(`/auth/check-username/${username}`),

    google: (body: { credential: string }) =>
      request<{
        accessToken?: string;
        user?: Record<string, unknown>;
        isExistingUser?: boolean;
        googleData?: {
          googleId: string;
          email: string;
          firstName: string;
          lastName: string;
        };
      }>("/auth/google", { method: "POST", body: JSON.stringify(body) }),

    googleRegister: (body: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      username: string;
      password: string;
      birthDate?: string;
    }) =>
      request<{ accessToken: string; user: Record<string, unknown> }>(
        "/auth/google/register",
        { method: "POST", body: JSON.stringify(body) }
      ),

    login: (body: { email: string; password: string }) =>
      request<{ accessToken: string; user: Record<string, unknown> }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(body) }
      ),

    forgotPassword: (body: { email: string; lang?: string }) =>
      request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),

    resetPassword: (body: { email: string; code: string; password: string }) =>
      request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),

    logout: (token: string) =>
      request("/auth/logout", { method: "POST", headers: authHeaders(token) }),

    getMe: (token: string) =>
      request<{ user: Record<string, unknown> }>("/auth/me", { headers: authHeaders(token) }),

    updateProfile: (
      token: string,
      body: { password: string; updates: Record<string, string> }
    ) =>
      request<{ user: Record<string, unknown> }>("/auth/profile", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      }),

    deleteAccount: (token: string, body: { password: string }) =>
      request("/auth/account", {
        method: "DELETE",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      }),

    updateLang: (token: string, body: { lang: string }) =>
      request("/auth/lang", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      }),
  },
};
