import {useEffect} from 'react'
import Toast from 'react-bootstrap/Toast'

const AccentToast = ({
                         show,
                         onClose,
                         title = "Notice",
                         message,
                         delay = 4000
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
                <Toast.Header closeVariant='white' className='bg-accent text-white'>
                    <i className='fi-lock me-2'></i>
                    <span className='fw-bold me-auto'>{title}</span>
                    <small className='text-white-50'>just now</small>
                </Toast.Header>
                <Toast.Body>
                    <div className="mb-3">
                        <p className="mb-2 fs-sm text-accent">
                            {message}
                        </p>
                    </div>
                </Toast.Body>
            </Toast>
        </div>
    )
}

export default AccentToast