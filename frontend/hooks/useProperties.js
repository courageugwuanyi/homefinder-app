import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProperties = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Add property function
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
    }, []);

    const clearSubmitError = useCallback(() => {
        setSubmitError(null);
    }, []);

    return {
        addProperty,
        isSubmitting,
        submitError,
        clearSubmitError
    };
};