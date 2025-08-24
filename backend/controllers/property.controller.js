import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import logger from '../config/logger.js';
import { validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Property validation failed', { errors: errors.array() });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(({ path, msg, value }) => ({
                field: path,
                message: msg,
                value,
            })),
        });
    }
    return null;
};

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (file, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: resourceType,
            folder: 'real-estate/properties',
            transformation: resourceType === 'image' ? [
                { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
                { format: 'auto' }
            ] : [
                { width: 1920, height: 1080, crop: 'fill', quality: 'auto' }
            ],
            ...(resourceType === 'video' && {
                eager: [
                    { width: 400, height: 300, crop: 'fill', format: 'jpg' }
                ]
            })
        };
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(file.buffer);
    });
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        logger.info('File deleted from Cloudinary', { publicId });
    } catch (error) {
        logger.error('Error deleting from Cloudinary:', error);
    }
};

// Helper function to process media files
const processMediaFiles = async (files) => {
    const media = {
        images: [],
        videos: []
    };

    if (!files || files.length === 0) {
        return media;
    }

    const uploadPromises = files.map(async (file, index) => {
        try {
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');

            if (!isImage && !isVideo) {
                logger.warn('Invalid file type uploaded', { mimetype: file.mimetype });
                return null;
            }

            const maxImageSize = 10 * 1024 * 1024; // 10MB
            const maxVideoSize = 100 * 1024 * 1024; // 100MB

            if (isImage && file.size > maxImageSize) {
                throw new Error('Image file too large. Maximum size is 10MB');
            }
            if (isVideo && file.size > maxVideoSize) {
                throw new Error('Video file too large. Maximum size is 100MB');
            }

            const resourceType = isImage ? 'image' : 'video';
            const uploadResult = await uploadToCloudinary(file, resourceType);

            const fileData = {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                width: uploadResult.width,
                height: uploadResult.height,
                isPrimary: index === 0,
                uploadedAt: new Date()
            };

            if (isVideo && uploadResult.eager && uploadResult.eager[0]) {
                fileData.thumbnail = uploadResult.eager[0].secure_url;
                fileData.thumbnailPublicId = uploadResult.eager[0].public_id;
            }

            return {
                type: resourceType,
                data: fileData
            };
        } catch (error) {
            logger.error('Error processing media file:', error);
            throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
        }
    });

    try {
        const results = await Promise.all(uploadPromises);
        results.forEach(result => {
            if (result) {
                if (result.type === 'image') {
                    media.images.push(result.data);
                } else if (result.type === 'video') {
                    media.videos.push(result.data);
                }
            }
        });
        return media;
    } catch (error) {
        logger.error('Media processing failed, cleaning up uploads');
        throw error;
    }
};

// All-in-One Property Stats (Single API Call)
export const getAllPropertyStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const startTime = Date.now();

        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const statsAggregation = await Property.aggregate([
            { $match: { agent: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$analytics.views' },
                    totalViewsThisMonth: { $sum: '$analytics.viewsThisMonth' },
                    avgViews: { $avg: '$analytics.views' }
                }
            }
        ]);

        const defaultStats = {
            count: 0,
            totalViews: 0,
            monthlyViews: 0,
            avgViews: 0
        };

        const stats = {
            draft: { ...defaultStats },
            published: { ...defaultStats },
            archived: { ...defaultStats }
        };

        statsAggregation.forEach(stat => {
            if (stats[stat._id]) {
                stats[stat._id] = {
                    count: stat.count,
                    totalViews: stat.totalViews || 0,
                    monthlyViews: stat.totalViewsThisMonth || 0,
                    avgViews: Math.round(stat.avgViews || 0)
                };
            }
        });

        const totals = {
            totalProperties: Object.values(stats).reduce((sum, stat) => sum + stat.count, 0),
            totalViews: Object.values(stats).reduce((sum, stat) => sum + stat.totalViews, 0),
            totalMonthlyViews: Object.values(stats).reduce((sum, stat) => sum + stat.monthlyViews, 0)
        };

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                draft: {
                    count: stats.draft.count,
                    totalViews: stats.draft.totalViews
                },
                published: {
                    count: stats.published.count,
                    totalViews: stats.published.totalViews,
                    monthlyViews: stats.published.monthlyViews
                },
                archived: {
                    count: stats.archived.count,
                    totalViews: stats.archived.totalViews
                },
                totals,
                meta: {
                    responseTime: `${responseTime}ms`,
                    timestamp: new Date().toISOString()
                }
            }
        });

        logger.info('All property stats fetched', {
            userId,
            responseTime: `${responseTime}ms`,
            totalProperties: totals.totalProperties
        });

    } catch (error) {
        logger.error('Get all property stats error:', error);

        res.status(200).json({
            success: true,
            data: {
                draft: { count: 0, totalViews: 0 },
                published: { count: 0, totalViews: 0, monthlyViews: 0 },
                archived: { count: 0, totalViews: 0 },
                totals: {
                    totalProperties: 0,
                    totalViews: 0,
                    totalMonthlyViews: 0
                },
                meta: {
                    error: 'Stats temporarily unavailable',
                    timestamp: new Date().toISOString()
                }
            }
        });
    }
};

// Individual Property Stats (Fallback)
export const getPropertyStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;
        const startTime = Date.now();

        const query = { agent: userId };
        if (status) query.status = status;

        const [result] = await Property.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalViews: { $sum: '$analytics.views' },
                    totalViewsThisMonth: { $sum: '$analytics.viewsThisMonth' },
                    avgViews: { $avg: '$analytics.views' }
                }
            }
        ]);

        const stats = result || {
            count: 0,
            totalViews: 0,
            totalViewsThisMonth: 0,
            avgViews: 0
        };

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                count: stats.count,
                totalViews: stats.totalViews,
                monthlyViews: stats.totalViewsThisMonth,
                avgViews: Math.round(stats.avgViews || 0)
            },
            meta: {
                responseTime: `${responseTime}ms`,
                status: status || 'all'
            }
        });

        logger.info('Property stats fetched', {
            userId,
            status,
            responseTime: `${responseTime}ms`
        });

    } catch (error) {
        logger.error('Get property stats error:', error);
        next(error);
    }
};

// Property Counts
export const getPropertyCounts = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const startTime = Date.now();

        const countsAggregation = await Property.aggregate([
            { $match: { agent: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts = {
            draft: 0,
            published: 0,
            archived: 0
        };

        countsAggregation.forEach(item => {
            if (counts.hasOwnProperty(item._id)) {
                counts[item._id] = item.count;
            }
        });

        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                ...counts,
                total
            },
            meta: {
                responseTime: `${responseTime}ms`
            }
        });

        logger.info('Property counts fetched', {
            userId,
            total,
            responseTime: `${responseTime}ms`
        });

    } catch (error) {
        logger.error('Get property counts error:', error);
        next(error);
    }
};

// Add Property
export const addProperty = async (req, res, next) => {
    let uploadedFiles = [];
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            logger.warn('Property add attempt by non-existent user', { userId });
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.canAddProperties) {
            logger.warn('Property add attempt by unauthorized user', {
                userId,
                accountType: user.accountType,
                propertiesCount: user.activity.propertiesCount,
                limit: user.subscription.propertiesLimit
            });
            return res.status(403).json({
                success: false,
                message: 'You cannot add properties. Please upgrade your account.',
                code: 'PROPERTIES_LIMIT_REACHED',
                data: {
                    count: user.activity.propertiesCount,
                    limit: user.subscription.propertiesLimit,
                    accountType: user.accountType
                }
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image or video is required'
            });
        }

        const {
            title, description, category, propertyType, businessType,
            country, city, district, zipCode, address,
            area, bedrooms, bathrooms, toilets, parking, floors, units, isServiced, amenities,
            price, currency, priceUnit,
            phone, company
        } = req.body;

        let processedAmenities = [];
        if (amenities) {
            try {
                processedAmenities = typeof amenities === 'string'
                    ? JSON.parse(amenities)
                    : amenities;
            } catch (error) {
                logger.warn('Invalid amenities format', { amenities });
                processedAmenities = [];
            }
        }

        const media = await processMediaFiles(req.files);

        uploadedFiles = [
            ...media.images.map(img => ({ publicId: img.publicId, type: 'image' })),
            ...media.videos.map(vid => ({ publicId: vid.publicId, type: 'video' })),
            ...media.videos.filter(vid => vid.thumbnailPublicId).map(vid => ({
                publicId: vid.thumbnailPublicId,
                type: 'image'
            }))
        ];

        if (media.images.length === 0 && media.videos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload media files. Please try again.'
            });
        }

        const propertyData = {
            title: title.trim(),
            description: description.trim(),
            category: category.toLowerCase(),
            propertyType: propertyType.toLowerCase(),
            businessType,
            location: {
                country: country.trim(),
                city: city.trim(),
                district: district.trim(),
                zipCode: zipCode.trim().toUpperCase(),
                address: address.trim()
            },
            specifications: {
                ...(area && { area: parseInt(area) }),
                ...(bedrooms && { bedrooms }),
                ...(bathrooms && { bathrooms }),
                ...(toilets && { toilets }),
                ...(parking && { parking }),
                ...(floors && { floors }),
                ...(units && { units }),
                isServiced: isServiced === 'true' || isServiced === true,
                amenities: processedAmenities
            },
            pricing: {
                amount: parseInt(price),
                currency: currency.toLowerCase(),
                priceUnit: category.toLowerCase() === 'sale' ? 'total' : priceUnit
            },
            media,
            agent: userId,
            contact: {
                phone: phone.trim(),
                ...(company && { company: company.trim() })
            },
            status: 'draft',
            marketStatus: 'available'
        };

        const newProperty = await Property.create(propertyData);
        await user.incrementPropertiesCount();

        logger.info('Property created successfully', {
            propertyId: newProperty._id,
            userId,
            adNumber: newProperty.adNumber,
            mediaCount: {
                images: media.images.length,
                videos: media.videos.length
            }
        });

        res.status(201).json({
            success: true,
            message: 'Property added successfully',
            data: {
                property: {
                    _id: newProperty._id,
                    title: newProperty.title,
                    category: newProperty.category,
                    propertyType: newProperty.propertyType,
                    adNumber: newProperty.adNumber,
                    slug: newProperty.seo.slug,
                    status: newProperty.status,
                    marketStatus: newProperty.marketStatus,
                    pricing: newProperty.pricing,
                    location: newProperty.location,
                    primaryImage: newProperty.primaryImage,
                    mediaCount: {
                        images: media.images.length,
                        videos: media.videos.length
                    },
                    createdAt: newProperty.createdAt
                }
            }
        });

    } catch (error) {
        logger.error('Add property error:', error);

        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(async (file) => {
                await deleteFromCloudinary(file.publicId, file.type);
            });
        }

        if (error.message.includes('Failed to upload')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A property with similar details already exists'
            });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(({ path, message }) => ({
                field: path,
                message,
            }));
            return res.status(400).json({
                success: false,
                message: 'Property validation failed',
                errors: validationErrors,
            });
        }

        next(error);
    }
};

// Get User Properties
export const getUserProperties = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 100, status, marketStatus, category } = req.query;
        const startTime = Date.now();

        const query = { agent: userId };
        if (status) query.status = status;
        if (marketStatus) query.marketStatus = marketStatus;
        if (category) query.category = category;

        const [properties, total] = await Promise.all([
            Property.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .select(`
                    title description category propertyType businessType
                    location pricing specifications media
                    status marketStatus featured verified
                    analytics contact adNumber seo
                    createdAt updatedAt
                `)
                .lean(),
            Property.countDocuments(query)
        ]);

        const responseTime = Date.now() - startTime;

        res.set({
            'Cache-Control': 'private, max-age=300',
            'ETag': `W/"${userId}-${page}-${limit}-${Date.now()}"`
        });

        res.json({
            success: true,
            data: {
                properties,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit),
                    total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            },
            meta: {
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString()
            }
        });

        logger.info('User properties fetched', {
            userId,
            count: properties.length,
            responseTime: `${responseTime}ms`
        });

    } catch (error) {
        logger.error('Get user properties error:', error);
        next(error);
    }
};

// Get Single Property (with ObjectId validation)
export const getProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        const property = await Property.findById(propertyId)
            .populate('agent', 'fullName email phoneNumber businessInfo.companyName activity.averageRating activity.totalReviews')
            .select('-__v');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (property.status === 'published') {
            await property.incrementViews();
        }

        res.json({
            success: true,
            data: {
                property
            }
        });

        logger.info('Property viewed', { propertyId, agentId: property.agent._id });

    } catch (error) {
        logger.error('Get property error:', error);
        next(error);
    }
};

// Promote Property
export const promoteProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { promoted } = req.body;
        const userId = req.user._id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        const property = await Property.findOne({
            _id: propertyId,
            agent: userId
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to update it'
            });
        }

        if (property.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Only published properties can be promoted'
            });
        }

        property.featured = promoted;
        property.promotionDate = promoted ? new Date() : null;

        await property.save();

        logger.info('Property promotion updated', {
            propertyId,
            userId,
            promoted,
            title: property.title
        });

        res.json({
            success: true,
            message: `Property ${promoted ? 'promoted' : 'promotion removed'} successfully`,
            data: {
                property: {
                    _id: property._id,
                    title: property.title,
                    featured: property.featured,
                    promotionDate: property.promotionDate
                }
            }
        });

    } catch (error) {
        logger.error('Promote property error:', error);
        next(error);
    }
};

// Update Property Status
export const updatePropertyStatus = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { status, marketStatus } = req.body;
        const userId = req.user._id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        const property = await Property.findOne({
            _id: propertyId,
            agent: userId
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to update it'
            });
        }

        if (status) property.status = status;
        if (marketStatus) property.marketStatus = marketStatus;

        await property.save();

        logger.info('Property status updated', { propertyId, userId, status, marketStatus });

        res.json({
            success: true,
            message: 'Property status updated successfully',
            data: {
                property: {
                    _id: property._id,
                    status: property.status,
                    marketStatus: property.marketStatus
                }
            }
        });

    } catch (error) {
        logger.error('Update property status error:', error);
        next(error);
    }
};

// Search Properties
export const searchProperties = async (req, res, next) => {
    try {
        const {
            category, propertyType, minPrice, maxPrice, currency = 'ngn',
            bedrooms, bathrooms, country, city, district,
            page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc'
        } = req.query;

        const query = {
            status: 'published',
            marketStatus: 'available'
        };

        if (category) query.category = category.toLowerCase();
        if (propertyType) query.propertyType = propertyType.toLowerCase();
        if (bedrooms) query['specifications.bedrooms'] = bedrooms;
        if (bathrooms) query['specifications.bathrooms'] = bathrooms;
        if (country) query['location.country'] = new RegExp(country, 'i');
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (district) query['location.district'] = new RegExp(district, 'i');

        if (minPrice || maxPrice) {
            query['pricing.currency'] = currency.toLowerCase();
            if (minPrice) query['pricing.amount'] = { $gte: parseInt(minPrice) };
            if (maxPrice) {
                query['pricing.amount'] = {
                    ...query['pricing.amount'],
                    $lte: parseInt(maxPrice)
                };
            }
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [properties, total] = await Promise.all([
            Property.find(query)
                .populate('agent', 'fullName businessInfo.companyName activity.averageRating')
                .sort(sortOptions)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .select('-agent.email -agent.phoneNumber -__v')
                .lean(),
            Property.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                properties,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit),
                    total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

        logger.info('Property search performed', {
            query: Object.keys(query),
            resultsCount: properties.length
        });

    } catch (error) {
        logger.error('Search properties error:', error);
        next(error);
    }
};

// Update Property Media
export const updatePropertyMedia = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { removeImages = [], removeVideos = [] } = req.body;
        const userId = req.user._id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        const property = await Property.findOne({
            _id: propertyId,
            agent: userId
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to update it'
            });
        }

        let updatedMedia = { ...property.media };

        if (removeImages.length > 0) {
            const imagesToRemove = updatedMedia.images.filter(img =>
                removeImages.includes(img.publicId)
            );

            for (const img of imagesToRemove) {
                await deleteFromCloudinary(img.publicId, 'image');
            }

            updatedMedia.images = updatedMedia.images.filter(img =>
                !removeImages.includes(img.publicId)
            );
        }

        if (removeVideos.length > 0) {
            const videosToRemove = updatedMedia.videos.filter(vid =>
                removeVideos.includes(vid.publicId)
            );

            for (const vid of videosToRemove) {
                await deleteFromCloudinary(vid.publicId, 'video');
                if (vid.thumbnailPublicId) {
                    await deleteFromCloudinary(vid.thumbnailPublicId, 'image');
                }
            }

            updatedMedia.videos = updatedMedia.videos.filter(vid =>
                !removeVideos.includes(vid.publicId)
            );
        }

        if (req.files && req.files.length > 0) {
            const newMedia = await processMediaFiles(req.files);
            updatedMedia.images.push(...newMedia.images);
            updatedMedia.videos.push(...newMedia.videos);
        }

        if (updatedMedia.images.length === 0 && updatedMedia.videos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Property must have at least one image or video'
            });
        }

        property.media = updatedMedia;
        await property.save();

        logger.info('Property media updated', {
            propertyId,
            userId,
            mediaCount: {
                images: updatedMedia.images.length,
                videos: updatedMedia.videos.length
            }
        });

        res.json({
            success: true,
            message: 'Property media updated successfully',
            data: {
                mediaCount: {
                    images: updatedMedia.images.length,
                    videos: updatedMedia.videos.length
                }
            }
        });

    } catch (error) {
        logger.error('Update property media error:', error);
        next(error);
    }
};

// Delete Property
export const deleteProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user._id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        const property = await Property.findOneAndDelete({
            _id: propertyId,
            agent: userId
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to delete it'
            });
        }

        const deletePromises = [];
        property.media.images.forEach(image => {
            deletePromises.push(deleteFromCloudinary(image.publicId, 'image'));
        });

        property.media.videos.forEach(video => {
            deletePromises.push(deleteFromCloudinary(video.publicId, 'video'));
            if (video.thumbnailPublicId) {
                deletePromises.push(deleteFromCloudinary(video.thumbnailPublicId, 'image'));
            }
        });

        Promise.all(deletePromises).catch(error => {
            logger.error('Error cleaning up Cloudinary files:', error);
        });

        const user = await User.findById(userId);
        if (user) {
            await user.decrementPropertiesCount();
        }

        logger.info('Property deleted', {
            propertyId,
            userId,
            mediaFilesDeleted: property.media.images.length + property.media.videos.length
        });

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });

    } catch (error) {
        logger.error('Delete property error:', error);
        next(error);
    }
};