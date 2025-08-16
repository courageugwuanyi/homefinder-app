import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Name is required.'],
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [
            function() {
                return !this.clerkId;
            },
            'Email is required.'
        ],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                // Only validate if email is provided or required
                if (this.clerkId && !v) return true;
                return /\S+@\S+\.\S+/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    phoneNumber: {
        type: String,
    },
    accountType: {
        type: String,
        enum: ['agent', 'individual', 'owner', 'developer'],
    },
    accountDetails: {
        password: {
            type: String,
            required: function() {
                return this.authMethod === 'form';
            },
            validate: {
                validator: function(value) {
                    return this.authMethod !== 'form' || (value && value.length >= 8);
                },
                message: props => `Password must be at least 8 characters long`
            }
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        lastLogin: { type: Date },
        accountStatus: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    },
    wishlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wishlist'
    },
    notificationConfig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NotificationConfig'
    },
    profilePicture: {
        type: String,
        default: 'https://example.com/default-profile-picture.png'
    },
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
        required: [
            function() {
                return this.authMethod !== 'form';
            },
            'Sign In Using Google or Apple'
        ],
        validate: {
            validator: function(v) {
                if (this.authMethod === 'form') return true;
                return v && v.length > 0;
            },
            message: props => 'Clerk ID is required.'
        }
    },
    authMethod: {
        type: String,
        required: true,
        enum: ['form', 'clerk'],
        default: 'form'
    }
}, {
    timestamps: true,
    discriminatorKey: 'accountType'
});

// Method to add a property to wishlist
userSchema.methods.addToWishlist = async function(propertyId) {
    let wishlist = await this.model('Wishlist').findOne({ user: this._id });
    if (!wishlist) {
        wishlist = new this.model('Wishlist')({ user: this._id, properties: [] });
    }
    wishlist.properties.addToSet(propertyId);
    await wishlist.save();
    this.wishlist = wishlist._id;
    return this.save();
};

// Method to remove a property from wishlist
userSchema.methods.removeFromWishlist = async function(propertyId) {
    const wishlist = await this.model('Wishlist').findOne({ user: this._id });
    if (wishlist) {
        wishlist.properties.pull(propertyId);
        await wishlist.save();
    }
    return this;
};

// Method to update notification settings
userSchema.methods.updateNotificationSettings = async function(settings) {
    let config = await this.model('NotificationConfig').findOne({ user: this._id });
    if (!config) {
        config = new this.model('NotificationConfig')({ user: this._id, ...settings });
    } else {
        Object.assign(config, settings);
    }
    await config.save();
    this.notificationConfig = config._id;
    return this.save();
};

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.authMethod !== 'form' || !this.isModified('accountDetails.password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.accountDetails.password = await bcrypt.hash(this.accountDetails.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(userPassword) {
    if (this.authMethod !== 'form') {
        throw new Error('This account was created using Google or Apple. Please sign in using Google or Apple.');
    }
    return bcrypt.compare(userPassword, this.accountDetails.password);
};

// Method to update password
userSchema.methods.updatePassword = async function(newPassword) {
    const salt = await bcrypt.genSalt(10);
    this.accountDetails.password = await bcrypt.hash(newPassword, salt);
    return this.save();
};

// Virtual for getting reviews written by a user
userSchema.virtual('reviewsWritten', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'author'
});

// Method to write a review (for both regular users and agents)
userSchema.methods.writeReview = async function(agentId, rating, text) {
    const Review = this.model('Review');
    const newReview = new Review({
        author: this._id,
        recipient: agentId,
        rating,
        text
    });
    await newReview.save();
    return newReview;
};

// Indexes for better query performance
userSchema.index({ clerkId: 1, email: 1 }); // Optimized for your auth queries
userSchema.index({ fullName: 'text' });

const User = mongoose.model('User', userSchema);

export default User;