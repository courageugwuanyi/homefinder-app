import { body } from 'express-validator';

// Reusable validation functions
const validateEmail = () =>
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address');

const validatePassword = (field = 'password') =>
    body(field)
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

const validateFullName = (field = 'fullName') =>
    body(field)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Full name can only contain letters and spaces');

const validatePhoneNumber = (field = 'phoneNumber') =>
    body(field)
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number');

const validateAccountType = (field = 'accountType') =>
    body(field)
        .optional()
        .isIn(['individual', 'owner', 'agent', 'developer'])
        .withMessage('Account type must be one of: individual, owner, agent, developer');

// Validation arrays
export const validateSignUp = [
    validateFullName(),
    validateEmail(),
    validatePassword()
];

export const validateSignIn = [
    validateEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

export const validateClerkAuth = [
    body('clerkId')
        .notEmpty()
        .withMessage('Clerk ID is required')
        .isLength({ min: 5 })
        .withMessage('Invalid Clerk ID format'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 0, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    validateEmail().optional()
];

export const validatePasswordReset = [
    validateEmail()
];

export const validateNewPassword = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    validatePassword('newPassword')
];

export const validateRefreshToken = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
];

export const validateProfileUpdate = [
    validateFullName().optional(),
    validatePhoneNumber()
];

export const validateUserUpdate = [
    validateFullName().optional(),
    validatePhoneNumber().optional(),
    validateAccountType().optional(),
    // Custom validation to ensure at least one field is provided
    body().custom((value, { req }) => {
        const allowedFields = ['fullName', 'phoneNumber', 'accountType'];
        const hasValidUpdate = allowedFields.some(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        if (!hasValidUpdate) {
            throw new Error('At least one valid field must be provided for update');
        }
        return true;
    })
];

export const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    validatePassword('newPassword'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];