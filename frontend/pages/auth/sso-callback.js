import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Container, Row, Col } from 'react-bootstrap';

const SSOCallback = () => {
    return (
        <div style={{ minHeight: '100vh' }} className="bg-secondary d-flex align-items-center justify-content-center">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={4}>
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem', margin: '0 auto' }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h2 className="h4 mb-2">
                                Signing you in...
                            </h2>
                            <p className="text-muted mb-0">
                                Please wait while we complete your authentication...
                            </p>
                            <div style={{ display: 'none' }}>
                                <AuthenticateWithRedirectCallback
                                    signUpForceRedirectUrl="/auth/callback"
                                    signInForceRedirectUrl="/auth/callback"
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default SSOCallback;