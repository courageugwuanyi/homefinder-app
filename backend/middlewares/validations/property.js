import { body } from 'express-validator';

export const validateAddProperty = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),

    body('description')
        .trim()
        .isLength({ min: 20, max: 1500 })
        .withMessage('Description must be between 20 and 1500 characters'),

    body('category')
        .isIn(['rent', 'sale', 'shortlet'])
        .withMessage('Category must be rent, sale, or shortlet'),

    body('propertyType')
        .isIn([
            'apartment', 'duplex', 'house', 'bungalow',
            'office', 'shop', 'warehouse', 'commercial',
            'plot', 'land', 'farm', 'hotel', 'event-centre'
        ])
        .withMessage('Invalid property type'),

    body('businessType')
        .isIn(['Business', 'Private seller'])
        .withMessage('Business type must be Business or Private seller'),

    body('country').trim().notEmpty().withMessage('Country is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('district').trim().notEmpty().withMessage('District is required'),
    body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),

    body('price')
        .isNumeric()
        .isFloat({ min: 1 })
        .withMessage('Price must be a positive number'),

    body('currency')
        .isIn(['ngn', 'usd'])
        .withMessage('Currency must be NGN or USD'),

    body('phone')
        .trim()
        .matches(/^[\+]?[\d\s\-\(\)]{10,}$/)
        .withMessage('Invalid phone number format'),

    body('company')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Company name cannot exceed 200 characters')
];