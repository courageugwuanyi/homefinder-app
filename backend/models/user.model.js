import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Name is required.'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
        type: String,
        required: function() {
            return !this.clerkId;
        },
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                if (this.clerkId && !v) return true;
                return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        },
        index: true
    },

    phoneNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^[\+]?[\d\s\-\(\)]{10,}$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },

    accountType: {
        type: String,
        enum: {
            values: ['agent', 'individual', 'owner', 'developer'],
            message: 'Invalid account type'
        },
        index: true
    },

    // Authentication & Security
    accountDetails: {
        password: {
            type: String,
            required: function() {
                return this.authMethod === 'form';
            },
            validate: {
                validator: function(value) {
                    if (this.authMethod !== 'form') return true;
                    return value && value.length >= 8;
                },
                message: 'Password must be at least 8 characters long'
            },
            select: false // Hide by default
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        lastLogin: {
            type: Date,
            default: Date.now
        },
        accountStatus: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'pending'],
            default: 'active',
            index: true
        }
    },

    // Profile Information (matching auth controller expectations)
    profilePicture: {
        type: String,
        default: null
    },

    // Business Information
    businessInfo: {
        companyName: {
            type: String,
            trim: true,
            maxlength: [200, 'Company name cannot exceed 200 characters']
        },
        licenseNumber: String,
        yearsOfExperience: {
            type: Number,
            min: 0,
            max: 50
        },
        isVerifiedBusiness: {
            type: Boolean,
            default: false
        }
    },

    // External Authentication (matching auth controller)
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
        required: function() {
            return this.authMethod !== 'form';
        },
        index: true
    },

    authMethod: {
        type: String,
        required: true,
        enum: ['form', 'clerk'],
        default: 'form'
    },

    // Activity Tracking
    activity: {
        propertiesCount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalViews: {
            type: Number,
            default: 0,
            min: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0,
            min: 0
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    },

    // Subscription & Permissions
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        propertiesLimit: {
            type: Number,
            default: function() {
                const limits = {
                    individual: 0,
                    agent: 10,
                    owner: 25,
                    developer: 100
                };
                return limits[this.accountType] || 0;
            }
        }
    }

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive fields when converting to JSON
            if (ret.accountDetails) {
                delete ret.accountDetails.password;
                delete ret.accountDetails.passwordResetToken;
            }
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// VIRTUALS (matching auth controller expectations)
userSchema.virtual('firstName').get(function() {
    return this.fullName ? this.fullName.split(' ')[0] : '';
});

userSchema.virtual('lastName').get(function() {
    const nameParts = this.fullName ? this.fullName.split(' ') : [];
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
});

userSchema.virtual('canAddProperties').get(function() {
    return this.accountType !== 'individual' &&
        this.accountDetails.accountStatus === 'active'
        // && this.activity.propertiesCount < this.subscription.propertiesLimit;
});

// Virtual for email verification (used in auth controller)
userSchema.virtual('emailVerified').get(function() {
    return this.authMethod === 'clerk' || this.accountDetails.accountStatus === 'active';
});

// INSTANCE METHODS (matching auth controller usage)
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.authMethod !== 'form') {
        throw new Error('This account was created using Google or Apple. Please sign in using Google or Apple.');
    }
    if (!this.accountDetails.password) {
        throw new Error('No password set for this account');
    }
    return bcrypt.compare(candidatePassword, this.accountDetails.password);
};

userSchema.methods.updatePassword = async function(newPassword) {
    if (this.authMethod !== 'form') {
        throw new Error('Cannot update password for social accounts');
    }
    const salt = await bcrypt.genSalt(12);
    this.accountDetails.password = await bcrypt.hash(newPassword, salt);
    this.accountDetails.passwordResetToken = undefined;
    this.accountDetails.passwordResetExpires = undefined;
    return this.save();
};

userSchema.methods.incrementPropertiesCount = async function() {
    this.activity.propertiesCount += 1;
    return this.save();
};

userSchema.methods.decrementPropertiesCount = async function() {
    if (this.activity.propertiesCount > 0) {
        this.activity.propertiesCount -= 1;
    }
    return this.save();
};

// STATIC METHODS (matching auth controller usage)
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByClerkId = function(clerkId) {
    return this.findOne({ clerkId });
};

// MIDDLEWARE
// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.authMethod !== 'form' || !this.isModified('accountDetails.password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.accountDetails.password = await bcrypt.hash(this.accountDetails.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update properties limit when account type changes
userSchema.pre('save', function(next) {
    if (this.isModified('accountType')) {
        const limits = {
            individual: 0,
            agent: 10,
            owner: 25,
            developer: 100
        };
        this.subscription.propertiesLimit = limits[this.accountType] || 0;
    }
    next();
});

// INDEXES
userSchema.index({ email: 1, clerkId: 1 });
userSchema.index({ accountType: 1, 'accountDetails.accountStatus': 1 });
userSchema.index({ fullName: 'text' });

const User = mongoose.model('User', userSchema);

export default User;