export const propertyValidationRules = {
    title: {
        min: 5,
        max: 100,
        required: true,
        message: 'Title must be between 5 and 100 characters'
    },
    description: {
        min: 20,
        max: 1500,
        required: true,
        message: 'Description must be between 20 and 1500 characters'
    },
    category: {
        options: ['rent', 'sale', 'shortlet'],
        required: true,
        message: 'Category must be rent, sale, or shortlet'
    },
    propertyType: {
        options: [
            'apartment', 'duplex', 'house', 'bungalow',
            'office', 'shop', 'warehouse', 'commercial',
            'plot', 'land', 'farm', 'hotel', 'event-centre'
        ],
        required: true,
        message: 'Invalid property type'
    },
    businessType: {
        options: ['Business', 'Private seller'],
        required: true,
        message: 'Business type must be Business or Private seller'
    },
    country: {
        required: true,
        message: 'Country is required'
    },
    city: {
        required: true,
        message: 'City is required'
    },
    district: {
        required: true,
        message: 'District is required'
    },
    zipCode: {
        required: true,
        message: 'Zip code is required'
    },
    address: {
        required: true,
        message: 'Address is required'
    },
    price: {
        min: 1,
        required: true,
        type: 'number',
        message: 'Price must be a positive number'
    },
    currency: {
        options: ['ngn', 'usd'],
        required: true,
        message: 'Currency must be NGN or USD'
    },
    phone: {
        pattern: /^[\+]?[\d\s\-\(\)]{10,}$/,
        required: true,
        message: 'Invalid phone number format'
    },
    company: {
        max: 200,
        required: false,
        message: 'Company name cannot exceed 200 characters'
    }
};

export const validatePropertyField = (field, value, formData = {}) => {
    const rules = propertyValidationRules[field];
    if (!rules) return null;

    // Special handling for company field
    const isCompanyRequired = formData.businessType === 'Business';

    // Check required fields
    if ((rules.required || (field === 'company' && isCompanyRequired)) && (!value || (typeof value === 'string' && !value.trim()))) {
        if (field === 'company' && isCompanyRequired) {
            return 'Company name is required for registered businesses';
        }
        return rules.message || `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    // Skip validation for optional empty fields
    if (!rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return null;
    }

    const stringValue = String(value).trim();

    // String length validation
    if (rules.min && stringValue.length < rules.min) {
        return rules.message;
    }

    if (rules.max && stringValue.length > rules.max) {
        return rules.message;
    }

    // Options validation
    if (rules.options && !rules.options.includes(value)) {
        return rules.message;
    }

    // Number validation
    if (rules.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return rules.message;
        } else if (rules.min && numValue < rules.min) {
            return rules.message;
        }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
        return rules.message;
    }

    return null;
};

export const validateAllPropertyFields = (formData, additionalChecks = {}) => {
    const errors = {};
    const fieldErrors = [];

    // Validate all rule-based fields
    Object.keys(propertyValidationRules).forEach(field => {
        const error = validatePropertyField(field, formData[field], formData);
        if (error) {
            errors[field] = error;
            fieldErrors.push({ field, message: error });
        }
    });

    // Additional custom validations
    if (additionalChecks.requireGallery && (!additionalChecks.gallery || additionalChecks.gallery.length === 0)) {
        errors.gallery = 'At least one photo or video is required';
        fieldErrors.push({ field: 'gallery', message: 'At least one photo or video is required' });
    }

    if (additionalChecks.requireArea && !formData.area) {
        errors.area = 'Area is required for this property type';
        fieldErrors.push({ field: 'area', message: 'Area is required for this property type' });
    }

    return { errors, fieldErrors, isValid: fieldErrors.length === 0 };
};

export const formatPropertyDataForAPI = (formData) => {
    const formatted = { ...formData };

    // Ensure required string fields are trimmed
    const stringFields = ['title', 'description', 'country', 'city', 'district', 'zipCode', 'address', 'phone', 'company'];
    stringFields.forEach(field => {
        if (formatted[field]) {
            formatted[field] = formatted[field].toString().trim();
        }
    });

    // Ensure price is a number
    if (formatted.price) {
        formatted.price = parseFloat(formatted.price);
    }

    // Ensure currency is lowercase to match backend validation
    if (formatted.currency) {
        formatted.currency = formatted.currency.toLowerCase();
    }

    // Remove empty optional fields
    if (!formatted.company || !formatted.company.trim()) {
        delete formatted.company;
    }

    return formatted;
};

// Function to parse backend validation errors
export const parseBackendErrors = (backendErrors) => {
    if (!Array.isArray(backendErrors)) return [];

    return backendErrors.map(error => ({
        field: error.path || error.param,
        message: error.msg || error.message,
        value: error.value
    }));
};