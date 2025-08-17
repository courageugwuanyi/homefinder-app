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
    searchProperties
} from "../controllers/property.controller.js";
import { validateAddProperty } from "../middlewares/validations/property.js";

const propertyRouter = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // FIXED: was "100 _1024_ 1024"
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

propertyRouter.get('/search', searchProperties);
propertyRouter.get('/:propertyId', getProperty);

propertyRouter.use(authorize);

propertyRouter.post('/add-property', upload.array('gallery', 10), validateAddProperty, addProperty);
propertyRouter.get('/my-properties', getUserProperties);
propertyRouter.put('/:propertyId/status', updatePropertyStatus);
propertyRouter.put('/:propertyId/media', upload.array('gallery', 10), updatePropertyMedia);
propertyRouter.delete('/:propertyId', deleteProperty);

export default propertyRouter;