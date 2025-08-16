import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

import { PORT } from './config/env.js';
import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import workflowRouter from './routes/workflow.routes.js';
import connectToDatabase from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middleware.js';
import arcjetMiddleware from './middlewares/arcject.middleware.js';
import logger from './config/logger.js'; // Import the logger

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json());
app.use(clerkMiddleware());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(arcjetMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/workflows', workflowRouter);

// Error Handling Middleware
app.use(errorMiddleware);

// Start Server
app.listen(PORT, async () => {
    try {
        await connectToDatabase();
        logger.info(`HomeFinder API is running at http://localhost:${PORT}`);
    } catch (error) {
        logger.error('Failed to connect to the database: %s', error.message);
        process.exit(1); // Exit the process with failure
    }
});

export default app;