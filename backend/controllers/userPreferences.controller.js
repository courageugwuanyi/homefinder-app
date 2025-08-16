import UserPreference from '../models/userPreference.model.js';

export const getUserPreferences = async (req, res) => {
    try {
        const preferences = await UserPreference.getOrCreateForUser(req.user._id)
            .populate('savedSearches');

        res.json({
            success: true,
        });
    } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch preferences'
            });
        }
};

export const updateUserPreferences = async (req, res) => {
    try {
        const {
            interestedIn,
            preferredLocations,
            budget,
            propertyPreferences,
            notifications
        } = req.body;

        let preferences = await UserPreferences.findOne({ userId: req.user._id });

        if (!preferences) {
            preferences = new UserPreferences({ userId: req.user._id });
        }

        // Update fields if provided
        if (interestedIn) preferences.interestedIn = interestedIn;
        if (preferredLocations) preferences.preferredLocations = preferredLocations;
        if (budget) Object.assign(preferences.budget, budget);
        if (propertyPreferences) Object.assign(preferences.propertyPreferences, propertyPreferences);
        if (notifications) Object.assign(preferences.notifications, notifications);

        await preferences.save();

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: preferences
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update preferences',
            error: error.message
        });
    }
};

export const getRecommendedProperties = async (req, res) => {
    try {
        const preferences = await UserPreferences.findOne({ userId: req.user._id });

        if (!preferences) {
            return res.json({
                success: true,
                data: [],
                message: 'Complete your preferences to get personalized recommendations'
            });
        }

        // Build query based on preferences
        const query = {};

        if (preferences.preferredLocations.length > 0) {
            query.location = { $in: preferences.preferredLocations };
        }

        if (preferences.budget.min || preferences.budget.max) {
            query.price = {};
            if (preferences.budget.min) query.price.$gte = preferences.budget.min;
            if (preferences.budget.max) query.price.$lte = preferences.budget.max;
        }

        if (preferences.propertyPreferences.types.length > 0) {
            query.propertyType = { $in: preferences.propertyPreferences.types };
        }

        const properties = await Property.find(query)
            .limit(20)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: properties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations'
        });
    }
};
