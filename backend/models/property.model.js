import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true,
        minLength: [5, 'Title must be at least 5 characters'],
        maxLength: [150, 'Title cannot exceed 150 characters'],
        index: 'text' // For text search
    },

    description: {
        type: String,
        required: [true, 'Property description is required'],
        trim: true,
        minLength: [20, 'Description must be at least 20 characters'],
        maxLength: [2000, 'Description cannot exceed 2000 characters']
    },

    // Property Classification
    category: {
        type: String,
        required: [true, 'Property category is required'],
        enum: {
            values: ['rent', 'sale', 'shortlet'],
            message: 'Category must be rent, sale, or shortlet'
        },
        lowercase: true,
        index: true
    },

    propertyType: {
        type: String,
        required: [true, 'Property type is required'],
        enum: {
            values: [
                'apartment', 'house', 'duplex', 'bungalow', 'mansion',
                'commercial', 'office', 'shop', 'warehouse',
                'land', 'plot', 'farm',
                'event-centre', 'hotel', 'other'
            ],
            message: 'Invalid property type'
        },
        lowercase: true,
        index: true
    },

    businessType: {
        type: String,
        required: [true, 'Business type is required'],
        enum: {
            values: ['business', 'private'],
            message: 'Business type must be business or private'
        },
        default: 'business',
        lowercase: true
    },

    // Location (Improved structure)
    location: {
        // Address components
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
            lowercase: true,
            index: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            lowercase: true,
            index: true
        },
        area: {
            type: String,
            required: [true, 'Area/Neighborhood is required'],
            trim: true,
            lowercase: true,
            index: true
        },
        streetAddress: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        postalCode: {
            type: String,
            trim: true,
            uppercase: true
        },

        // Geospatial data
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: [true, 'Coordinates are required'],
                validate: {
                    validator: function(coordinates) {
                        return coordinates.length === 2 &&
                            coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
                            coordinates[1] >= -90 && coordinates[1] <= 90;      // latitude
                    },
                    message: 'Invalid coordinates format'
                }
            }
        },

        // Additional location info
        landmarks: [String], // Nearby landmarks
        accessibility: {
            publicTransport: Boolean,
            mainRoad: Boolean,
            parking: Boolean
        }
    },

    // Property Specifications (Improved)
    specifications: {
        // Size information
        totalArea: {
            value: Number,
            unit: {
                type: String,
                enum: ['sqft', 'sqm', 'acres', 'hectares'],
                default: 'sqft'
            }
        },
        coveredArea: {
            value: Number,
            unit: {
                type: String,
                enum: ['sqft', 'sqm'],
                default: 'sqft'
            }
        },

        // Room details (Changed to Numbers for better filtering)
        bedrooms: {
            type: Number,
            required: [true, 'Number of bedrooms is required'],
            min: [0, 'Bedrooms cannot be negative'],
            max: [50, 'Too many bedrooms'],
            index: true
        },
        bathrooms: {
            type: Number,
            required: [true, 'Number of bathrooms is required'],
            min: [0, 'Bathrooms cannot be negative'],
            max: [50, 'Too many bathrooms'],
            index: true
        },
        toilets: {
            type: Number,
            required: [true, 'Number of toilets is required'],
            min: [0, 'Toilets cannot be negative'],
            max: [50, 'Too many toilets']
        },
        parkingSpots: {
            type: Number,
            required: [true, 'Number of parking spots is required'],
            min: [0, 'Parking spots cannot be negative'],
            max: [100, 'Too many parking spots'],
            default: 0
        },

        // Property features
        furnished: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished'],
            default: 'unfurnished'
        },

        condition: {
            type: String,
            enum: ['new', 'excellent', 'good', 'fair', 'needs-renovation'],
            default: 'good'
        },

        yearBuilt: {
            type: Number,
            min: [1800, 'Year built too old'],
            max: [new Date().getFullYear() + 2, 'Year built cannot be in far future']
        },

        // Amenities (Organized)
        amenities: {
            basic: [{
                type: String,
                enum: [
                    'electricity', 'water', 'internet', 'cable-tv',
                    'air-conditioning', 'heating', 'generator'
                ]
            }],
            security: [{
                type: String,
                enum: [
                    'security-guard', 'cctv', 'gate', 'fence',
                    'alarm-system', 'intercom'
                ]
            }],
            recreational: [{
                type: String,
                enum: [
                    'swimming-pool', 'gym', 'playground', 'garden',
                    'basketball-court', 'tennis-court', 'clubhouse'
                ]
            }],
            convenience: [{
                type: String,
                enum: [
                    'elevator', 'garage', 'storage', 'laundry',
                    'balcony', 'terrace', 'study-room'
                ]
            }]
        },

        // Pet policy
        petPolicy: {
            allowed: { type: Boolean, default: false },
            types: [{
                type: String,
                enum: ['cats', 'dogs', 'birds', 'small-pets']
            }],
            deposit: Number // Additional deposit for pets
        }
    },

    // Pricing (Enhanced)
    pricing: {
        amount: {
            type: Number,
            required: [true, 'Price amount is required'],
            min: [0, 'Price cannot be negative'],
            index: true
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            enum: {
                values: ['NGN', 'USD', 'EUR', 'GBP'],
                message: 'Invalid currency'
            },
            default: 'NGN',
            uppercase: true
        },
        period: {
            type: String,
            required: function() {
                return this.category === 'rent' || this.category === 'shortlet';
            },
            enum: {
                values: ['day', 'week', 'month', 'year'],
                message: 'Invalid price period'
            },
            lowercase: true
        },

        // Additional pricing info
        deposit: Number, // Security deposit
        commission: Number, // Agent commission
        serviceCharge: Number, // Annual service charge
        negotiable: { type: Boolean, default: true },

        // Price history for analytics
        priceHistory: [{
            amount: Number,
            currency: String,
            changedAt: { type: Date, default: Date.now },
            reason: String
        }]
    },

    // Media (Enhanced)
    media: {
        images: [{
            url: {
                type: String,
                required: true,
                validate: {
                    validator: function(url) {
                        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(url);
                    },
                    message: 'Invalid image URL format'
                }
            },
            caption: String,
            isPrimary: { type: Boolean, default: false },
            order: { type: Number, default: 0 }
        }],
        videos: [{
            url: {
                type: String,
                validate: {
                    validator: function(url) {
                        return /^https?:\/\/.+\.(mp4|avi|mov|webm)$/i.test(url);
                    },
                    message: 'Invalid video URL format'
                }
            },
            thumbnail: String,
            caption: String,
            duration: Number // in seconds
        }],
        virtualTour: String, // 360° tour URL
        floorPlan: String // Floor plan image URL
    },

    // Contact Information (Linked to User)
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Changed from 'RealEstateAgent' to 'User'
        required: [true, 'Agent is required'],
        index: true
    },

    // Additional contact for property
    contact: {
        name: String,
        phone: {
            type: String,
            validate: {
                validator: function(phone) {
                    return /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone);
                },
                message: 'Invalid phone number format'
            }
        },
        email: {
            type: String,
            validate: {
                validator: function(email) {
                    return /\S+@\S+\.\S+/.test(email);
                },
                message: 'Invalid email format'
            }
        },
        whatsapp: String,
        availableHours: {
            start: String, // e.g., "09:00"
            end: String,   // e.g., "18:00"
            timezone: { type: String, default: 'Africa/Lagos' }
        }
    },

    // Property Status & Management
    status: {
        type: String,
        enum: {
            values: ['draft', 'published', 'rented', 'sold', 'archived', 'suspended'],
            message: 'Invalid property status'
        },
        default: 'draft',
        index: true
    },

    featured: {
        type: Boolean,
        default: false,
        index: true
    },

    verified: {
        type: Boolean,
        default: false,
        index: true
    },

    // Analytics & Engagement
    analytics: {
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        lastViewed: Date,
        viewsThisMonth: { type: Number, default: 0 },
        monthlyViewHistory: [{
            month: String, // "2024-01"
            views: Number
        }]
    },

    // Property Management
    availability: {
        availableFrom: Date,
        availableUntil: Date, // For shortlets
        showingSchedule: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String,
            endTime: String
        }]
    },

    // SEO & Search
    seo: {
        slug: {
            type: String,
            unique: true,
            sparse: true // Allow null values but ensure uniqueness when present
        },
        metaDescription: String,
        keywords: [String]
    },

    // System fields
    adNumber: {
        type: String,
        unique: true,
        sparse: true // Will be generated automatically
    },

    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 } // TTL index for auto-deletion
    }

}, {
    timestamps: true,
    // Add virtual populate options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXES for optimal query performance
propertySchema.index({ category: 1, propertyType: 1 });
propertySchema.index({ 'location.state': 1, 'location.city': 1, 'location.area': 1 });
propertySchema.index({ 'pricing.amount': 1, 'pricing.currency': 1 });
propertySchema.index({ 'specifications.bedrooms': 1, 'specifications.bathrooms': 1 });
propertySchema.index({ status: 1, featured: -1, createdAt: -1 });
propertySchema.index({ agent: 1, status: 1 });
propertySchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index

// Text search index
propertySchema.index({
    title: 'text',
    description: 'text',
    'location.area': 'text',
    'seo.keywords': 'text'
});

// VIRTUALS
propertySchema.virtual('fullAddress').get(function() {
    return `${this.location.streetAddress}, ${this.location.area}, ${this.location.city}, ${this.location.state}`;
});

propertySchema.virtual('primaryImage').get(function() {
    const primaryImg = this.media.images.find(img => img.isPrimary);
    return primaryImg ? primaryImg.url : (this.media.images[0]?.url || null);
});

propertySchema.virtual('pricePerSqft').get(function() {
    if (this.specifications.totalArea?.value && this.pricing.amount) {
        return Math.round(this.pricing.amount / this.specifications.totalArea.value);
    }
    return null;
});

// METHODS
propertySchema.methods.incrementViews = async function() {
    this.analytics.views += 1;
    this.analytics.viewsThisMonth += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

propertySchema.methods.toggleFeatured = async function() {
    this.featured = !this.featured;
    return this.save();
};

propertySchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    return this.save();
};

propertySchema.methods.isAvailable = function() {
    return ['published'].includes(this.status);
};

propertySchema.methods.generateSlug = function() {
    const baseSlug = `${this.title}-${this.location.city}-${this.location.area}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    this.seo.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
    return this.seo.slug;
};

// MIDDLEWARE
// Generate ad number before saving
propertySchema.pre('save', async function(next) {
    if (this.isNew && !this.adNumber) {
        const count = await mongoose.model('Property').countDocuments();
        this.adNumber = `HF${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
    }

    if (this.isNew && !this.seo.slug) {
        this.generateSlug();
    }

    next();
});

// Update price history when price changes
propertySchema.pre('save', function(next) {
    if (this.isModified('pricing.amount') && !this.isNew) {
        this.pricing.priceHistory.push({
            amount: this.pricing.amount,
            currency: this.pricing.currency,
            reason: 'Price updated'
        });
    }
    next();
});

// STATIC METHODS
propertySchema.statics.findByLocation = function(state, city, area) {
    return this.find({
        'location.state': state?.toLowerCase(),
        'location.city': city?.toLowerCase(),
        ...(area && { 'location.area': area.toLowerCase() }),
        status: 'published'
    });
};

propertySchema.statics.findInPriceRange = function(min, max, currency = 'NGN') {
    return this.find({
        'pricing.amount': { $gte: min, $lte: max },
        'pricing.currency': currency,
        status: 'published'
    });
};

propertySchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
    return this.find({
        'location.coordinates': {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: maxDistance
            }
        },
        status: 'published'
    });
};

const Property = mongoose.model('Property', propertySchema);

export default Property;