import { Router } from 'express';
import {
    signIn,
    signOut,
    signUp,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    updateUser,
    clerkSignInOrUp, getCurrentUser, updateProfile, changePassword, checkUserExists
} from "../controllers/auth.controller.js";

import { authorize } from "../middlewares/auth.middleware.js";
import {
    validateSignUp,
    validateSignIn,
    validateClerkAuth,
    validatePasswordReset,
    validateNewPassword,
    validateProfileUpdate,
    validateChangePassword,
    validateUserUpdate
} from '../middlewares/validations/auth.js';

const authRouter = Router();

authRouter.post('/signup', validateSignUp, signUp );
authRouter.post('/signin', validateSignIn, signIn );
authRouter.post('/check-user', checkUserExists );

authRouter.post('/callback', validateClerkAuth, clerkSignInOrUp );

authRouter.post('/forgot-password', validatePasswordReset, requestPasswordReset );
authRouter.post('/reset-password', validateNewPassword, resetPassword );

// Protected Routes
authRouter.post('/signout', authorize, signOut );
authRouter.delete('/account', authorize, deleteAccount );
authRouter.get('/me', authorize, getCurrentUser );
authRouter.put('/profile', authorize, validateProfileUpdate, updateProfile);
authRouter.put('/update-user', authorize, validateUserUpdate, updateUser);

// Change Password (for local auth users)
authRouter.put('/change-password', authorize, validateChangePassword, changePassword);

export default authRouter;