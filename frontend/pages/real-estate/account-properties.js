import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import RealEstatePageLayout from '../../components/partials/RealEstatePageLayout'
import RealEstateAccountLayout from '../../components/partials/RealEstateAccountLayout'
import Link from 'next/link'
import Nav from 'react-bootstrap/Nav'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Pagination from 'react-bootstrap/Pagination'
import Alert from 'react-bootstrap/Alert'
import PropertyCard from '../../components/PropertyCard'
import {transformDatabaseProperty} from '../../utils/propertyTransform'
import {useProperties} from '../../hooks/useProperties'
import {batchPropertyOperations, preloadPropertyImages} from '../../utils/analyticsUtils'
import api from '../../services/api'

const AccountPropertiesPage = () => {
  const router = useRouter()
  const {
    properties: dbProperties,
    loading,
    error,
    isRefreshing,
    updatePropertyStatus: updateStatus,
    updateMultiplePropertyStatuses,
    forceRefreshData,
    clearError
  } = useProperties()

  // State management - Draft still remains default
  const [activeTab, setActiveTab] = useState('draft')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState(null)
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [bulkActionType, setBulkActionType] = useState('')
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)
  const [optimisticUpdates, setOptimisticUpdates] = useState({})
  const [operationError, setOperationError] = useState('')

  // Refs
  const initialLoadDoneRef = useRef(false)
  const propertiesPerPage = 6

  // Initial data loading
  useEffect(() => {
    if (initialLoadDoneRef.current) return

    const loadInitialData = async () => {
      initialLoadDoneRef.current = true
      try {
        await forceRefreshData(true)
        setTimeout(() => {
          if (dbProperties?.length > 0) {
            const transformedProperties = dbProperties.map(transformDatabaseProperty)
            preloadPropertyImages(transformedProperties)
          }
        }, 3000)
      } catch (error) {
        // Silent error handling
      }
    }

    loadInitialData()
  }, [forceRefreshData])

  // Auto-refresh mechanisms
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => forceRefreshData(), 500)
      }
    }

    const handlePageShow = (event) => {
      if (event.persisted) {
        forceRefreshData()
      }
    }

    const handleRouteChange = () => {
      if (router.asPath.includes('account-properties')) {
        setTimeout(() => forceRefreshData(), 200)
      }
    }

    const handleFocus = () => {
      forceRefreshData()
    }

    const autoRefreshInterval = setInterval(() => {
      if (!document.hidden) {
        forceRefreshData()
      }
    }, 30000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
      router.events.off('routeChangeComplete', handleRouteChange)
      clearInterval(autoRefreshInterval)
    }
  }, [router, forceRefreshData])

  // Transform properties with optimistic updates
  const properties = useMemo(() => {
    if (!dbProperties.length) return []

    const transformed = dbProperties.map(transformDatabaseProperty)
    return transformed.map(property => {
      const optimisticUpdate = optimisticUpdates[property.id]
      return optimisticUpdate ? { ...property, ...optimisticUpdate } : property
    })
  }, [dbProperties, optimisticUpdates])

  // Filter and sort properties
  const processedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesTab = property.status === activeTab
      const matchesSearch = searchTerm === '' ||
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesTab && matchesSearch
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'price-high':
          return parseFloat(b.price.replace(/[^0-9.-]+/g, "")) - parseFloat(a.price.replace(/[^0-9.-]+/g, ""))
        case 'price-low':
          return parseFloat(a.price.replace(/[^0-9.-]+/g, "")) - parseFloat(b.price.replace(/[^0-9.-]+/g, ""))
        case 'views-total':
          return (b.analytics?.views || 0) - (a.analytics?.views || 0)
        case 'views-month':
          return (b.analytics?.viewsThisMonth || 0) - (a.analytics?.viewsThisMonth || 0)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'promoted':
          return (b.isPromoted ? 1 : 0) - (a.isPromoted ? 1 : 0)
        default:
          return 0
      }
    })

    return filtered
  }, [properties, activeTab, searchTerm, sortBy])

  // Pagination
  const totalPages = Math.ceil(processedProperties.length / propertiesPerPage)
  const paginatedProperties = processedProperties.slice(
      (currentPage - 1) * propertiesPerPage,
      currentPage * propertiesPerPage
  )

  // Real-time counts calculation
  const counts = useMemo(() => {
    return {
      published: properties.filter(p => p.status === 'published').length,
      draft: properties.filter(p => p.status === 'draft').length,
      archived: properties.filter(p => p.status === 'archived').length
    }
  }, [properties])

  // Analytics calculation for current tab
  const getTabAnalytics = useMemo(() => {
    const currentTabProperties = properties.filter(p => p.status === activeTab)
    const totalViews = currentTabProperties.reduce((sum, p) => sum + (p.analytics?.views || 0), 0)
    const monthlyViews = currentTabProperties.reduce((sum, p) => sum + (p.analytics?.viewsThisMonth || 0), 0)

    return {
      totalViews,
      totalViewsThisMonth: monthlyViews
    }
  }, [properties, activeTab])

  // Event handlers
  const handleTabChange = useCallback((selectedKey) => {
    setActiveTab(selectedKey)
    setCurrentPage(1)
    setOperationError('')
    setTimeout(() => forceRefreshData(), 100)
  }, [forceRefreshData])

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((sortValue) => {
    setSortBy(sortValue)
    setCurrentPage(1)
  }, [])

  // Property status change
  const changePropertyStatus = useCallback(async (propertyId, newStatus) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [propertyId]: { status: newStatus }
    }))
    setOperationError('')

    try {
      const result = await updateStatus(propertyId, newStatus)
      if (!result.success) {
        setOptimisticUpdates(prev => {
          const updated = { ...prev }
          delete updated[propertyId]
          return updated
        })
        setOperationError(`Failed to update property status: ${result.error}`)
        return
      }

      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[propertyId]
        return updated
      })

      setTimeout(() => forceRefreshData(), 300)
    } catch (error) {
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[propertyId]
        return updated
      })
      setOperationError(`Error updating property status: ${error.message}`)
    }
  }, [updateStatus, forceRefreshData])

  // Promote property function
  const promoteProperty = useCallback(async (propertyId) => {
    const currentProperty = properties.find(p => p.id === propertyId)
    const newPromotedState = !currentProperty?.isPromoted

    setOptimisticUpdates(prev => ({
      ...prev,
      [propertyId]: { isPromoted: newPromotedState }
    }))

    try {
      const timestamp = Date.now()
      const response = await api.put(`/properties/${propertyId}/promote?_t=${timestamp}`, {
        promoted: newPromotedState
      })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to promote property')
      }

      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[propertyId]
        return updated
      })

      setTimeout(() => forceRefreshData(), 300)
    } catch (error) {
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[propertyId]
        return updated
      })
      setOperationError(`Failed to promote property: ${error.response?.data?.message || error.message}`)
    }
  }, [properties, forceRefreshData])

  const restoreProperty = useCallback((propertyId) => {
    changePropertyStatus(propertyId, 'draft')
  }, [changePropertyStatus])

  // Bulk operations
  const handleConfirmBulkAction = async () => {
    setBulkOperationLoading(true)
    setOperationError('')

    try {
      const propertiesInTab = processedProperties

      if (bulkActionType === 'archive') {
        const updates = propertiesInTab.map(property => ({
          propertyId: property.id,
          status: 'archived'
        }))

        const result = await updateMultiplePropertyStatuses(updates)
        if (result.failed?.length > 0) {
          setOperationError(`${result.failed.length} properties failed to archive`)
        }
      } else if (bulkActionType === 'delete') {
        const deleteOperations = propertiesInTab.map(property => ({
          method: 'delete',
          url: `/properties/${property.id}`,
          data: null
        }))

        const results = await batchPropertyOperations(deleteOperations)
        const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length

        if (failed > 0) {
          setOperationError(`${failed} properties failed to delete`)
        }
      }

      setTimeout(() => forceRefreshData(), 500)
    } catch (error) {
      setOperationError(`Bulk operation failed: ${error.message}`)
    } finally {
      setBulkOperationLoading(false)
      setShowBulkActionModal(false)
      setBulkActionType('')
    }
  }

  // Delete confirmation
  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return
    setOperationError('')

    try {
      if (propertyToDelete.status === 'draft') {
        await changePropertyStatus(propertyToDelete.id, 'archived')
      } else if (propertyToDelete.status === 'archived') {
        const deleteOperations = [{
          method: 'delete',
          url: `/properties/${propertyToDelete.id}`,
          data: null
        }]

        const results = await batchPropertyOperations(deleteOperations)
        const deleteResult = results[0]

        if (deleteResult.status === 'rejected' || !deleteResult.value?.success) {
          setOperationError('Failed to delete property')
          return
        }

        setTimeout(() => forceRefreshData(), 300)
      }
    } catch (error) {
      setOperationError(`Error deleting property: ${error.message}`)
    } finally {
      setShowDeleteModal(false)
      setPropertyToDelete(null)
    }
  }

  // Modal handlers
  const handleDeleteClick = useCallback((property) => {
    setPropertyToDelete(property)
    setShowDeleteModal(true)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false)
    setPropertyToDelete(null)
  }, [])

  const handleBulkActionClick = useCallback((actionType) => {
    setBulkActionType(actionType)
    setShowBulkActionModal(true)
  }, [])

  const handleCancelBulkAction = useCallback(() => {
    setShowBulkActionModal(false)
    setBulkActionType('')
  }, [])

  const deleteAll = useCallback((e) => {
    e.preventDefault()
    switch (activeTab) {
      case 'published':
        return
      case 'draft':
        handleBulkActionClick('archive')
        break
      case 'archived':
        handleBulkActionClick('delete')
        break
      default:
        return
    }
  }, [activeTab, handleBulkActionClick])

  // Utility functions
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getTabDescription = (tab) => {
    switch (tab) {
      case 'draft':
        return 'Review and publish your draft properties to make them visible to potential buyers and renters.'
      case 'published':
        return 'Your published properties are live and visible to potential buyers and renters.'
      case 'archived':
        return 'Archived properties can be restored or permanently deleted.'
      default:
        return 'Manage your property listings effectively.'
    }
  }

  const getEmptyStateMessage = (activeTab) => {
    switch (activeTab) {
      case 'published':
        return "No published properties! Publish your drafts to make them live."
      case 'draft':
        return "No draft properties! Create new properties to get started."
      case 'archived':
        return "No archived properties! Deleted drafts will appear here."
      default:
        return "No properties found!"
    }
  }

  const getDropdownOptions = (property, activeTab, changePropertyStatus, handleDeleteClick, promoteProperty, restoreProperty) => {
    const options = []

    if (activeTab !== 'archived') {
      options.push({
        icon: 'fi-edit',
        label: 'Edit',
        props: { onClick: () => console.log('Edit property', property.id) }
      })
    }

    if (activeTab === 'published') {
      options.push(
          {
            icon: property.isPromoted ? 'fi-star-filled' : 'fi-flame',
            label: property.isPromoted ? 'Remove Promotion' : 'Promote Property',
            props: { onClick: () => promoteProperty(property.id) }
          },
          {
            icon: 'fi-power',
            label: 'Deactivate',
            props: { onClick: () => changePropertyStatus(property.id, 'draft') }
          }
      )
    } else if (activeTab === 'draft') {
      options.push(
          {
            icon: 'fi-check',
            label: 'Publish',
            props: { onClick: () => changePropertyStatus(property.id, 'published') }
          },
          {
            icon: 'fi-archive',
            label: 'Archive',
            props: { onClick: () => changePropertyStatus(property.id, 'archived') }
          },
          {
            icon: 'fi-trash',
            label: 'Delete',
            props: { onClick: () => handleDeleteClick(property) }
          }
      )
    } else if (activeTab === 'archived') {
      options.push(
          {
            icon: 'fi-refresh-cw',
            label: 'Restore to Draft',
            props: { onClick: () => restoreProperty(property.id) }
          },
          {
            icon: 'fi-trash',
            label: 'Delete Permanently',
            props: { onClick: () => handleDeleteClick(property) }
          }
      )
    }

    return options
  }

  // Analytics card component
  const AnalyticsCard = ({ property }) => {
    const { analytics, createdAt, status } = property
    const shouldShowAnalytics = status === 'published' || status === 'archived' || (status === 'draft' && analytics?.views > 0)

    if (!shouldShowAnalytics) return null

    const hasViews = analytics?.views > 0
    const hasMonthlyViews = status === 'published' && analytics?.viewsThisMonth > 0

    return (
        <div className='card border-0 bg-light mt-2'>
          <div className='card-body py-2 px-3'>
            <div className='d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between'>
              <div className='d-flex align-items-center text-muted small mb-2 mb-md-0'>
                <i className='fi-calendar me-2 opacity-60'></i>
                <span className='fw-medium'>Created: {formatDate(createdAt)}</span>
              </div>
              <div className='d-flex align-items-center flex-wrap gap-3'>
                {status === 'published' && (
                    <div className='d-flex align-items-center text-muted small'>
                      <i className='fi-eye me-2 opacity-60'></i>
                      <span className='fw-medium'>{formatNumber(analytics?.views || 0)} views</span>
                    </div>
                )}
                {(status === 'archived' || status === 'draft') && hasViews && (
                    <div className='d-flex align-items-center text-muted small'>
                      <i className='fi-eye me-2 opacity-60'></i>
                      <span className='fw-medium'>{formatNumber(analytics.views)} views</span>
                    </div>
                )}
                {hasMonthlyViews && (
                    <div className='d-flex align-items-center text-success small'>
                      <i className='fi-trending-up me-2'></i>
                      <span className='fw-medium'>{formatNumber(analytics.viewsThisMonth)}+ this month</span>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
    )
  }

  // Loading state
  if ((loading || isRefreshing) && properties.length === 0) {
    return (
        <RealEstatePageLayout pageTitle='Account My Properties' activeNav='Account' userLoggedIn>
          <RealEstateAccountLayout accountPageTitle='My Properties'>
            <div className='text-center pt-5'>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className='mt-3 text-muted'>
                {isRefreshing ? 'Refreshing your properties...' : 'Loading your properties...'}
              </p>
            </div>
          </RealEstateAccountLayout>
        </RealEstatePageLayout>
    )
  }

  // Error state
  if (error) {
    return (
        <RealEstatePageLayout pageTitle='Account My Properties' activeNav='Account' userLoggedIn>
          <RealEstateAccountLayout accountPageTitle='My Properties'>
            <div className='text-center pt-5'>
              <i className='fi-rotate-right display-6 text-danger mb-4'></i>
              <h2 className='h5 mb-4 text-danger'>Error loading properties</h2>
              <Button variant='primary' onClick={() => {
                clearError()
                forceRefreshData(true)
              }}>
                Try Again
              </Button>
            </div>
          </RealEstateAccountLayout>
        </RealEstatePageLayout>
    )
  }

  return (
      <RealEstatePageLayout pageTitle='Account My Properties' activeNav='Account' userLoggedIn>
        <RealEstateAccountLayout accountPageTitle='My Properties'>
          {operationError && (
              <Alert variant="danger" dismissible onClose={() => setOperationError('')} className="mb-4">
                {operationError}
              </Alert>
          )}

          <div className='d-flex align-items-center justify-content-between mb-3'>
            <h1 className='h2 mb-0'>My Properties</h1>
            <div className='d-flex align-items-center'>
              {processedProperties.length > 0 && activeTab !== 'published' && (
                  <a href='#' className='fw-bold text-decoration-none' onClick={deleteAll}>
                    <i className='fi-trash mt-n1 me-2'></i>
                    {activeTab === 'draft' ? 'Archive all' : 'Delete all'}
                  </a>
              )}
            </div>
          </div>

          <p className='pt-1 mb-4 text-muted'>{getTabDescription(activeTab)}</p>

          {/* 🚀 UPDATED: Tab navigation with Drafts in the middle */}
          <Nav
              variant='tabs'
              activeKey={activeTab}
              onSelect={handleTabChange}
              className='border-bottom mb-2'
          >
            <Nav.Item className='mb-3'>
              <Nav.Link eventKey='published'>
                <i className='fi-file fs-base me-2'></i>
                Published
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className='mb-3'>
              <Nav.Link eventKey='draft'>
                <i className='fi-file-clean fs-base me-2'></i>
                Drafts
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className='mb-3'>
              <Nav.Link eventKey='archived'>
                <i className='fi-archive fs-base me-2'></i>
                Archived
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* 🚀 UPDATED: Property Counts Overview - Reordered to match tabs */}
          <div className='mb-4'>
            <Row>
              <Col xs={4} sm={4} md={4} className='ms-4 px-2' style={{width:'28%'}}>
                <div className='text-color-accent small mb-1'>Published:
                  <span className='text-color-accent text-muted' style={{fontWeight: 'bold'}}> {counts.published}</span>
                </div>
              </Col>
              <Col xs={4} sm={4} md={4} className='ms-1' style={{width: '22%'}}>
                <div className='text-color-accent small mb-1'>Drafts:
                  <span className='text-muted text-color-accent' style={{fontWeight: 'bold'}}> {counts.draft}</span>
                </div>
              </Col>
              <Col xs={4} sm={4} md={4} style={{width:'30%'}}>
                <div className='text-color-accent small mb-1'>Archived:
                  <span className='text-color-accent text-muted' style={{fontWeight: 'bold'}}> {counts.archived}</span>
                </div>
              </Col>

              {(activeTab === 'published' || activeTab === 'archived') && getTabAnalytics.totalViews > 0 && (
                  <>
                    <Col xs={6} sm={6} md={3} className='text-center text-md-start'>
                      <div className='text-muted small'>
                        <i className='fi-eye me-1'></i>
                        <span className='fw-medium'>{formatNumber(getTabAnalytics.totalViews)} total views</span>
                      </div>
                    </Col>

                    {activeTab === 'published' && getTabAnalytics.totalViewsThisMonth > 0 && (
                        <Col xs={6} sm={6} md={3} className='text-center text-md-start'>
                          <div className='text-success small'>
                            <i className='fi-trending-up me-1'></i>
                            <span className='fw-medium'>{formatNumber(getTabAnalytics.totalViewsThisMonth)} this month</span>
                          </div>
                        </Col>
                    )}
                  </>
              )}
            </Row>
          </div>

          <Row className='mb-4'>
            <Col md={6} lg={6}>
              <Form.Control
                  type='text'
                  placeholder={`Search ${activeTab} properties...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className='mb-3'
              />
            </Col>
            <Col md={6} lg={6}>
              <Form.Select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} className='mb-3'>
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
                <option value='price-high'>Price: High to Low</option>
                <option value='price-low'>Price: Low to High</option>
                <option value='title'>Title A-Z</option>
                {(activeTab === 'published' || activeTab === 'archived') && <option value='views-total'>Most Total Views</option>}
                {activeTab === 'published' && <option value='views-month'>Most Monthly Views</option>}
                {activeTab === 'published' && <option value='promoted'>Promoted First</option>}
              </Form.Select>
            </Col>
          </Row>

          {paginatedProperties.length > 0 && (
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <small className='text-muted'>
                  Showing {((currentPage - 1) * propertiesPerPage) + 1} to {Math.min(currentPage * propertiesPerPage, processedProperties.length)} of {processedProperties.length} properties
                </small>
                {activeTab === 'archived' && (
                    <small className='text-info'>
                      <i className='fi-info-circle me-1'></i>
                      Auto-deleted after 30 days
                    </small>
                )}
              </div>
          )}

          {paginatedProperties.length ? paginatedProperties.map((property) => (
              <div key={property.id} className='mb-4'>
                <PropertyCard
                    href={property.href}
                    images={property.images}
                    category={property.category}
                    title={property.title}
                    location={property.location}
                    price={property.price}
                    badges={[
                      ...property.badges,
                      ...(property.isPromoted ? [['success', 'Promoted']] : [])
                    ]}
                    footer={[
                      ['fi-bed', property.amenities[0]],
                      ['fi-bath', property.amenities[1]],
                      ['fi-car', property.amenities[2]]
                    ]}
                    dropdown={getDropdownOptions(property, activeTab, changePropertyStatus, handleDeleteClick, promoteProperty, restoreProperty)}
                    horizontal
                />
                <AnalyticsCard property={property} />
              </div>
          )) : (
              <div className='text-center pt-2 pt-md-4 pt-lg-5 pb-2 pb-md-0'>
                <i className='fi-home display-6 text-muted mb-4'></i>
                <h2 className='h5 mb-4'>
                  {searchTerm ? `No ${activeTab} properties found for "${searchTerm}"` : getEmptyStateMessage(activeTab)}
                </h2>
                {searchTerm && (
                    <Button variant='outline-primary' onClick={() => setSearchTerm('')} className='me-3'>
                      Clear Search
                    </Button>
                )}
                <Button as={Link} href='/real-estate/add-property' variant='primary'>
                  <i className='fi-plus fs-sm me-2'></i>
                  Add New Property
                </Button>
              </div>
          )}

          {totalPages > 1 && (
              <div className='d-flex justify-content-center mt-5'>
                <Pagination>
                  <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                  <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                          <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                            {page}
                          </Pagination.Item>
                      )
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <Pagination.Ellipsis key={page} />
                    }
                    return null
                  })}
                  <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} />
                  <Pagination.Last disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} />
                </Pagination>
              </div>
          )}

          {/* Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className='fi-alert-triangle text-warning me-2'></i>
                Confirm Action
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {propertyToDelete && (
                  <p>
                    {propertyToDelete.status === 'draft'
                        ? 'Are you sure you want to archive this property? You can restore it later from the archived tab.'
                        : 'Are you sure you want to permanently delete this property? This action cannot be undone.'
                    }
                  </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' onClick={handleCancelDelete}>Cancel</Button>
              <Button
                  variant={propertyToDelete?.status === 'draft' ? 'primary' : 'danger'}
                  onClick={handleConfirmDelete}
              >
                {propertyToDelete?.status === 'draft' ? 'Archive Property' : 'Delete Permanently'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Bulk Action Confirmation Modal */}
          <Modal show={showBulkActionModal} onHide={handleCancelBulkAction} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className='fi-alert-triangle text-warning me-2'></i>
                Confirm Bulk Action
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {bulkActionType === 'archive' ? (
                  <p>Are you sure you want to archive all <strong>{counts.draft}</strong> draft properties? They will be moved to the archived tab and can be restored later.</p>
              ) : (
                  <p>Are you sure you want to permanently delete all <strong>{counts.archived}</strong> archived properties? This action cannot be undone.</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' onClick={handleCancelBulkAction} disabled={bulkOperationLoading}>
                Cancel
              </Button>
              <Button
                  variant={bulkActionType === 'archive' ? 'primary' : 'danger'}
                  onClick={handleConfirmBulkAction}
                  disabled={bulkOperationLoading}
              >
                {bulkOperationLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                ) : (
                    bulkActionType === 'archive' ? `Archive ${counts.draft} Properties` : `Delete ${counts.archived} Properties`
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </RealEstateAccountLayout>
      </RealEstatePageLayout>
  )
}

export default AccountPropertiesPage