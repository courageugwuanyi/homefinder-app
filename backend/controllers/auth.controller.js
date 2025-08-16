import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { clerkClient } from '@clerk/express';
import logger from '../config/logger.js'; // Import the logger

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed', { errors: errors.array() });
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

// Helper function to generate JWT token
const generateToken = (userId, accountType, expiresIn = JWT_EXPIRES_IN) => {
    return jwt.sign({ userId, accountType }, JWT_SECRET, { expiresIn });
};

// Helper function to create user response
const createUserResponse = (user, token) => ({
    success: true,
    message: 'Authentication successful',
    data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            accountType: user.accountType,
            authMethod: user.authMethod,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified || false,
        },
    },
});

// Update last login without waiting
const updateLastLogin = (userId) => {
    User.findByIdAndUpdate(userId, { 'accountDetails.lastLogin': new Date() }).exec();
};

// Handle MongoDB errors
const handleMongoErrors = (error, res, next) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        logger.warn(`Duplicate key error: ${field}`, { error });
        return res.status(409).json({
            success: false,
            message: `An account with this ${field} already exists`,
        });
    }
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(({ path, message }) => ({
            field: path,
            message,
        }));
        logger.warn('Validation error', { validationErrors });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors,
        });
    }
    logger.error('Unhandled error', { error });
    next(error);
};

export const clerkSignInOrUp = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { firstName, lastName, email, clerkId } = req.body;

        if (!clerkId) {
            logger.warn('Unauthorized access attempt without clerkId');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        let user = await User.findOne({
            $or: [{ clerkId }, { email: email?.toLowerCase() }],
        });

        if (!user) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim();
            user = await User.create({
                fullName,
                clerkId,
                authMethod: 'clerk',
                email: email?.toLowerCase(),
            });
            logger.info('New user created', { userId: user._id, fullName: user.fullName, Email: user.email });
        }

        const token = generateToken(user._id, user.accountType, getTokenExpiration(user.accountType));
        updateLastLogin(user._id);
        logger.info('User signed in', { userId: user._id });

        res.status(200).json(createUserResponse(user, token));
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Sign Up
export const signUp = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { fullName, email, password } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            authMethod: 'form',
            accountDetails: { password },
        });

        const token = generateToken(newUser._id, newUser.accountType);
        updateLastLogin(newUser._id);
        logger.info('New user signed up', { userId: newUser._id });

        res.status(201).json({
            ...createUserResponse(newUser, token),
            message: 'Account created successfully',
        });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Sign In
export const signIn = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        // First, check if user exists at all (any auth method)
        const existingUser = await User.findOne({
            email: normalizedEmail
        }).select('authMethod accountDetails.accountStatus');

        if (!existingUser) {
            logger.warn('Sign-in attempt for non-existent user', { email: normalizedEmail });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if user signed up with Clerk (OAuth)
        if (existingUser.authMethod === 'clerk') {
            logger.warn('Form signin attempt for Clerk user', {
                email: normalizedEmail,
                userId: existingUser._id
            });

            return res.status(400).json({
                success: false,
                message: 'This email is linked to Google/Apple. Use social sign-in above.',
                code: 'OAUTH_ACCOUNT_EXISTS',
                data: {
                    authMethod: 'oauth',
                    availableMethods: ['google', 'apple'],
                    suggestedAction: 'Use "Continue with Google" or "Continue with Apple" to sign in'
                }
            });
        }

        // Now look for local auth user specifically
        const formUser = await User.findOne({
            email: normalizedEmail,
            authMethod: 'form',
        }).select('+accountDetails.password accountDetails.accountStatus');

        if (!formUser || !(await formUser.comparePassword(password))) {
            logger.warn('Invalid credentials for user', { email: normalizedEmail });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check account status
        if (formUser.accountDetails?.accountStatus !== 'active') {
            logger.warn('Inactive account sign-in attempt', { userId: formUser._id });
            return res.status(403).json({
                success: false,
                message: 'Account is suspended or inactive. Please contact support',
                code: 'ACCOUNT_INACTIVE',
                data: {
                    accountStatus: formUser.accountDetails.accountStatus
                }
            });
        }

        // Successful sign in
        const token = generateToken(formUser._id, formUser.accountType);
        updateLastLogin(formUser._id);

        logger.info('User signed in successfully', { userId: formUser._id });

        res.status(200).json(createUserResponse(formUser, token));

    } catch (error) {
        logger.error('SignIn error:', error);
        handleMongoErrors(error, res, next);
    }
};

// Sign Out (Client-side token disposal)
export const signOut = (req, res) => {
    try {
        logger.info('User signed out', { userId: req.user.id });

        res.status(200).json({
            success: true,
            message: 'Signed out successfully.',
        });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({
            success: false,
            message: 'Signout failed.',
        });
    }
};

// Delete Account
export const deleteAccount = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            logger.warn('Delete account attempt for non-existent user');
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.authMethod === 'clerk' && user.clerkId) {
            clerkClient.users.deleteUser(user.clerkId).catch((error) => {
                logger.error('Clerk deletion error', { error });
            });
        }

        await User.findByIdAndDelete(user._id);
        logger.info('User account deleted', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Update User
export const updateUser = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const userId = req.user._id;
        const allowedUpdates = ['accountType', 'fullName', 'phoneNumber'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        });

        // Validate accountType if provided
        if (updates.accountType) {
            const validAccountTypes = ['individual', 'owner', 'agent', 'developer'];
            if (!validAccountTypes.includes(updates.accountType)) {
                logger.warn('Invalid account type provided', {
                    userId,
                    accountType: updates.accountType
                });
                return res.status(400).json({
                    success: false,
                    message: 'Invalid account type. Must be one of: individual, owner, agent, developer',
                });
            }
        }

        // Trim string values
        if (updates.fullName) updates.fullName = updates.fullName.trim();
        if (updates.phoneNumber) updates.phoneNumber = updates.phoneNumber.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid updates provided',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            {
                new: true,
                runValidators: true,
                select: '-accountDetails.password'
            }
        );

        if (!updatedUser) {
            logger.warn('User not found for update', { userId });
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // If account type was updated, generate new token with updated account type
        let token = null;
        if (updates.accountType) {
            token = generateToken(updatedUser._id, updatedUser.accountType, getTokenExpiration(updatedUser.accountType));
        }

        // TODO: refactor code duplication
        const responseData = {
            success: true,
            message: 'User updated successfully',
            data: {
                user: {
                    _id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                    accountType: updatedUser.accountType,
                    authMethod: updatedUser.authMethod,
                    profilePicture: updatedUser.profilePicture,
                },
            },
        };

        // Include new token if account type was updated
        if (token) {
            responseData.data.token = token;
            responseData.data.expiresIn = getTokenExpiration(updatedUser.accountType);
        }

        logger.info('User updated successfully', {
            userId,
            updates: Object.keys(updates),
            accountTypeChanged: !!updates.accountType
        });

        res.json(responseData);
    } catch (error) {
        logger.error('Update user error:', error);
        handleMongoErrors(error, res, next);
    }
};

// Request Password Reset
export const requestPasswordReset = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { email } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase(),
            authMethod: 'local',
        });

        res.status(200).json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent',
        });

        if (user) {
            const resetToken = jwt.sign({ userId: user._id, type: 'password-reset' }, JWT_SECRET, {
                expiresIn: '1h',
            });

            User.findByIdAndUpdate(user._id, {
                'accountDetails.passwordResetToken': resetToken,
                'accountDetails.passwordResetExpires': new Date(Date.now() + 3600000),
            }).exec();

            logger.info('Password reset requested', { userId: user._id });
            // TODO: Implement email service
            // sendPasswordResetEmail(user.email, resetToken);
        }
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { token, newPassword } = req.body;

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            logger.warn('Invalid or expired reset token', { token });
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        if (decoded.type !== 'password-reset') {
            logger.warn('Invalid token type', { token });
            return res.status(400).json({
                success: false,
                message: 'Invalid token type',
            });
        }

        const user = await User.findOne({
            _id: decoded.userId,
            'accountDetails.passwordResetToken': token,
            'accountDetails.passwordResetExpires': { $gt: new Date() },
        });

        if (!user) {
            logger.warn('Invalid or expired reset token', { token });
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        await user.updatePassword(newPassword);
        user.accountDetails.passwordResetToken = undefined;
        user.accountDetails.passwordResetExpires = undefined;
        await user.save();
        logger.info('Password reset successfully', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-accountDetails.password').lean();

        if (!user) {
            logger.warn('User not found', { userId: req.user._id });
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    accountType: user.accountType,
                    authMethod: user.authMethod,
                    profilePicture: user.profilePicture,
                    createdAt: user.createdAt,
                    lastLogin: user.accountDetails?.lastLogin,
                },
            },
        });
        logger.info('Fetched current user', { userId: req.user._id });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Update Profile
export const updateProfile = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { fullName, phoneNumber } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                ...(fullName && { fullName: fullName.trim() }),
                ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
            },
            { new: true, runValidators: true }
        ).select('-accountDetails.password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    _id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                    accountType: updatedUser.accountType,
                    profilePicture: updatedUser.profilePicture,
                },
            },
        });
        logger.info('Profile updated', { userId: req.user._id });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return validationError;

        const { currentPassword, newPassword } = req.body;

        if (req.user.authMethod !== 'local') {
            logger.warn('Password change not available for OAuth users', { userId: req.user._id });
            return res.status(400).json({
                success: false,
                message: 'Password change not available for OAuth users',
            });
        }

        const user = await User.findById(req.user._id).select('+accountDetails.password');

        if (!(await user.comparePassword(currentPassword))) {
            logger.warn('Incorrect current password', { userId: req.user._id });
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        await user.updatePassword(newPassword);
        logger.info('Password changed', { userId: req.user._id });

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        handleMongoErrors(error, res, next);
    }
};

// Check user exists
export const checkUserExists = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() }).lean();

        res.json({
            success: true,
            exists: !!user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'User does not exist',
        });
    }
}

// Helper function to determine token expiration based on account type
const getTokenExpiration = (accountType) => {
    switch (accountType) {
        case 'agent':
            return '5d';
        case 'regular':
            return '20d';
        default:
            return JWT_EXPIRES_IN;
    }
};