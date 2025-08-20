import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true,
        minLength: [5, 'Title must be at least 5 characters'],
        maxLength: [100, 'Title cannot exceed 100 characters'],
        index: 'text'
    },

    description: {
        type: String,
        required: [true, 'Property description is required'],
        trim: true,
        minLength: [20, 'Description must be at least 20 characters'],
        maxLength: [1500, 'Description cannot exceed 1500 characters']
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
                'apartment', 'duplex', 'house', 'bungalow',
                'office', 'shop', 'warehouse', 'commercial',
                'plot', 'land', 'farm',
                'hotel', 'event-centre'
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
            values: ['Business', 'Private seller'],
            message: 'Business type must be Business or Private seller'
        },
        default: 'Private seller'
    },

    // Location Information
    location: {
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            index: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            index: true
        },
        district: {
            type: String,
            required: [true, 'District is required'],
            trim: true,
            index: true
        },
        zipCode: {
            type: String,
            required: [true, 'Zip code is required'],
            trim: true,
            uppercase: true
        },
        address: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        }
    },

    // Property Specifications
    specifications: {
        area: {
            type: Number,
            min: [1, 'Area must be positive'],
            validate: {
                validator: function(area) {
                    const areaRequiredTypes = ['duplex', 'bungalow', 'house', 'office', 'shop',
                        'warehouse', 'commercial', 'plot', 'land', 'farm',
                        'hotel', 'event-centre'];
                    if (areaRequiredTypes.includes(this.propertyType)) {
                        return area && area > 0;
                    }
                    return true;
                },
                message: 'Area is required for this property type'
            }
        },

        bedrooms: {
            type: String,
            enum: ['studio', '1', '2', '3', '4', '5+'],
            validate: {
                validator: function(bedrooms) {
                    const bedroomRequiredTypes = ['apartment', 'duplex', 'bungalow', 'house'];
                    if (bedroomRequiredTypes.includes(this.propertyType)) {
                        return bedrooms && bedrooms.length > 0;
                    }
                    return true;
                },
                message: 'Bedrooms specification is required for residential properties'
            },
            index: true
        },

        bathrooms: {
            type: String,
            enum: ['1', '2', '3', '4', '5+'],
            validate: {
                validator: function(bathrooms) {
                    const bathroomRequiredTypes = ['apartment', 'duplex', 'bungalow', 'house',
                        'office', 'shop', 'warehouse', 'commercial',
                        'hotel', 'event-centre'];
                    if (bathroomRequiredTypes.includes(this.propertyType)) {
                        return bathrooms && bathrooms.length > 0;
                    }
                    return true;
                },
                message: 'Bathrooms specification is required for this property type'
            }
        },

        toilets: {
            type: String,
            enum: ['1', '2', '3', '4', '5+'],
            validate: {
                validator: function(toilets) {
                    const toiletRequiredTypes = ['apartment', 'duplex', 'bungalow', 'house',
                        'office', 'shop', 'warehouse', 'commercial',
                        'hotel', 'event-centre'];
                    if (toiletRequiredTypes.includes(this.propertyType)) {
                        return toilets && toilets.length > 0;
                    }
                    return true;
                },
                message: 'Toilets specification is required for this property type'
            }
        },

        parking: {
            type: String,
            enum: ['1', '2', '3', '4+'],
            validate: {
                validator: function(parking) {
                    const parkingRequiredTypes = ['apartment', 'duplex', 'bungalow', 'house',
                        'office', 'shop', 'warehouse', 'commercial',
                        'hotel', 'event-centre'];
                    if (parkingRequiredTypes.includes(this.propertyType)) {
                        return parking && parking.length > 0;
                    }
                    return true;
                },
                message: 'Parking specification is required for this property type'
            }
        },

        floors: {
            type: String,
            enum: ['1', '2', '3', '4+']
        },

        units: {
            type: String,
            enum: ['1-5', '6-10', '11-20', '20+']
        },

        isServiced: {
            type: Boolean,
            default: false,
            validate: {
                validator: function(isServiced) {
                    if (this.category === 'sale') {
                        return !isServiced;
                    }
                    return true;
                },
                message: 'Serviced option not applicable for sale properties'
            }
        },

        amenities: [{
            type: String,
            trim: true
        }]
    },

    // Pricing Information
    pricing: {
        amount: {
            type: Number,
            required: [true, 'Price amount is required'],
            min: [1, 'Price must be positive'],
            index: true
        },

        currency: {
            type: String,
            required: [true, 'Currency is required'],
            enum: {
                values: ['ngn', 'usd'],
                message: 'Currency must be NGN or USD'
            },
            lowercase: true,
            default: 'ngn'
        },

        priceUnit: {
            type: String,
            required: function() {
                return this.category !== 'sale';
            },
            enum: {
                values: ['hour', 'day', 'week', 'month', 'year', 'total'],
                message: 'Invalid price unit'
            },
            default: function() {
                return this.category === 'sale' ? 'total' : 'month';
            },
            validate: {
                validator: function(priceUnit) {
                    if (this.category === 'sale') {
                        return priceUnit === 'total';
                    }
                    return ['hour', 'day', 'week', 'month', 'year'].includes(priceUnit);
                },
                message: 'Price unit must be "total" for sale properties'
            }
        },

        negotiable: {
            type: Boolean,
            default: true
        }
    },

    // Media Files
    media: {
        images: [{
            url: {
                type: String,
                required: true
            },
            filename: String,
            isPrimary: {
                type: Boolean,
                default: false
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],

        videos: [{
            url: {
                type: String,
                required: true
            },
            filename: String,
            thumbnail: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },

    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Agent is required'],
        index: true
    },

    // Contact Information
    contact: {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            validate: {
                validator: function(phone) {
                    return /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone);
                },
                message: 'Invalid phone number format'
            }
        },
        company: {
            type: String,
            trim: true,
            validate: {
                validator: function(company) {
                    if (this.businessType === 'Business') {
                        return company && company.trim().length > 0;
                    }
                    return true;
                },
                message: 'Company name is required for registered businesses'
            }
        }
    },

    // Property Status & Management
    status: {
        type: String,
        enum: {
            values: ['draft', 'published', 'archived', 'suspended'],
            message: 'Invalid property status'
        },
        default: 'published',
        index: true
    },

    marketStatus: {
        type: String,
        enum: {
            values: ['available', 'rented', 'sold', 'under-negotiation', 'withdrawn'],
            message: 'Invalid market status'
        },
        default: 'available',
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
            month: String,
            views: Number
        }]
    },

    // SEO & Search
    seo: {
        slug: {
            type: String,
            unique: true,
            sparse: true
        },
        keywords: [String]
    },

    // System fields
    adNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXES
propertySchema.index({ category: 1, propertyType: 1 });
propertySchema.index({ 'location.country': 1, 'location.city': 1, 'location.district': 1 });
propertySchema.index({ 'pricing.amount': 1, 'pricing.currency': 1 });
propertySchema.index({ 'specifications.bedrooms': 1, 'specifications.bathrooms': 1 });
propertySchema.index({ status: 1, marketStatus: 1, featured: -1, createdAt: -1 });
propertySchema.index({ agent: 1, status: 1 });

// Text search index
propertySchema.index({
    title: 'text',
    description: 'text',
    'location.district': 'text',
    'location.city': 'text'
});

// VIRTUALS
propertySchema.virtual('fullAddress').get(function() {
    const { address, district, city, zipCode, country } = this.location;
    return [address, district, city, zipCode, country].filter(Boolean).join(', ');
});

propertySchema.virtual('primaryImage').get(function() {
    const primaryImg = this.media.images?.find(img => img.isPrimary);
    return primaryImg?.url || this.media.images?.[0]?.url || null;
});

propertySchema.virtual('formattedPrice').get(function() {
    const symbol = this.pricing.currency === 'usd' ? '$' : '₦';
    const amount = this.pricing.amount.toLocaleString();
    const unit = this.pricing.priceUnit !== 'total' ? `/${this.pricing.priceUnit}` : '';
    return `${symbol}${amount}${unit}`;
});

propertySchema.virtual('isAvailable').get(function() {
    return this.status === 'published' && this.marketStatus === 'available';
});

// INSTANCE METHODS
propertySchema.methods.incrementViews = async function() {
    this.analytics.views += 1;
    this.analytics.viewsThisMonth += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

propertySchema.methods.updateMarketStatus = async function(newStatus) {
    this.marketStatus = newStatus;
    if (['sold', 'rented', 'withdrawn'].includes(newStatus)) {
        this.status = 'archived';
    }
    return this.save();
};

propertySchema.methods.generateSlug = function() {
    const baseSlug = `${this.title}-${this.location.city}-${this.location.district}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    this.seo.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
    return this.seo.slug;
};

// STATIC METHODS
propertySchema.statics.findAvailable = function() {
    return this.find({
        status: 'published',
        marketStatus: 'available'
    });
};

propertySchema.statics.findByAgent = function(agentId) {
    return this.find({ agent: agentId }).sort({ createdAt: -1 });
};

// MIDDLEWARE
// Generate ad number and slug
propertySchema.pre('save', async function(next) {
    if (this.isNew) {
        if (!this.adNumber) {
            const count = await mongoose.model('Property').countDocuments();
            this.adNumber = `HF${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
        }

        if (!this.seo.slug) {
            this.generateSlug();
        }
    }
    next();
});

propertySchema.pre('save', function(next) {
    if (this.media.images && this.media.images.length > 0) {
        const hasPrimary = this.media.images.some(img => img.isPrimary);
        if (!hasPrimary) {
            this.media.images[0].isPrimary = true;
        }
    }
    next();
});

const Property = mongoose.model('Property', propertySchema);

export default Property;