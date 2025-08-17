import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    // Author of the review (any user type can write reviews)
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review author is required'],
        index: true
    },

    // Recipient of the review (usually agent, owner, or developer)
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review recipient is required'],
        index: true,
        validate: {
            validator: async function(recipientId) {
                const User = mongoose.model('User');
                const recipient = await User.findById(recipientId);
                // Only allow reviews for professional accounts
                return recipient && ['agent', 'owner', 'developer'].includes(recipient.accountType);
            },
            message: 'Reviews can only be written for agents, owners, or developers'
        }
    },

    // Related property (optional - reviews can be general or property-specific)
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        index: true
    },

    // Rating (1-5 stars)
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number'
        }
    },

    // Review text
    text: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },

    // Review category
    reviewType: {
        type: String,
        enum: {
            values: ['service', 'communication', 'property_quality', 'overall'],
            message: 'Invalid review type'
        },
        default: 'overall'
    },

    // Engagement metrics
    engagement: {
        helpful: {
            type: Number,
            default: 0,
            min: 0
        },
        notHelpful: {
            type: Number,
            default: 0,
            min: 0
        },
        // Users who marked as helpful/not helpful (prevent duplicate votes)
        helpfulVoters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        notHelpfulVoters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },

    // Status and moderation
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved', // Auto-approve for now
        index: true
    },

    // Response from the recipient (optional)
    response: {
        text: {
            type: String,
            trim: true,
            maxlength: [500, 'Response cannot exceed 500 characters']
        },
        respondedAt: Date
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXES
reviewSchema.index({ recipient: 1, status: 1, createdAt: -1 });
reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ property: 1, status: 1 });
reviewSchema.index({ rating: 1, status: 1 });

// VIRTUALS
reviewSchema.virtual('helpfulnessRatio').get(function() {
    const total = this.engagement.helpful + this.engagement.notHelpful;
    return total > 0 ? (this.engagement.helpful / total * 100).toFixed(1) : 0;
});

reviewSchema.virtual('isRecent').get(function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.createdAt > thirtyDaysAgo;
});

// INSTANCE METHODS
reviewSchema.methods.markAsHelpful = async function(userId) {
    // Remove from not helpful if exists
    this.engagement.notHelpfulVoters = this.engagement.notHelpfulVoters.filter(
        id => id.toString() !== userId.toString()
    );

    // Add to helpful if not already there
    if (!this.engagement.helpfulVoters.includes(userId)) {
        this.engagement.helpfulVoters.push(userId);
        this.engagement.helpful += 1;
        if (this.engagement.notHelpful > 0) {
            this.engagement.notHelpful -= 1;
        }
    }

    return this.save();
};

reviewSchema.methods.markAsNotHelpful = async function(userId) {
    // Remove from helpful if exists
    this.engagement.helpfulVoters = this.engagement.helpfulVoters.filter(
        id => id.toString() !== userId.toString()
    );

    // Add to not helpful if not already there
    if (!this.engagement.notHelpfulVoters.includes(userId)) {
        this.engagement.notHelpfulVoters.push(userId);
        this.engagement.notHelpful += 1;
        if (this.engagement.helpful > 0) {
            this.engagement.helpful -= 1;
        }
    }

    return this.save();
};

reviewSchema.methods.addResponse = async function(responseText) {
    this.response = {
        text: responseText.trim(),
        respondedAt: new Date()
    };
    return this.save();
};

// STATIC METHODS
reviewSchema.statics.getAverageRatingForUser = async function(userId) {
    const result = await this.aggregate([
        { $match: { recipient: new mongoose.Types.ObjectId(userId), status: 'approved' } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingBreakdown: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result[0].ratingBreakdown.forEach(rating => {
        breakdown[rating]++;
    });

    return {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews,
        ratingBreakdown: breakdown
    };
};

reviewSchema.statics.getRecentReviewsForUser = function(userId, limit = 5) {
    return this.find({
        recipient: userId,
        status: 'approved'
    })
        .populate('author', 'fullName profilePicture')
        .populate('property', 'title location.city location.district')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// MIDDLEWARE
// Update recipient's rating when review is saved/updated
reviewSchema.post('save', async function(doc) {
    if (doc.status === 'approved') {
        const User = mongoose.model('User');
        const user = await User.findById(doc.recipient);
        if (user) {
            await user.updateRating();
        }
    }
});

// Prevent users from reviewing themselves
reviewSchema.pre('save', function(next) {
    if (this.author.toString() === this.recipient.toString()) {
        next(new Error('Users cannot review themselves'));
    } else {
        next();
    }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;