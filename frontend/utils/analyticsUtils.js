import api from '../services/api';

// Configuration
const RATE_LIMIT_DELAY = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CACHE_DURATION = 30000; // 30 seconds

// Cache variables
let analyticsCache = null;
let cacheTimestamp = null;
let propertiesCache = null;
let propertiesCacheTimestamp = null;

// Helpers
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (requestFn, retries = MAX_RETRIES) => {
    try {
        return await requestFn();
    } catch (error) {
        if (retries > 0 && (error.response?.status === 429 || error.code === 'NETWORK_ERROR')) {
            await delay(RETRY_DELAY);
            return retryRequest(requestFn, retries - 1);
        }
        throw error;
    }
};

// Single API call for analytics without problematic headers
export const fetchTabAnalytics = async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && analyticsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        return analyticsCache;
    }

    try {
        const timestamp = Date.now();
        const response = await retryRequest(() =>
            api.get('/properties/my-properties/stats', {
                params: {
                    _t: timestamp,
                    _cache: 'no-cache'
                }
            })
        );

        if (response.data?.success && response.data?.data) {
            const data = response.data.data;
            const result = {
                draft: {
                    count: data.draft?.count || 0,
                    totalViews: data.draft?.totalViews || 0
                },
                published: {
                    count: data.published?.count || 0,
                    totalViews: data.published?.totalViews || 0,
                    monthlyViews: data.published?.monthlyViews || 0
                },
                archived: {
                    count: data.archived?.count || 0,
                    totalViews: data.archived?.totalViews || 0
                }
            };

            // Cache the results
            analyticsCache = result;
            cacheTimestamp = now;
            return result;
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.warn('Analytics fetch failed:', error.message);
        // Return cached data if available, otherwise defaults
        if (analyticsCache && !forceRefresh) {
            return analyticsCache;
        }

        return {
            draft: { count: 0, totalViews: 0 },
            published: { count: 0, totalViews: 0, monthlyViews: 0 },
            archived: { count: 0, totalViews: 0 }
        };
    }
};

// Image preloading
export const preloadPropertyImages = async (properties, maxConcurrent = 3) => {
    if (!properties || properties.length === 0) return;

    const images = properties
        .flatMap(property => property.images || [])
        .filter(img => img && (img[0] || img.url))
        .map(img => img[0] || img.url);

    if (images.length === 0) return;

    const processBatch = async (batch) => {
        const promises = batch.map(async (imageUrl, index) => {
            try {
                await delay(index * 50);
                const image = new Image();
                image.src = imageUrl;
                return image.decode();
            } catch (error) {
                // Silent fail for image preloading
                return null;
            }
        });

        return Promise.allSettled(promises);
    };

    const batches = [];
    for (let i = 0; i < images.length; i += maxConcurrent) {
        batches.push(images.slice(i, i + maxConcurrent));
    }

    try {
        for (let i = 0; i < batches.length; i++) {
            await processBatch(batches[i]);
            if (i < batches.length - 1) {
                await delay(200);
            }
        }
    } catch (error) {
        // Silent fail for image preloading
        console.warn('Image preloading failed:', error.message);
    }
};

// Batch operations
export const batchPropertyOperations = async (operations, maxConcurrent = 2) => {
    if (!operations || operations.length === 0) {
        return [];
    }

    const processBatch = async (batch) => {
        const promises = batch.map(async (operation, index) => {
            try {
                await delay(index * 100);

                // Add cache-busting to URL
                const timestamp = Date.now();
                const url = operation.url + (operation.url.includes('?') ? '&' : '?') + `_t=${timestamp}`;

                const response = await retryRequest(() =>
                    api[operation.method](url, operation.data)
                );

                return {
                    status: 'fulfilled',
                    value: { success: true, operation, response }
                };
            } catch (error) {
                console.error('Batch operation failed:', error.message);
                return {
                    status: 'rejected',
                    value: { success: false, operation, error }
                };
            }
        });

        return Promise.allSettled(promises);
    };

    const batches = [];
    for (let i = 0; i < operations.length; i += maxConcurrent) {
        batches.push(operations.slice(i, i + maxConcurrent));
    }

    const results = [];
    for (let i = 0; i < batches.length; i++) {
        const batchResults = await processBatch(batches[i]);
        results.push(...batchResults);

        if (i < batches.length - 1) {
            await delay(RATE_LIMIT_DELAY);
        }
    }

    return results;
};

// Cache invalidation functions
export const invalidateAnalyticsCache = () => {
    analyticsCache = null;
    cacheTimestamp = null;
};

export const invalidatePropertiesCache = () => {
    propertiesCache = null;
    propertiesCacheTimestamp = null;
};

export const invalidateAllCaches = () => {
    invalidateAnalyticsCache();
    invalidatePropertiesCache();
};

// Force refresh analytics
export const refreshAnalytics = async (delay = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    invalidateAnalyticsCache();
    return fetchTabAnalytics(true);
};