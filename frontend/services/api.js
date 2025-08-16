import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        // Define authentication endpoints
        const authEndpoints = [
            '/auth/signin',
            '/auth/signup',
            '/auth/callback',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/signout',
        ];

        const isAuthRequest = authEndpoints.some((endpoint) =>
            requestUrl.includes(endpoint)
        );

        if (status === 401) {
            handleUnauthorizedError(isAuthRequest, requestUrl);
        }

        return Promise.reject(error);
    }
);

function handleUnauthorizedError(isAuthRequest, requestUrl) {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('authToken');
    delete api.defaults.headers.common.Authorization;

    if (isAuthRequest) {
        console.warn(`Authentication failed`);
    } else {
        console.warn(`Unauthorized access to protected route`);
        redirectToLogin();
    }
}

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/real-estate')) {
        window.location.href = '/real-estate';
    }
}

// Helper methods
api.setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    } else {
        api.clearAuth();
    }
};

api.clearAuth = () => {
    delete api.defaults.headers.common.Authorization;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
    }
};

export default api;