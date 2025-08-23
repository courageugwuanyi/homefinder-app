import {useEffect} from 'react'
import Toast from 'react-bootstrap/Toast'

const WarningToast = ({
                          show,
                          onClose,
                          title = "Warning",
                          message,
                          delay = 4500
                      }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose()
            }, delay)
            return () => clearTimeout(timer)
        }
    }, [show, onClose, delay])

    if (!show) return null

    return (
        <div className="position-fixed" style={{ top: '80px', right: '20px', zIndex: 1050 }}>
            <Toast show={show} onClose={onClose}>
                <Toast.Header closeVariant='white' className='bg-dark text-white'>
                    <i className='fi-alert-triangle me-2'></i>
                    <span className='fw-bold me-auto'>{title}</span>
                    <small className='text-white-50'>just now</small>
                </Toast.Header>
                <Toast.Body className='text-dark'>
                    <div className="mb-3">
                        <p className="mb-2 fs-sm text-dark">
                            {message}
                        </p>
                    </div>
                </Toast.Body>
            </Toast>
        </div>
    )
}

export default WarningToast