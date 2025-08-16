// components/AccountTypeSelection.js
import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

const AccountTypeSelection = ({ show, onHide, onSelect, isLoading, userInfo, ...props }) => {
    const [selectedType, setSelectedType] = useState('')
    const [error, setError] = useState('')

    const accountTypes = [
        {
            id: 'regular',
            title: 'Individual',
            subtitle: 'Searching for property',
            description: 'I am looking to buy, rent, or invest in properties',
            icon: 'fi-user',
            color: 'primary'
        },
        {
            id: 'property_owner',
            title: 'Property Owner',
            subtitle: 'I own properties',
            description: 'I want to list and manage my properties',
            icon: 'fi-home',
            color: 'success'
        },
        {
            id: 'agent',
            title: 'Estate Agent',
            subtitle: 'Real estate professional',
            description: 'I help clients buy, sell, and rent properties',
            icon: 'fi-briefcase',
            color: 'info'
        },
        {
            id: 'developer',
            title: 'Property Developer',
            subtitle: 'I develop properties',
            description: 'I build and develop residential/commercial properties',
            icon: 'fi-settings',
            color: 'warning'
        }
    ]

    const handleSelect = (typeId) => {
        setSelectedType(typeId)
        setError('')
    }

    const handleSubmit = () => {
        if (!selectedType) {
            setError('Please select an account type to continue')
            return
        }
        onSelect(selectedType)
    }

    const handleSkip = () => {
        onSelect('regular') // Default to regular if skipped
    }

    return (
        <Modal
            {...props}
            show={show}
            onHide={null} // Prevent closing
            size="lg"
            centered
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header className="border-0 pb-0">
                <div className="w-100 text-center">
                    <h3 className="modal-title">Welcome{userInfo?.firstName ? `, ${userInfo.firstName}` : ''}!</h3>
                    <p className="text-muted mb-0">Choose your account type to get started</p>
                </div>
            </Modal.Header>

            <Modal.Body className="px-4 pb-4">
                {error && (
                    <Alert variant="danger" className="text-center mb-4">
                        <i className="fi-alert-circle me-2"></i>
                        {error}
                    </Alert>
                )}

                <Row className="g-3">
                    {accountTypes.map((type) => (
                        <Col md={6} key={type.id}>
                            <Card
                                className={`account-type-card cursor-pointer h-100 ${
                                    selectedType === type.id ? `border-${type.color} shadow-sm` : 'border-light'
                                }`}
                                onClick={() => handleSelect(type.id)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: selectedType === type.id ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <Card.Body className="text-center p-4">
                                    <div
                                        className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-${type.color} bg-opacity-10`}
                                        style={{ width: '60px', height: '60px' }}
                                    >
                                        <i className={`${type.icon} fs-2 text-${type.color}`}></i>
                                    </div>

                                    <h5 className="card-title mb-1">{type.title}</h5>
                                    <p className={`text-${type.color} small fw-medium mb-2`}>{type.subtitle}</p>
                                    <p className="card-text text-muted small mb-0">{type.description}</p>

                                    {selectedType === type.id && (
                                        <div className="mt-3">
                                            <i className={`fi-check-circle text-${type.color} fs-4`}></i>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <div className="d-flex justify-content-between mt-4 pt-3">
                    <Button
                        variant="outline-secondary"
                        onClick={handleSkip}
                        disabled={isLoading}
                    >
                        Skip for now
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedType}
                    >
                        {isLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Setting up...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default AccountTypeSelection