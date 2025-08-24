import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
    addProperty,
    getUserProperties,
    updatePropertyStatus,
    updatePropertyMedia,
    deleteProperty,
    getProperty,
    searchProperties,
    getPropertyCounts,
    getPropertyStats,
    getAllPropertyStats,
    promoteProperty
} from "../controllers/property.controller.js";
import { validateAddProperty } from "../middlewares/validations/property.js";

const propertyRouter = Router();

// Multer configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB per file
        files: 10
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    }
});

// Public routes (before auth middleware)
propertyRouter.get('/search', searchProperties);

// Protected routes (after auth middleware)
propertyRouter.use(authorize);

// User property management routes
propertyRouter.get('/my-properties/stats', getAllPropertyStats); // Single endpoint for all stats
propertyRouter.get('/my-properties/stats-individual', getPropertyStats); // Fallback endpoint
propertyRouter.get('/my-properties/counts', getPropertyCounts);
propertyRouter.get('/my-properties', getUserProperties);

// Property creation
propertyRouter.post('/add-property', upload.array('gallery', 10), validateAddProperty, addProperty);

// Property actions by ID (parameterized paths AFTER specific paths)
propertyRouter.put('/:propertyId/promote', promoteProperty);
propertyRouter.put('/:propertyId/status', updatePropertyStatus);
propertyRouter.put('/:propertyId/media', upload.array('gallery', 10), updatePropertyMedia);
propertyRouter.delete('/:propertyId', deleteProperty);

// Single property retrieval (LAST because it's most generic)
propertyRouter.get('/:propertyId', getProperty);

export default propertyRouter;