export const parseUserName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };

    const parts = fullName.trim().split(' ');
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
    };
};

export const getContactData = (user) => {
    const { firstName, lastName } = parseUserName(user?.fullName);
    return {
        firstName,
        lastName,
        email: user?.email || '',
        phone: user?.phone || '',
        company: ''
    };
};