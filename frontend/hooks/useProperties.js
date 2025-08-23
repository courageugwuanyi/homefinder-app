import { useState, useCallback } from 'react';
import api from '../services/api';
import { formatPropertyDataForAPI, validateAllPropertyFields, parseBackendErrors } from "../utils/propertyValidation";
import { invalidateAllCaches, invalidateAnalyticsCache } from '../utils/analyticsUtils';

export const useProperties = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extract files from gallery
    const extractFilesFromGallery = useCallback((gallery) => {
        if (!Array.isArray(gallery) || gallery.length === 0) {
            return [];
        }
        return gallery
            .map(item => {
                if (item instanceof File) {
                    return item;
                } else if (item?.file instanceof File) {
                    return item.file;
                }
                return null;
            })
            .filter(Boolean);
    }, []);

    // Create FormData for property submission
    const createPropertyFormData = useCallback((propertyData, files = []) => {
        const formData = new FormData();
        const apiData = formatPropertyDataForAPI(propertyData);

        Object.entries(apiData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        files.forEach((file, index) => {
            formData.append('gallery', file);
            if (index === 0) {
                formData.append('primaryImageIndex', '0');
            }
        });

        return formData;
    }, []);

    // 🚀 FIXED: Fetch user properties without problematic headers
    const fetchUserProperties = useCallback(async (queryParams = {}, bustCache = false) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: '100',
                page: '1',
                ...queryParams
            });

            // Add cache busting parameter if needed
            if (bustCache) {
                params.append('_t', Date.now().toString());
            }

            // 🚀 FIXED: Removed problematic headers and use different cache busting approach
            const config = {
                // Use axios config instead of headers for cache control
                timeout: 10000,
                validateStatus: (status) => status >= 200 && status < 300
            };

            const response = await api.get(`/properties/my-properties?${params.toString()}`, config);

            if (response?.data?.success) {
                const properties = response.data.data.properties || [];
                setProperties(properties);

                // Clear any caches after successful fetch
                if (bustCache) {
                    invalidateAllCaches();
                }

                return {
                    properties,
                    pagination: response.data.data.pagination,
                    meta: { timestamp: Date.now() }
                };
            }

            throw new Error(response?.data?.message || 'Failed to fetch properties');

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch properties';
            setError(errorMessage);

            return {
                properties: [],
                pagination: null,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Add property
    const addProperty = useCallback(async (propertyData, gallery = []) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const imageFiles = extractFilesFromGallery(gallery);

            // Frontend validation
            const validation = validateAllPropertyFields(propertyData, {
                requireGallery: false,
                gallery: imageFiles,
                requireArea: propertyData.propertyType && propertyData.propertyType !== 'apartment'
            });

            if (!validation.isValid) {
                const errorMessage = validation.fieldErrors.map(err => err.message).join(', ');
                setSubmitError(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    fieldErrors: validation.fieldErrors,
                    validationErrors: validation.errors
                };
            }

            const formData = createPropertyFormData(propertyData, imageFiles);

            const response = await api.post('/properties/add-property', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.success) {
                // Force refresh with cache busting
                try {
                    await fetchUserProperties({}, true);
                    invalidateAnalyticsCache();
                } catch (fetchError) {
                    // Non-blocking error
                }

                return {
                    success: true,
                    message: response.data.message || 'Property added successfully!',
                    data: response.data,
                    imagesUploaded: imageFiles.length
                };
            }

            throw new Error(response.data?.message || 'Failed to add property');

        } catch (error) {
            let errorMessage = 'Failed to add property. Please try again.';
            let fieldErrors = [];
            let validationErrors = {};

            if (error.response?.status === 400 && error.response?.data?.errors) {
                const backendErrors = parseBackendErrors(error.response.data.errors);
                fieldErrors = backendErrors;
                backendErrors.forEach(err => {
                    validationErrors[err.field] = err.message;
                });
                errorMessage = backendErrors.map(err => err.message).join(', ');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setSubmitError(errorMessage);
            return {
                success: false,
                error: errorMessage,
                fieldErrors,
                validationErrors
            };
        } finally {
            setIsSubmitting(false);
        }
    }, [extractFilesFromGallery, createPropertyFormData, fetchUserProperties]);

    // Bulk status updates with immediate UI update and cache invalidation
    const updateMultiplePropertyStatuses = useCallback(async (updates) => {
        try {
            // Optimistically update local state immediately
            setProperties(prevProperties =>
                prevProperties.map(property => {
                    const update = updates.find(u => u.propertyId === property._id);
                    if (update) {
                        return {
                            ...property,
                            status: update.status,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return property;
                })
            );

            const BATCH_SIZE = 3;
            const batches = [];
            for (let i = 0; i < updates.length; i += BATCH_SIZE) {
                batches.push(updates.slice(i, i + BATCH_SIZE));
            }

            const successful = [];
            const failed = [];

            // Process batches sequentially
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                const promises = batch.map(({ propertyId, status }) =>
                    api.put(`/properties/${propertyId}/status`, { status })
                );

                const results = await Promise.allSettled(promises);

                results.forEach((result, batchIndex) => {
                    const update = batch[batchIndex];
                    if (result.status === 'fulfilled') {
                        successful.push({ ...update, result: result.value });
                    } else {
                        failed.push({ ...update, error: result.reason });
                    }
                });

                // Rate limiting delay
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // If there were failures, revert the optimistic updates for failed items
            if (failed.length > 0) {
                setTimeout(() => {
                    fetchUserProperties({}, true);
                }, 1000);
            } else {
                // All successful - invalidate caches and refresh data
                invalidateAllCaches();
                setTimeout(() => {
                    fetchUserProperties({}, true);
                }, 500);
            }

            return { successful, failed };

        } catch (error) {
            setTimeout(() => {
                fetchUserProperties({}, true);
            }, 1000);

            const errorMessage = error.response?.data?.message || error.message || 'Failed to update properties';
            return { successful: [], failed: updates, error: errorMessage };
        }
    }, [fetchUserProperties]);

    // Single property status update with cache invalidation
    const updatePropertyStatus = useCallback(async (propertyId, newStatus) => {
        // Optimistically update local state
        setProperties(prevProperties =>
            prevProperties.map(property => {
                if (property._id === propertyId) {
                    return {
                        ...property,
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                    };
                }
                return property;
            })
        );

        try {
            const response = await api.put(`/properties/${propertyId}/status`, { status: newStatus });

            if (response.data?.success) {
                // Success - invalidate caches and refresh
                invalidateAllCaches();
                setTimeout(() => {
                    fetchUserProperties({}, true);
                }, 500);

                return { success: true };
            } else {
                // API call succeeded but operation failed - revert optimistic update
                setTimeout(() => {
                    fetchUserProperties({}, true);
                }, 1000);

                return {
                    success: false,
                    error: response.data?.message || 'Update failed'
                };
            }
        } catch (error) {
            // API call failed - revert optimistic update
            setTimeout(() => {
                fetchUserProperties({}, true);
            }, 1000);

            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Update failed'
            };
        }
    }, [fetchUserProperties]);

    // Delete property
    const deleteProperty = useCallback(async (propertyId) => {
        try {
            const response = await api.delete(`/properties/${propertyId}`);

            if (response.data?.success) {
                // Optimistically remove from local state
                setProperties(prev => prev.filter(p => p._id !== propertyId));

                // Invalidate caches
                invalidateAllCaches();

                return { success: true, message: response.data.message };
            }

            return { success: false, error: response.data?.message || 'Failed to delete property' };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete property';
            return { success: false, error: errorMessage };
        }
    }, []);

    // Force refresh with cache busting
    const refreshProperties = useCallback((bustCache = true) => {
        return fetchUserProperties({}, bustCache);
    }, [fetchUserProperties]);

    // Utility functions
    const clearSubmitError = useCallback(() => setSubmitError(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        // State
        properties,
        loading,
        error,
        isSubmitting,
        submitError,

        // Actions
        addProperty,
        deleteProperty,
        fetchUserProperties,
        refreshProperties,
        updatePropertyStatus,
        updateMultiplePropertyStatuses,

        // Utils
        clearSubmitError,
        clearError
    };
};