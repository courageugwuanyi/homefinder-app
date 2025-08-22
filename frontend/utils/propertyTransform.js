export const transformDatabaseProperty = (dbProperty) => {
    // Map category to display format
    const getCategoryDisplay = (category) => {
        switch (category) {
            case 'rent': return 'For rent';
            case 'sale': return 'For sale';
            case 'shortlet': return 'For shortlet';
            default: return 'For rent';
        }
    };

    // Map amenities to the format expected by PropertyCard footer
    const getAmenities = (specs) => {
        const bedrooms = specs?.bedrooms === 'studio' ? 0 : parseInt(specs?.bedrooms?.replace('+', '')) || 0;
        const bathrooms = parseInt(specs?.bathrooms?.replace('+', '')) || 0;
        const parking = parseInt(specs?.parking?.replace('+', '')) || 0;
        return [bedrooms, bathrooms, parking];
    };

    // Create badges based on property attributes
    const getBadges = (property) => {
        const badges = [];
        if (property.verified) badges.push(['success', 'Verified']);
        if (property.featured) badges.push(['warning', 'Featured']);
        if (property.specifications?.isServiced) badges.push(['info', 'Serviced']);

        // Add "New" badge for properties created within last 7 days
        const createdDate = new Date(property.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (createdDate > weekAgo) badges.push(['info', 'New']);

        return badges;
    };

    // Format price using your database virtuals
    const formatPrice = (pricing) => {
        const symbol = pricing.currency === 'usd' ? '$' : '₦';
        const amount = pricing.amount.toLocaleString();
        const unit = pricing.priceUnit !== 'total' ? `/${pricing.priceUnit}` : '';
        return `${symbol}${amount}${unit}`;
    };

    // Get primary image
    const getPrimaryImage = (media) => {
        if (media?.images?.length > 0) {
            const primaryImg = media.images.find(img => img.isPrimary);
            return primaryImg?.url || media.images[0]?.url;
        }
        return '/images/real-estate/placeholder.jpg';
    };

    // Create full address
    const getFullAddress = (location) => {
        return [
            location.address,
            location.district,
            location.city,
            location.country
        ].filter(Boolean).join(', ');
    };

    return {
        id: dbProperty._id,
        href: `/real-estate/property/${dbProperty.seo?.slug || dbProperty._id}`,
        images: [[getPrimaryImage(dbProperty.media), 'Image']],
        category: getCategoryDisplay(dbProperty.category),
        title: dbProperty.title,
        location: getFullAddress(dbProperty.location),
        price: formatPrice(dbProperty.pricing),
        badges: getBadges(dbProperty),
        amenities: getAmenities(dbProperty.specifications),
        status: dbProperty.status,
        createdAt: dbProperty.createdAt,
        isPromoted: dbProperty.featured || false,
        analytics: {
            views: dbProperty.analytics?.views || 0,
            viewsThisMonth: dbProperty.analytics?.viewsThisMonth || 0
        },
        // Add archived date for archived properties
        ...(dbProperty.status === 'archived' && {
            archivedAt: dbProperty.updatedAt
        }),
        // Keep original data for reference if needed
        _original: dbProperty
    };
};