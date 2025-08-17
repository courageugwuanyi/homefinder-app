import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
    // Link to the main user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        unique: true,
        index: true
    },

    // Search & Interest Preferences
    searchPreferences: {
        // What they're looking for
        interestedIn: [{
            type: String,
            enum: ['rent', 'sale', 'shortlet'],
            default: []
        }],

        // Preferred property types (updated to match your Property model)
        propertyTypes: [{
            type: String,
            enum: [
                'apartment', 'duplex', 'house', 'bungalow',
                'office', 'shop', 'warehouse', 'commercial',
                'plot', 'land', 'farm', 'hotel', 'event-centre'
            ],
            default: []
        }],

        // Budget range
        budget: {
            min: {
                type: Number,
                min: 0,
                default: 0
            },
            max: {
                type: Number,
                min: 0,
                validate: {
                    validator: function(v) {
                        return !v || v >= this.budget?.min || 0;
                    },
                    message: 'Maximum budget must be greater than minimum budget'
                }
            },
            currency: {
                type: String,
                enum: ['ngn', 'usd'], // Updated to match Property model
                default: 'ngn'
            }
        },

        // Location preferences (updated structure)
        preferredLocations: [{
            country: String,
            city: String,
            district: String
        }],

        // Property specifications
        specifications: {
            bedrooms: {
                min: { type: String, enum: ['studio', '1', '2', '3', '4', '5+'], default: '1' },
                max: { type: String, enum: ['studio', '1', '2', '3', '4', '5+'], default: '5+' }
            },
            bathrooms: {
                min: { type: String, enum: ['1', '2', '3', '4', '5+'], default: '1' },
                max: { type: String, enum: ['1', '2', '3', '4', '5+'], default: '5+' }
            },
            parkingRequired: { type: Boolean, default: false },
            servicedProperty: { type: Boolean, default: false }
        },

        // Preferred amenities (updated from your Property model)
        preferredAmenities: [{
            type: String,
            trim: true
        }]
    },

    // Notification Preferences (consolidated from your User model)
    notificationPreferences: {
        email: {
            newListings: { type: Boolean, default: true },
            priceChanges: { type: Boolean, default: true },
            savedSearchAlerts: { type: Boolean, default: true },
            recommendations: { type: Boolean, default: true },
            newsletter: { type: Boolean, default: false },
            marketingEmails: { type: Boolean, default: false }
        },
        push: {
            newListings: { type: Boolean, default: false },
            priceChanges: { type: Boolean, default: false },
            savedSearchAlerts: { type: Boolean, default: false },
            recommendations: { type: Boolean, default: false }
        },
        sms: {
            urgentUpdates: { type: Boolean, default: false },
            priceAlerts: { type: Boolean, default: false }
        },
        frequency: {
            type: String,
            enum: ['immediate', 'daily', 'weekly', 'monthly'],
            default: 'weekly'
        }
    },

    // Wishlist (simple array instead of separate model)
    wishlist: [{
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            maxlength: 200
        }
    }],

    // Search behavior tracking (for AI recommendations)
    behaviorAnalytics: {
        mostViewedAreas: [String],
        mostViewedPropertyTypes: [String],
        averageTimeOnListings: {
            type: Number,
            default: 0
        },
        totalSearches: {
            type: Number,
            default: 0
        },
        lastSearchDate: Date,
        preferredContactMethod: {
            type: String,
            enum: ['phone', 'email', 'whatsapp'],
            default: 'email'
        }
    },

    // Privacy settings
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'agents-only', 'private'],
            default: 'agents-only'
        },
        showContactInfo: { type: Boolean, default: false },
        allowRecommendations: { type: Boolean, default: true },
        shareViewingHistory: { type: Boolean, default: false }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXES
userPreferenceSchema.index({ user: 1 });
userPreferenceSchema.index({ 'searchPreferences.preferredLocations.city': 1 });
userPreferenceSchema.index({ 'searchPreferences.budget.min': 1, 'searchPreferences.budget.max': 1 });
userPreferenceSchema.index({ 'searchPreferences.propertyTypes': 1 });
userPreferenceSchema.index({ 'wishlist.property': 1 });

// VIRTUALS
userPreferenceSchema.virtual('wishlistCount').get(function() {
    return this.wishlist ? this.wishlist.length : 0;
});

userPreferenceSchema.virtual('hasActivePreferences').get(function() {
    return this.searchPreferences.interestedIn.length > 0 ||
        this.searchPreferences.propertyTypes.length > 0 ||
        this.searchPreferences.preferredLocations.length > 0;
});

// INSTANCE METHODS
userPreferenceSchema.methods.addToWishlist = function(propertyId, notes = '') {
    // Check if property already in wishlist
    const existingIndex = this.wishlist.findIndex(
        item => item.property.toString() === propertyId.toString()
    );

    if (existingIndex === -1) {
        this.wishlist.push({
            property: propertyId,
            notes: notes.trim(),
            addedAt: new Date()
        });
    }

    return this.save();
};

userPreferenceSchema.methods.removeFromWishlist = function(propertyId) {
    this.wishlist = this.wishlist.filter(
        item => item.property.toString() !== propertyId.toString()
    );
    return this.save();
};

userPreferenceSchema.methods.updateSearchPreferences = function(newPreferences) {
    Object.assign(this.searchPreferences, newPreferences);
    return this.save();
};

userPreferenceSchema.methods.updateNotificationPreferences = function(newPreferences) {
    Object.assign(this.notificationPreferences, newPreferences);
    return this.save();
};

userPreferenceSchema.methods.trackSearch = async function(searchData) {
    this.behaviorAnalytics.totalSearches += 1;
    this.behaviorAnalytics.lastSearchDate = new Date();

    // Track location searches
    if (searchData.location) {
        if (!this.behaviorAnalytics.mostViewedAreas.includes(searchData.location)) {
            this.behaviorAnalytics.mostViewedAreas.push(searchData.location);
        }
    }

    // Track property type searches
    if (searchData.propertyType) {
        if (!this.behaviorAnalytics.mostViewedPropertyTypes.includes(searchData.propertyType)) {
            this.behaviorAnalytics.mostViewedPropertyTypes.push(searchData.propertyType);
        }
    }

    return this.save();
};

// STATIC METHODS
userPreferenceSchema.statics.getOrCreateForUser = async function(userId) {
    let preferences = await this.findOne({ user: userId });

    if (!preferences) {
        preferences = await this.create({
            user: userId,
            searchPreferences: {
                interestedIn: [],
                propertyTypes: [],
                budget: { min: 0, max: null, currency: 'ngn' },
                preferredLocations: [],
                specifications: {
                    bedrooms: { min: '1', max: '5+' },
                    bathrooms: { min: '1', max: '5+' },
                    parkingRequired: false,
                    servicedProperty: false
                },
                preferredAmenities: []
            }
        });
    }

    return preferences;
};

userPreferenceSchema.statics.findUsersInterestedIn = function(propertyData) {
    const query = {
        'searchPreferences.interestedIn': propertyData.category
    };

    if (propertyData.propertyType) {
        query['searchPreferences.propertyTypes'] = propertyData.propertyType;
    }

    return this.find(query)
        .populate('user', 'fullName email notificationPreferences')
        .where('notificationPreferences.email.newListings').equals(true);
};

const UserPreferences = mongoose.model('UserPreferences', userPreferenceSchema);

export default UserPreferences;