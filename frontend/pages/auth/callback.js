import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';

const REDIRECT_ROUTES = {
    agent: '/agent/dashboard',
    individual: '/real-estate',
    developer: '/real-estate',
    owner: '/real-estate',
    default: '/real-estate',
    onboarding: '/on-boarding',
    error: '/real-estate/404-not-found'
};

const ACCOUNT_TYPES = [
    {
        value: 'individual',
        label: 'Individual',
        description: 'Searching for property',
        icon: 'fi-home'
    },
    {
        value: 'owner',
        label: 'Property Owner',
        description: 'Own and manage properties',
        icon: 'fi-building'
    },
    {
        value: 'agent',
        label: 'Estate Agent',
        description: 'Real estate professional',
        icon: 'fi-briefcase'
    },
    {
        value: 'developer',
        label: 'Property Developer',
        description: 'Develop and sell properties',
        icon: 'fi-settings'
    }
];

const AuthCallback = () => {
    const router = useRouter();
    const { user, isLoading, error, updateUser } = useAuth();
    const hasProcessed = useRef(false);
    const timeoutRef = useRef(null);

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedAccountType, setSelectedAccountType] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper function to get default route based on user account type
    const getDefaultRoute = (user) => {
        if (user?.accountType) {
            return REDIRECT_ROUTES[user.accountType] || REDIRECT_ROUTES.default;
        }
        return REDIRECT_ROUTES.default;
    };

    // Helper function to validate if a page path is safe and valid
    const isValidPagePath = (pagePath) => {
        if (!pagePath || typeof pagePath !== 'string') return false;
        if (!pagePath.startsWith('/')) return false;
        if (pagePath.length > 1000) return false; // Prevent extremely long URLs

        // Block auth-related pages and sensitive areas
        const blockedPaths = ['/auth/', '/signin', '/signup', '/sso-callback', '/404', '/500', '/api/'];
        if (blockedPaths.some(blocked => pagePath.includes(blocked))) {
            return false;
        }

        // Whitelist valid page patterns for your app
        const validPatterns = [
            /^\/real-estate(\/.*)?$/,
            /^\/agent(\/.*)?$/,
            /^\/profile(\/.*)?$/,
            /^\/catalog(\/.*)?$/,
            /^\/property(\/.*)?$/,
            /^\/$/  // Allow root path
        ];

        return validPatterns.some(pattern => pattern.test(pagePath));
    };

    // Enhanced function to get final destination with validation
    const getFinalDestination = (user) => {
        const storedData = sessionStorage.getItem('preAuthPage');

        if (storedData) {
            sessionStorage.removeItem('preAuthPage');

            try {
                // Try to parse as JSON first (new format with expiration)
                let pageData;
                try {
                    pageData = JSON.parse(storedData);
                    // If it's a valid JSON object with expected structure
                    if (pageData && typeof pageData === 'object' && pageData.path) {
                        // Check if expired (10 minutes expiration)
                        if (pageData.expires && Date.now() <= pageData.expires && isValidPagePath(pageData.path)) {
                            console.log('Redirecting to stored page (JSON format):', pageData.path);
                            return pageData.path;
                        }

                        if (pageData.expires && Date.now() > pageData.expires) {
                            console.warn('Stored page has expired:', pageData.path);
                        } else {
                            console.warn('Invalid stored page path (JSON format):', pageData.path);
                        }
                        return getDefaultRoute(user);
                    }
                } catch (jsonError) {
                    // Not valid JSON, treat as plain string (old format)
                    if (typeof storedData === 'string' && isValidPagePath(storedData)) {
                        console.log('Redirecting to stored page (string format):', storedData);
                        return storedData;
                    } else {
                        console.warn('Invalid stored page path (string format):', storedData);
                    }
                }

            } catch (error) {
                console.error('Error processing stored page data:', error);
            }
        }

        // Fallback to default routing based on account type
        return getDefaultRoute(user);
    };

    // Safe redirect function with error handling
    const safeRedirect = async (destination) => {
        try {
            console.log('Redirecting to:', destination);
            await router.replace(destination);
        } catch (error) {
            console.error(`Navigation failed for ${destination}:`, error);
            // Ultimate fallback - redirect to safe default
            try {
                await router.replace(REDIRECT_ROUTES.default);
            } catch (fallbackError) {
                console.error('Fallback navigation also failed:', fallbackError);
                // Last resort - hard redirect
                window.location.href = REDIRECT_ROUTES.default;
            }
        }
    };

    // Clear any existing timeout when component unmounts or user changes
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (hasProcessed.current) return;
        if (isLoading && !user) return;

        if (error) {
            console.error("Error: ", error);
            hasProcessed.current = true;
            safeRedirect(REDIRECT_ROUTES.error);
            return;
        }

        if (user) {
            if (!user.accountType) {
                setShowOnboarding(true);
                return;
            }

            hasProcessed.current = true;
            const destination = getFinalDestination(user);
            safeRedirect(destination);
        }
    }, [user, isLoading, error, router]);

    const handleAccountTypeSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAccountType || !agreedToTerms) return;

        setIsSubmitting(true);
        try {
            await updateUser({ accountType: selectedAccountType });
            hasProcessed.current = false;

            setTimeout(() => {
                // Create a temporary user object to determine destination
                const tempUser = { ...user, accountType: selectedAccountType };
                const destination = getFinalDestination(tempUser);
                safeRedirect(destination);
            }, 100);
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error onboarding user: ", error);
        }
    };

    // Show onboarding form
    if (showOnboarding && user && !hasProcessed.current) {
        return (
            <div style={{ minHeight: '100vh' }} className="bg-secondary d-flex align-items-center py-4">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={6} md={8}>
                            <div className="card card-body border-0 shadow-sm p-4 p-md-5">
                                {/* Welcome Header with celebration icon */}
                                <div className="text-center mb-4">
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                                    <h1 className="h4 mb-2">
                                        Welcome{user.fullName ? `, ${user.fullName}` : ''}!
                                    </h1>
                                    <p className="fs-6 text-muted mb-0">
                                        Complete your account setup to get started
                                    </p>
                                </div>
                                <Form onSubmit={handleAccountTypeSubmit}>
                                    {/* Account Type Selection */}
                                    <div className="mb-4">
                                        <h3 className="fs-6 fw-semibold mb-3">Choose Your Account Type</h3>
                                        <div className="row g-3">
                                            {ACCOUNT_TYPES.map((type) => (
                                                <div className="col-sm-6" key={type.value}>
                                                    <div
                                                        className={`card card-body h-100 border-2 position-relative ${
                                                            selectedAccountType === type.value
                                                                ? 'border-primary bg-primary bg-opacity-10'
                                                                : 'border-light'
                                                        } card-hover`}
                                                        style={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease-in-out'
                                                        }}
                                                        onClick={() => setSelectedAccountType(type.value)}
                                                    >
                                                        <Form.Check
                                                            type="radio"
                                                            name="accountType"
                                                            value={type.value}
                                                            checked={selectedAccountType === type.value}
                                                            onChange={() => setSelectedAccountType(type.value)}
                                                            className="d-none"
                                                        />
                                                        <div className="d-flex align-items-start">
                                                            <i className={`${type.icon} fs-4 text-primary mt-1 me-3 opacity-75`}></i>
                                                            <div className="flex-grow-1">
                                                                <h4 className="fs-6 fw-semibold mb-1">{type.label}</h4>
                                                                <p className="small text-muted mb-0">
                                                                    {type.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selectedAccountType === type.value && (
                                                            <i className="fi-check-circle text-primary position-absolute top-0 end-0 mt-2 me-2 fs-6"></i>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Terms and Conditions */}
                                    <div className="form-check mb-4">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="terms-checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        />
                                        <label className="form-check-label small" htmlFor="terms-checkbox">
                                            I agree to the{' '}
                                            <a href="/terms" target="_blank" className="fw-semibold text-decoration-none">
                                                Terms and Conditions
                                            </a>{' '}
                                            and{' '}
                                            <a href="/privacy" target="_blank" className="fw-semibold text-decoration-none">
                                                Privacy Policy
                                            </a>
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={!selectedAccountType || !agreedToTerms || isSubmitting}
                                        className="w-100 fw-semibold"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Setting up your account...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fi-check me-2"></i>
                                                Complete Setup
                                            </>
                                        )}
                                    </Button>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    // Show loading spinner - only if we haven't processed and are still in a valid state
    if (!hasProcessed.current && (isLoading || (!user && !error))) {
        return (
            <div style={{ minHeight: '100vh' }} className="bg-secondary d-flex align-items-center justify-content-center">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={6} lg={4}>
                            <div className="text-center p-4">
                                <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem', margin: '0 auto' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h2 className="h4 mb-2 text-primary">
                                    {error ? 'Authentication failed...' :
                                        user ? `Welcome${user.fullName ? `, ${user.fullName}` : ''}!` :
                                            'Completing sign in...'}
                                </h2>
                                <p className="text-muted mb-0">
                                    {error ? 'Redirecting...' :
                                        user ? 'Finalizing...' :
                                            'Please wait...'}
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    // Fallback - shouldn't normally reach here, but just in case
    return null;
};

export default AuthCallback;