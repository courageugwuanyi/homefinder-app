import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/express";
import { JWT_SECRET } from "../config/env.js";
import User from "../models/user.model.js";

export const authorize = async (req, res, next) => {
    try {
        // Extract JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
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
            const message = error.name === 'TokenExpiredError'
                ? 'Session has expired. Please sign in again.'
                : 'Invalid token';
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Find user (single database query)
        const user = await User.findById(decoded.userId).lean(); // .lean() for better performance
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found!'
            });
        }

        // Check if user account is active
        if (user.accountDetails?.accountStatus !== 'active') {
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

        next();
    } catch (error) {
        console.error('Auth middleware error:', error); // TODO: remove this later
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Optimized admin check
export const requireAdmin = async (req, res, next) => {
    try {
        // Check if user is already loaded and has admin email
        if (req.user?.email === process.env.ADMIN_EMAIL) {
            return next();
        }

        // For Clerk users, verify with Clerk
        if (req.user?.authMethod === 'clerk' && req.user?.clerkId) {
            try {
                const clerkUser = await clerkClient.users.getUser(req.user.clerkId);
                const isAdmin = clerkUser.primaryEmailAddress?.emailAddress === process.env.ADMIN_EMAIL;

                if (!isAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied: You are not an Admin"
                    });
                }

                return next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: "Admin verification failed"
                });
            }
        }

        return res.status(403).json({
            success: false,
            message: "Access denied: You are not an Admin"
        });

    } catch (error) {
        console.error('Admin check error:', error); // TODO: remove this later
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};
