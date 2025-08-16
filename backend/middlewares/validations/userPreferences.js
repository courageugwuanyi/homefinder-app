import { body } from 'express-validator';

export const validatePreferencesUpdate = [
    body('interestedIn')
        .optional()
        .isArray()
        .withMessage('interestedIn must be an array')
        .custom((value) => {
            const validOptions = ['buy', 'rent', 'shortlet'];
            return value.every(item => validOptions.includes(item));
        })
        .withMessage('Invalid interestedIn options'),

    body('budget.min')
        .optional()
        .isNumeric()
        .withMessage('Budget minimum must be a number')
        .isFloat({ min: 0 })
        .withMessage('Budget minimum must be positive'),

    body('budget.max')
        .optional()
        .isNumeric()
        .withMessage('Budget maximum must be a number')
        .isFloat({ min: 0 })
        .withMessage('Budget maximum must be positive'),

    body('preferredLocations')
        .optional()
        .isArray()
        .withMessage('Preferred locations must be an array'),

    body('propertyPreferences.types')
        .optional()
        .isArray()
        .withMessage('Property types must be an array')
];