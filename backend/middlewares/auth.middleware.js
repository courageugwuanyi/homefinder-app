import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/express";
import { JWT_SECRET } from "../config/env.js";
import User from "../models/user.model.js";
import logger from "../config/logger.js";

export const authorize = async (req, res, next) => {
    try {
        // Extract JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.warn('Authorization attempt without Bearer token', {
                authHeader: authHeader ? 'present but invalid format' : 'missing',
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            logger.warn('JWT token verification failed', {
                error: error.name,
                message: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const message = error.name === 'TokenExpiredError'
                ? 'Session has expired. Please sign in again.'
                : 'Invalid token';

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Find user (single database query)
        const user = await User.findById(decoded.userId).lean();
        if (!user) {
            logger.warn('Token valid but user not found', {
                userId: decoded.userId,
                accountType: decoded.accountType,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'User not found!'
            });
        }

        // Check if user account is active
        if (user.accountDetails?.accountStatus !== 'active') {
            logger.warn('Inactive user attempted access', {
                userId: user._id,
                accountStatus: user.accountDetails?.accountStatus,
                accountType: user.accountType,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Account is suspended or inactive'
            });
        }

        // Attach user to request (convert back from lean)
        req.user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            accountType: user.accountType,
            authMethod: user.authMethod,
            clerkId: user.clerkId
        };

        // Log successful authentication
        logger.info('User authenticated successfully', {
            userId: user._id,
            accountType: user.accountType,
            authMethod: user.authMethod,
            ip: req.ip,
            endpoint: `${req.method} ${req.path}`
        });

        next();

    } catch (error) {
        logger.error('Auth middleware error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: `${req.method} ${req.path}`
        });

        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Optimized admin check
export const requireAdmin = async (req, res, next) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            logger.error('ADMIN_EMAIL environment variable not set');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Check if user is already loaded and has admin email
        if (req.user?.email === adminEmail) {
            logger.info('Admin access granted', {
                userId: req.user._id,
                email: req.user.email,
                endpoint: `${req.method} ${req.path}`,
                ip: req.ip
            });
            return next();
        }

        // For Clerk users, verify with Clerk
        if (req.user?.authMethod === 'clerk' && req.user?.clerkId) {
            try {
                const clerkUser = await clerkClient.users.getUser(req.user.clerkId);
                const isAdmin = clerkUser.primaryEmailAddress?.emailAddress === adminEmail;

                if (!isAdmin) {
                    logger.warn('Non-admin user attempted admin access', {
                        userId: req.user._id,
                        clerkId: req.user.clerkId,
                        email: clerkUser.primaryEmailAddress?.emailAddress,
                        endpoint: `${req.method} ${req.path}`,
                        ip: req.ip
                    });
                    return res.status(403).json({
                        success: false,
                        message: "Access denied: You are not an Admin"
                    });
                }

                logger.info('OAuth admin access granted', {
                    userId: req.user._id,
                    clerkId: req.user.clerkId,
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    endpoint: `${req.method} ${req.path}`,
                    ip: req.ip
                });

                return next();

            } catch (clerkError) {
                logger.error('OAuth admin verification failed', {
                    userId: req.user._id,
                    clerkId: req.user.clerkId,
                    error: clerkError.message,
                    endpoint: `${req.method} ${req.path}`,
                    ip: req.ip
                });
                return res.status(401).json({
                    success: false,
                    message: "Admin verification failed"
                });
            }
        }

        // Log unauthorized admin access attempt
        logger.warn('Unauthorized admin access attempt', {
            userId: req.user?._id,
            email: req.user?.email,
            accountType: req.user?.accountType,
            authMethod: req.user?.authMethod,
            endpoint: `${req.method} ${req.path}`,
            ip: req.ip
        });

        return res.status(403).json({
            success: false,
            message: "Access denied: You are not an Admin"
        });

    } catch (error) {
        logger.error('Admin check error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id,
            endpoint: `${req.method} ${req.path}`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

// Log all requests
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log the request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?._id || 'anonymous'
    });

    // Log the response when it finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

        logger[logLevel]('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?._id || 'anonymous'
        });
    });

    next();
};