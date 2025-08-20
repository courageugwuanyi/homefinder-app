import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Toast from 'react-bootstrap/Toast'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../../hooks/useAuth'

const AccountUpgradeToast = () => {
    const router = useRouter()
    const { user } = useAuth()
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (router.query.upgrade === 'required' && router.query.reason === 'add-property' && user?.accountType === 'individual') {
            setShow(true)
            // Clean up URL without redirecting or scrolling
            const cleanUrl = window.location.pathname + (window.location.search ? window.location.search.replace(/[?&]upgrade=required&reason=add-property/g, '').replace(/^&/, '?') : '')
            router.replace(cleanUrl, cleanUrl, { shallow: true, scroll: false })
        }
    }, [router.query, user, router])

    const handleClose = () => setShow(false)

    const handleUpgrade = () => {
        router.push('/real-estate/account-info')
        handleClose()
    }

    if (!show) return null

    return (
        <div className="position-fixed" style={{ top: '80px', right: '20px', zIndex: 1050 }}>
            <Toast show={show} onClose={handleClose}>
                <Toast.Header>
                    <div
                        className='d-inline-block align-middle bg-primary rounded-1 me-2'
                        style={{width: '1.25rem', height: '1.25rem'}}
                    ></div>
                    <h6 className='fs-sm mb-0 me-auto'>Account Upgrade Required</h6>
                    <small className='text-muted'>just now</small>
                </Toast.Header>
                <Toast.Body>
                    <div className="mb-3">
                        <p className="mb-2 fs-sm">
                            Your <span className="fw-semibold text-capitalize">{user?.accountType}</span> account is for searching properties only.
                        </p>
                        <p className="mb-3 fs-sm text-muted">
                            Upgrade to add and manage properties.
                        </p>
                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={handleClose}
                            >
                                Later
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={handleUpgrade}
                            >
                                Upgrade Account
                            </Button>
                        </div>
                    </div>
                </Toast.Body>
            </Toast>
        </div>
    )
}

export default AccountUpgradeToast