import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProperties = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user properties with optional query parameters
    const fetchUserProperties = useCallback(async (queryParams = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                limit: '100',
                page: '1',
                ...queryParams
            });

            const response = await api.get(`/properties/my-properties?${params.toString()}`);
            if (response.data?.success) {
                setProperties(response.data.data.properties || []);
                return response.data.data.properties;
            }
            throw new Error(response.data?.message || 'Failed to load properties');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load properties';
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all properties (no filters)
    const fetchAllProperties = useCallback(async () => {
        return fetchUserProperties();
    }, [fetchUserProperties]);

    const fetchPropertiesByStatus = useCallback(async (status) => {
        return fetchUserProperties({ status });
    }, [fetchUserProperties]);

    const fetchPropertiesByCategory = useCallback(async (category) => {
        return fetchUserProperties({ category });
    }, [fetchUserProperties]);

    const fetchPropertiesByMarketStatus = useCallback(async (marketStatus) => {
        return fetchUserProperties({ marketStatus });
    }, [fetchUserProperties]);

    // Update property status
    const updatePropertyStatus = useCallback(async (propertyId, newStatus) => {
        try {
            const response = await api.put(`/properties/${propertyId}/status`, {
                status: newStatus
            });
            if (response.data?.success) {
                // Update local state immediately for better UX
                setProperties(prevProperties =>
                    prevProperties.map(property =>
                        property._id === propertyId
                            ? {
                                ...property,
                                status: newStatus,
                                // Reset monthly views when status changes
                                analytics: {
                                    ...property.analytics,
                                    viewsThisMonth: newStatus === 'published' ? 0 : property.analytics?.viewsThisMonth || 0
                                }
                            }
                            : property
                    )
                );
                return { success: true };
            }
            throw new Error(response.data?.message || 'Failed to update property status');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update property status';
            return { success: false, error: errorMessage };
        }
    }, []);

    // Add property
    const addProperty = useCallback(async (propertyData) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const response = await api.post('/properties/add-property', propertyData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data?.success) {
                // Refresh properties list
                await fetchAllProperties();
                return {
                    success: true,
                    message: response.data.message || 'Property added successfully!'
                };
            }
            throw new Error(response.data?.message || 'Failed to add property');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add property';
            setSubmitError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchAllProperties]);

    const clearSubmitError = useCallback(() => {
        setSubmitError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        properties,
        loading,
        error,
        fetchUserProperties,
        fetchAllProperties,
        fetchPropertiesByStatus,
        fetchPropertiesByCategory,
        fetchPropertiesByMarketStatus,
        updatePropertyStatus,
        addProperty,
        isSubmitting,
        submitError,
        clearSubmitError,
        clearError
    };
};