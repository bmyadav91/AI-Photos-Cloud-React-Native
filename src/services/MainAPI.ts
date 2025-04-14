import EncryptedStorage from 'react-native-encrypted-storage';

// Update this to your computer's local IP address
// const API_DOMAIN = "http://192.168.0.00:5000/api";

// production api domian 
const API_DOMAIN = "https://photos.whatbm.com/api"




interface RefreshTokenResponse {
    success: boolean;
    error?: string;
}

interface ApiRequestOptions {
    API: string | null;
    DATA?: Record<string, any>;
    METHOD?: "GET" | "POST" | "PUT" | "DELETE";
    ACCESS_TOKEN_REQUIRED?: boolean;
    FORM_DATA?: boolean;
}

// ----------------------------- Refresh Token --------------------------------
const refreshToken = async (): Promise<RefreshTokenResponse> => {
    try {
        const access_token = await EncryptedStorage.getItem("access_token");
        const refresh_token = await EncryptedStorage.getItem("refresh_token");
        if (!access_token || !refresh_token) {
            throw new Error("Please Login Again. Access token or refresh token not found");
        }

        const response = await fetch(`${API_DOMAIN}/refresh-token`, {
            method: "POST",
            credentials: "include" as const,
            headers: {
                Authorization: `Bearer ${access_token}`,
                "x-refresh-token": refresh_token,
                "Content-Type": "application/json",
            },
        });

        if (response.status === 401) {
            await EncryptedStorage.removeItem("access_token");
            return { success: false, error: "Refresh token expired" };
        }

        if (!response.ok) {
            return { success: false, error: `Error ${response.status}: Refresh failed` };
        }

        const data = await response.json();
        if (data.access_token) {
            await EncryptedStorage.setItem("access_token", data.access_token);
            return { success: true };
        }

        return { success: false, error: "Invalid response from server" };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
};

// -------------------------- Is Authenticated Check ----------------------------
export const isAuthenticatedFun = async (): Promise<boolean> => {
    try {
        const access_token = await EncryptedStorage.getItem("access_token");
        if (!access_token) return false;

        const response = await fetch(`${API_DOMAIN}/auth-status`, {
            credentials: "include" as const,
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed.success) {
                return isAuthenticatedFun();
            }
            return false;
        }

        if (!response.ok) return false;

        const data = await response.json();
        return Boolean(data.authenticated);
    } catch (error) {
        return false;
    }
};

export const apiRequest = async ({
    API = null,
    DATA = {},
    METHOD = "POST",
    ACCESS_TOKEN_REQUIRED = true,
    FORM_DATA = false,
}: ApiRequestOptions) => {
    try {
        if (!API) {
            throw new Error("API Endpoint not provided.");
        }

        let ACCESS_TOKEN = null;
        if (ACCESS_TOKEN_REQUIRED) {
            ACCESS_TOKEN = await EncryptedStorage.getItem("access_token");
            if (!ACCESS_TOKEN) {
                // throw new Error("Access token not found. Please login.");
                return false;
            }
        }

        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        if (ACCESS_TOKEN) {
            headers["Authorization"] = `Bearer ${ACCESS_TOKEN}`;
        }
        if (!FORM_DATA) {
            headers["Content-Type"] = "application/json";
        }

        const options: RequestInit = {
            method: METHOD,
            headers,
            credentials: "include" as const,
        };

        if (METHOD !== "GET") {
            if (FORM_DATA) {
                options.body = DATA as FormData;
            } else {
                if (DATA && typeof DATA === "object" && !Array.isArray(DATA)) {
                    options.body = JSON.stringify(DATA);
                } else {
                    throw new Error("Invalid DATA format. Expected an object.");
                }
            }
        } else if (DATA && Object.keys(DATA).length > 0) {
            const queryParams = new URLSearchParams(DATA).toString();
            API = `${API}?${queryParams}`;
        }

        let response = await fetch(`${API_DOMAIN}${API}`, options);

        if (response.status === 401 && ACCESS_TOKEN_REQUIRED) {
            const refreshed = await refreshToken();
            if (refreshed.success) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${await EncryptedStorage.getItem("access_token")}`,
                };
                response = await fetch(`${API_DOMAIN}${API}`, options);
            } else {
                throw new Error("Unauthorized: Token refresh failed. Please login again.");
            }
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error("Invalid JSON response from API");
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data?.message || "Request failed."}`);
        }

        return data;
    } catch (error: unknown) {
        throw error;
    }
};