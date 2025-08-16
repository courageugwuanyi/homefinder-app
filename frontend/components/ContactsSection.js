// components/property/ContactSection.jsx
import { memo, useMemo } from 'react';
import { Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import NumberFormat from 'react-number-format';

const ContactSection = memo(({ userData, isLoading }) => {
    // Parse full name into first and last name
    const { firstName, lastName, email } = useMemo(() => {
        if (!userData?.fullName || !userData?.email) {
            return { firstName: '', lastName: '', email: '' };
        }

        const nameParts = userData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
            firstName,
            lastName,
            email: userData.email
        };
    }, [userData]);

    if (isLoading) {
        return (
            <section id="contacts" className="card card-body border-0 shadow-sm p-4 mb-4">
                <h2 className="h4 mb-4">
                    <i className="fi-phone text-primary fs-5 mt-n1 me-2"></i>
                    Contacts
                </h2>
                <div className="d-flex justify-content-center align-items-center py-4">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading contact information...</span>
                </div>
            </section>
        );
    }

    return (
        <section id="contacts" className="card card-body border-0 shadow-sm p-4 mb-4">
            <h2 className="h4 mb-4">
                <i className="fi-phone text-primary fs-5 mt-n1 me-2"></i>
                Contacts
            </h2>

            {/* Info alert about disabled fields */}
            <Alert variant="info" className="d-flex align-items-center mb-4">
                <i className="fi-info-circle me-2"></i>
                <div className="flex-grow-1">
                    <small>
                        Your name and email are automatically filled from your profile and cannot be edited here.
                        <Link href="/profile" className="text-decoration-none ms-1">
                            Update in Profile →
                        </Link>
                    </small>
                </div>
            </Alert>

            <Row>
                <Form.Group as={Col} sm={6} controlId="ab-fn" className="mb-3">
                    <Form.Label>
                        First name <span className="text-danger">*</span>
                        <i className="fi-lock ms-1 text-muted fs-sm" title="This field is managed in your profile"></i>
                    </Form.Label>
                    <Form.Control
                        value={firstName}
                        placeholder="First name from profile"
                        disabled
                        className="bg-light"
                        required
                    />
                    <Form.Text className="text-muted">
                        Managed in your profile settings
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Col} sm={6} controlId="ab-sn" className="mb-3">
                    <Form.Label>
                        Last name <span className="text-danger">*</span>
                        <i className="fi-lock ms-1 text-muted fs-sm" title="This field is managed in your profile"></i>
                    </Form.Label>
                    <Form.Control
                        value={lastName}
                        placeholder="Last name from profile"
                        disabled
                        className="bg-light"
                        required
                    />
                    <Form.Text className="text-muted">
                        Managed in your profile settings
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Col} sm={6} controlId="ab-email" className="mb-3">
                    <Form.Label>
                        Email <span className="text-danger">*</span>
                        <i className="fi-lock ms-1 text-muted fs-sm" title="This field is managed in your profile"></i>
                    </Form.Label>
                    <Form.Control
                        type="email"
                        value={email}
                        placeholder="Email from profile"
                        disabled
                        className="bg-light"
                        required
                    />
                    <Form.Text className="text-muted">
                        Managed in your profile settings
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Col} sm={6} controlId="ab-phone" className="mb-3">
                    <Form.Label>Phone number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as={NumberFormat}
                        format="+1(##) ###-####"
                        placeholder="+1(00) 000-0000"
                        required
                    />
                </Form.Group>

                <Form.Group as={Col} xs={12} controlId="ab-company" className="mb-3">
                    <Form.Label>Company</Form.Label>
                    <Form.Control placeholder="Enter company name" />
                </Form.Group>
            </Row>
        </section>
    );
});

ContactSection.displayName = 'ContactSection';

export default ContactSection;