import { useState } from 'react'

export const useToast = () => {
    const [toasts, setToasts] = useState({
        success: { show: false, message: '', title: 'Success' },
        error: { show: false, message: '', title: 'Error' },
        info: { show: false, message: '', title: 'Information' },
        warning: { show: false, message: '', title: 'Warning' },
        primary: { show: false, message: '', title: 'Notification' },
        accent: { show: false, message: '', title: 'Notice' }
    })

    const showSuccess = (message, title = 'Success') => {
        setToasts(prev => ({
            ...prev,
            success: { show: true, message, title }
        }))
    }

    const showError = (message, title = 'Error') => {
        setToasts(prev => ({
            ...prev,
            error: { show: true, message, title }
        }))
    }

    const showInfo = (message, title = 'Information') => {
        setToasts(prev => ({
            ...prev,
            info: { show: true, message, title }
        }))
    }

    const showWarning = (message, title = 'Warning') => {
        setToasts(prev => ({
            ...prev,
            warning: { show: true, message, title }
        }))
    }

    const showPrimary = (message, title = 'Notification') => {
        setToasts(prev => ({
            ...prev,
            primary: { show: true, message, title }
        }))
    }

    const showAccent = (message, title = 'Notice') => {
        setToasts(prev => ({
            ...prev,
            accent: { show: true, message, title }
        }))
    }

    const hideSuccess = () => {
        setToasts(prev => ({
            ...prev,
            success: { ...prev.success, show: false }
        }))
    }

    const hideError = () => {
        setToasts(prev => ({
            ...prev,
            error: { ...prev.error, show: false }
        }))
    }

    const hideInfo = () => {
        setToasts(prev => ({
            ...prev,
            info: { ...prev.info, show: false }
        }))
    }

    const hideWarning = () => {
        setToasts(prev => ({
            ...prev,
            warning: { ...prev.warning, show: false }
        }))
    }

    const hidePrimary = () => {
        setToasts(prev => ({
            ...prev,
            primary: { ...prev.primary, show: false }
        }))
    }

    const hideAccent = () => {
        setToasts(prev => ({
            ...prev,
            accent: { ...prev.accent, show: false }
        }))
    }

    return {
        toasts,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showPrimary,
        showAccent,
        hideSuccess,
        hideError,
        hideInfo,
        hideWarning,
        hidePrimary,
        hideAccent
    }
}