import {useState, useEffect, useCallback, useMemo, useRef, createContext} from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoaded, isSignedIn, user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const router = useRouter();
    const intervalRef = useRef(null);
    const lastCheckRef = useRef(0);
    const syncedRef = useRef(false);

    // Constants
    const CACHE_TIME = 60 * 60 * 1000; // 1 hour
    const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

    const clearAuth = useCallback(() => {
        setUser(null);
        setError(null);
        api.clearAuth();
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        lastCheckRef.current = 0;
        syncedRef.current = false;
    }, []);

    // Validate token with backend
    const validateToken = useCallback(async (token) => {
        try {
            api.setAuthToken(token);
            const response = await api.get('/auth/me');
            if (response.data?.success) {
                const userData = response.data.data.user;
                setUser(userData);
                setError(null);
                lastCheckRef.current = Date.now();
                return { success: true, user: userData };
            }
            clearAuth();
            return { success: false };
        } catch (error) {
            clearAuth();
            if (error.response?.status === 401) {
                setError('Session expired. Please sign in again.');
            }
            return { success: false };
        }
    }, [clearAuth]);

    // Smart refresh with caching
    const refreshUser = useCallback(async (force = false) => {
        const token = localStorage.getItem('authToken');
        if (!token) return { success: false };

        // Use cache if recent check and not forced
        const timeSinceCheck = Date.now() - lastCheckRef.current;
        if (!force && timeSinceCheck < CACHE_TIME && user) {
            return { success: true, user };
        }

        return validateToken(token);
    }, [validateToken, user]);

    // Update user information (only accountType for now)
    const updateUser = useCallback(async (updateData) => {
        if (!user) {
            throw new Error('No user to update');
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await api.put('/auth/update-user', updateData);

            if (response.data?.success) {
                const updatedUser = response.data.data.user;

                // If a new token was returned (account type changed), update it
                if (response.data.data.token) {
                    api.setAuthToken(response.data.data.token);
                    localStorage.setItem('authToken', response.data.data.token);
                }

                setUser(updatedUser);
                lastCheckRef.current = Date.now();
                return { success: true, user: updatedUser };
            }

            throw new Error(response.data?.message || 'Update failed');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Update failed';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Auth methods
    const signIn = useCallback(async (email, password) => {
        if (isLoading) return { success: false, error: 'Please wait...' };

        try {
            setIsLoading(true);
            setError(null);

            const response = await api.post('/auth/signin', { email, password });

            if (response.data?.success) {
                const { user: userData, token } = response.data.data;
                api.setAuthToken(token);
                setUser(userData);
                lastCheckRef.current = Date.now();
                return { success: true };
            }

            throw new Error(response.data?.message || 'Sign in failed');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Sign in failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const signUp = useCallback(async (fullName, email, password) => {
        if (isLoading) return { success: false, error: 'Please wait...' };

        try {
            setIsLoading(true);
            setError(null);

            const response = await api.post('/auth/signup', { fullName, email, password });

            if (response.data?.success) {
                const { user: userData, token } = response.data.data;
                api.setAuthToken(token);
                setUser(userData);
                lastCheckRef.current = Date.now();
                router.push('/auth/callback');
                return { success: true };
            }

            throw new Error(response.data?.message || 'Sign up failed');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Sign up failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, router]);

    const signOut = useCallback(async (options = {}) => {
        try {
            setIsLoading(true);

            if (user) {
                try {
                    await api.post('/auth/signout');
                } catch (error) {
                    console.warn('Backend signout failed:', error.response?.data?.message || error.message);
                }
            }

            const isClerkUser = user?.authMethod === 'clerk' && isSignedIn;
            if (!isClerkUser) {
                clearAuth();
                return { success: true };
            }

            const signOutOptions = options.redirectUrl ? { redirectUrl: options.redirectUrl } : {};
            await clerkSignOut(signOutOptions);

            clearAuth();
            return { success: true };
        } catch (error) {
            console.error('Signout error:', error);
            clearAuth();
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user, isSignedIn, clerkSignOut, clearAuth]);

    // Sync Clerk user
    const syncClerkUser = useCallback(async () => {
        if (!clerkUser || syncedRef.current) return;
        syncedRef.current = true;
        setIsLoading(true);

        try {
            const response = await api.post('/auth/callback', {
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                clerkId: clerkUser.id || ''
            });

            if (response.data?.success) {
                const { user: userData, token } = response.data.data;
                api.setAuthToken(token);
                setUser(userData);
                lastCheckRef.current = Date.now();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Sync failed');
        } finally {
            setIsLoading(false);
        }
    }, [clerkUser]);

    // Setup periodic validation
    useEffect(() => {
        if (!user) return;

        intervalRef.current = setInterval(() => {
            refreshUser(true);
        }, CHECK_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [user, refreshUser]);

    // Handle page focus
    useEffect(() => {
        const handleFocus = () => {
            if (user && Date.now() - lastCheckRef.current > 12 * 60 * 60 * 1000) {
                refreshUser(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, refreshUser]);

    // Initial auth check
    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && clerkUser) {
            syncClerkUser();
        } else {
            const token = localStorage.getItem('authToken');
            if (token) {
                validateToken(token).finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        }
    }, [isLoaded, isSignedIn, clerkUser, syncClerkUser, validateToken]);

    // Context value
    const value = useMemo(() => ({
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
        updateUser, // Added updateUser to context
        clearError: () => setError(null)
    }), [user, isLoading, error, signIn, signUp, signOut, refreshUser, updateUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};