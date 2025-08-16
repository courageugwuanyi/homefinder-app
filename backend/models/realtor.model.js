import mongoose from 'mongoose';
import User from './user.model.js';

const realEstateAgentSchema = new mongoose.Schema({
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot be more than 1000 characters'],
        trim: true
    },
    profilePicture: {
        type: String,
        default: 'https://example.com/default-agent-profile-picture.png'
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    socialMedia: {
        facebook: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        twitter: { type: String, trim: true },
        instagram: { type: String, trim: true },
        tiktok: { type: String, trim: true }
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        trim: true
    },
    specializations: [{
        type: String,
        trim: true
    }],
    yearsOfExperience: {
        type: Number,
        min: [0, 'Years of experience cannot be negative'],
        default: 0
    },
    analytics: {
        totalListings: { type: Number, default: 0 },
        activeListings: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 }
    },
}, {
    timestamps: true
});

// Virtual for getting all properties of an agent
realEstateAgentSchema.virtual('properties', {
    ref: 'Property',
    localField: '_id',
    foreignField: 'agent'
});

// Virtual for getting reviews about the agent
realEstateAgentSchema.virtual('reviewsReceived', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'recipient'
});

// Virtual for initials-based avatar
realEstateAgentSchema.virtual('initialsAvatar').get(function() {
    if (this.profilePicture) return this.profilePicture;

    const initials = this.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();

    return `https://ui-avatars.com/api/?name=${initials}&background=random`;
});

// Method to get profile picture or fallback
realEstateAgentSchema.methods.getProfilePicture = function() {
    return this.profilePicture || this.initialsAvatar;
};

// Method to calculate average rating
realEstateAgentSchema.methods.calculateAverageRating = async function() {
    const reviews = await this.model('Review').find({ recipient: this._id });
    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.analytics.averageRating = totalRating / reviews.length;
    return this.save();
};

// Method to update analytics
realEstateAgentSchema.methods.updateAnalytics = async function() {
    const properties = await this.model('Property').find({ agent: this._id });
    this.analytics.totalListings = properties.length;
    this.analytics.activeListings = properties.filter(p => p.status === 'active').length;
    this.analytics.totalViews = properties.reduce((sum, prop) => sum + (prop.views || 0), 0);
    await this.calculateAverageRating();
    return this.save();
};

const RealEstateAgent = User.discriminator('RealEstateAgent', realEstateAgentSchema);

export default RealEstateAgent;