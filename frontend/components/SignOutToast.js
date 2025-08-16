// components/SignOutToast.js
import { useState, useEffect } from 'react';
import Toast from 'react-bootstrap/Toast';

const SignOutToast = ({ show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000); // Auto-hide after 4 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="position-fixed" style={{ top: '80px', right: '20px', zIndex: 1050 }}>
            <Toast show={show} onClose={onClose}>
                <Toast.Header>
                    <div
                        className='d-inline-block align-middle bg-primary rounded-1 me-2'
                        style={{width: '1.25rem', height: '1.25rem'}}
                    ></div>
                    <h6 className='fs-sm mb-0 me-auto'>Signed Out Successfully</h6>
                    <small className='text-muted'>just now</small>
                </Toast.Header>
                <Toast.Body>
                    <div className="mb-3">
                        <p className="mb-2 fs-sm">
                            You have been successfully signed out from your account.
                        </p>
                    </div>
                </Toast.Body>
            </Toast>
        </div>
    );
};

export default SignOutToast;