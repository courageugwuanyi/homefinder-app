import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
    // Link to the main user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // What they're looking for
    interestedIn: [{
        type: String,
        enum: ['buy', 'rent', 'shortlet'],
        default: []
    }],

    // Where they want to look
    preferredLocations: [{
        type: String,
        trim: true
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
                    return !v || v >= this.budget.min;
                },
                message: 'Maximum budget must be greater than or equal to minimum budget'
            }
        },
        currency: {
            type: String,
            enum: ['NGN', 'USD', 'EUR', 'GBP'],
            default: 'NGN'
        }
    },

    // Property preferences
    propertyPreferences: {
        types: [{
            type: String,
            enum: ['apartment', 'house', 'condo', 'townhouse', 'duplex', 'land', 'commercial'],
            default: []
        }],
        bedrooms: {
            min: { type: Number, min: 0, default: 1 },
            max: { type: Number, min: 0, default: 10 }
        },
        bathrooms: {
            min: { type: Number, min: 0, default: 1 },
            max: { type: Number, min: 0, default: 10 }
        },
        furnishing: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished', 'any'],
            default: 'any'
        },
        amenities: [{
            type: String,
            enum: ['parking', 'gym', 'pool', 'security', 'generator', 'garden', 'balcony']
        }]
    },

    // Saved searches (for complex search criteria)
    savedSearches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SavedSearch'
    }],

    // Notification preferences
    notifications: {
        email: {
            newListings: { type: Boolean, default: true },
            priceChanges: { type: Boolean, default: true },
            savedSearchAlerts: { type: Boolean, default: true },
            newsletter: { type: Boolean, default: false }
        },
        push: {
            newListings: { type: Boolean, default: false },
            priceChanges: { type: Boolean, default: false },
            savedSearchAlerts: { type: Boolean, default: false }
        },
        frequency: {
            type: String,
            enum: ['immediate', 'daily', 'weekly', 'monthly'],
            default: 'weekly'
        }
    },

    // Search behavior tracking (for recommendations)
    searchBehavior: {
        mostViewedAreas: [String],
        averageTimeOnListings: Number,
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
        allowRecommendations: { type: Boolean, default: true }
    }

}, {
    timestamps: true
});

// Indexes for better query performance
userPreferenceSchema.index({ userId: 1 });
userPreferenceSchema.index({ 'preferredLocations': 1 });
userPreferenceSchema.index({ 'budget.min': 1, 'budget.max': 1 });
userPreferenceSchema.index({ 'propertyPreferences.types': 1 });

// Virtual to get the number of saved searches
userPreferenceSchema.virtual('savedSearchCount').get(function() {
    return this.savedSearches ? this.savedSearches.length : 0;
});

// Method to add a saved search
userPreferenceSchema.methods.addSavedSearch = function(savedSearchId) {
    if (!this.savedSearches.includes(savedSearchId)) {
        this.savedSearches.push(savedSearchId);
    }
    return this.save();
};

// Method to remove a saved search
userPreferenceSchema.methods.removeSavedSearch = function(savedSearchId) {
    this.savedSearches = this.savedSearches.filter(
        id => id.toString() !== savedSearchId.toString()
    );
    return this.save();
};

// Method to update property preferences
userPreferenceSchema.methods.updatePropertyPreferences = function(newPreferences) {
    Object.assign(this.propertyPreferences, newPreferences);
    return this.save();
};

// Method to update notification settings
userPreferenceSchema.methods.updateNotificationSettings = function(newSettings) {
    Object.assign(this.notifications, newSettings);
    return this.save();
};

// Method to update budget
userPreferenceSchema.methods.updateBudget = function(min, max, currency = 'NGN') {
    this.budget = { min, max, currency };
    return this.save();
};

// Static method to get or create preferences for a user
userPreferenceSchema.statics.getOrCreateForUser = async function(userId) {
    let preferences = await this.findOne({ userId });

    if (!preferences) {
        preferences = await this.create({
            userId,
            // Default preferences for new users
            interestedIn: [],
            preferredLocations: [],
            budget: { min: 0, max: null, currency: 'NGN' },
            propertyPreferences: {
                types: [],
                bedrooms: { min: 1, max: 10 },
                bathrooms: { min: 1, max: 10 },
                furnishing: 'any',
                amenities: []
            }
        });
    }

    return preferences;
};

const UserPreferences = mongoose.model('UserPreferences', userPreferenceSchema);

export default UserPreferences;