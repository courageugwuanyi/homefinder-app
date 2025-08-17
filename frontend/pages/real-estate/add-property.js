import {useCallback, useEffect, useState, useMemo} from 'react'
import RealEstatePageLayout from '../../components/partials/RealEstatePageLayout'
import Link from 'next/link'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Form from 'react-bootstrap/Form'
import Collapse from 'react-bootstrap/Collapse'
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Dropdown from 'react-bootstrap/Dropdown'
import StarRating from '../../components/StarRating'
import SocialButton from '../../components/SocialButton'
import ScrollLink from '../../components/ScrollLink'
import {FilePond, registerPlugin} from 'react-filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import FilePondPluginImageCrop from 'filepond-plugin-image-crop'
import FilePondPluginImageResize from 'filepond-plugin-image-resize'
import FilePondPluginImageTransform from 'filepond-plugin-image-transform'
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'
import {useAuth} from "../../hooks/useAuth"
import {useProperties} from "../../hooks/useProperties"
import 'leaflet/dist/leaflet.css'
import {useRouter} from "next/router"
import Spinner from 'react-bootstrap/Spinner'
import AddPropertyToast from "../../components/AddPropertyToast"

const AddPropertyPage = () => {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { addProperty, isSubmitting, submitError, clearSubmitError } = useProperties()

  // State management
  const [isServiced, setIsServiced] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  // Property configuration based on type
  const getPropertyConfig = useMemo(() => (propertyType) => {
    const configs = {
      // Residential properties
      apartment: {
        showBedrooms: true,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Living area (sq.m)',
        areaRequired: false,
        amenitiesType: 'residential'
      },
      duplex: {
        showBedrooms: true,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: true,
        showUnits: true,
        areaLabel: 'Total area (sq.m)',
        areaRequired: true,
        amenitiesType: 'residential'
      },
      bungalow: {
        showBedrooms: true,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Total area (sq.m)',
        areaRequired: true,
        amenitiesType: 'residential'
      },
      house: {
        showBedrooms: true,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: true,
        showUnits: false,
        areaLabel: 'Total area (sq.m)',
        areaRequired: true,
        amenitiesType: 'luxury'
      },
      // Commercial properties
      office: {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: true,
        showUnits: true,
        areaLabel: 'Office space (sq.m)',
        areaRequired: true,
        amenitiesType: 'commercial'
      },
      shop: {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Shop floor area (sq.m)',
        areaRequired: true,
        amenitiesType: 'commercial'
      },
      warehouse: {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Storage area (sq.m)',
        areaRequired: true,
        amenitiesType: 'industrial'
      },
      commercial: {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: true,
        showUnits: true,
        areaLabel: 'Commercial space (sq.m)',
        areaRequired: true,
        amenitiesType: 'commercial'
      },
      // Land properties
      plot: {
        showBedrooms: false,
        showBathrooms: false,
        showToilets: false,
        showParking: false,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Plot size (sq.m)',
        areaRequired: true,
        amenitiesType: 'land'
      },
      land: {
        showBedrooms: false,
        showBathrooms: false,
        showToilets: false,
        showParking: false,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Land size (sq.m)',
        areaRequired: true,
        amenitiesType: 'land'
      },
      farm: {
        showBedrooms: false,
        showBathrooms: false,
        showToilets: false,
        showParking: false,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Farm size (hectares)',
        areaRequired: true,
        amenitiesType: 'agricultural'
      },
      // Hospitality properties
      hotel: {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: true,
        showUnits: true,
        areaLabel: 'Total area (sq.m)',
        areaRequired: true,
        amenitiesType: 'hospitality'
      },
      'event-centre': {
        showBedrooms: false,
        showBathrooms: true,
        showToilets: true,
        showParking: true,
        showFloors: false,
        showUnits: false,
        areaLabel: 'Event space (sq.m)',
        areaRequired: true,
        amenitiesType: 'hospitality'
      }
    }
    return configs[propertyType] || configs.apartment
  }, [])

  // Enhanced amenities based on property type
  const getAmenitiesForType = useMemo(() => (amenitiesType) => {
    const amenitiesMap = {
      residential: [
        'WiFi', 'Air conditioning', 'Heating', 'Kitchen', 'Dishwasher',
        'Washing machine', 'TV', 'Balcony', 'Garden', 'Pool',
        'Gym', 'Security system', 'Elevator', 'Furnished', 'Pets allowed',
        'POP ceiling', 'Chandeliers', 'Water heater', 'Pantry',
        'Study room', 'Workspace', 'Family lounge', 'Ensuite bedrooms',
        'HVAC system', 'Bluetooth speakers', 'Modern structure',
        'Contemporary design', 'Stamp concrete floors', 'Interlock streets'
      ],
      luxury: [
        'WiFi', 'Air conditioning', 'Heating', 'Gourmet kitchen', 'Wine cellar',
        'Home theater', 'Cinema', 'Spa', 'Pool', 'Tennis court', 'Gym',
        'Security system', 'Elevator', 'Butler service', 'Landscaped gardens',
        'Furnished', 'Pets allowed',
        'POP ceiling', 'Chandeliers', 'Water heater', 'Pantry',
        'Study room', 'Workspace', 'Family lounge', 'Ensuite bedrooms',
        'HVAC system', 'Bluetooth speakers', 'Modern structure',
        'Contemporary design', 'Stamp concrete floors', 'Interlock streets',
        'Boys Quarters (BQ)', 'Smoke extractor', 'Smart home system'
      ],
      commercial: [
        'WiFi', 'Air conditioning', 'Heating', 'Reception area', 'Meeting rooms',
        'Kitchen/Break room', 'Security system', 'Elevator', 'Parking',
        'Backup generator', 'Conference facilities', 'Furnished',
        'HVAC system', 'Modern structure', 'Contemporary design',
        'Water heater', 'Smoke extractor', 'POP ceiling',
        'Stamp concrete floors', 'Interlock streets', 'Workspace areas'
      ],
      industrial: [
        'Loading dock', 'High ceilings', 'Forklift access', 'Security system',
        'Parking', 'Office space', 'Backup generator', 'Fire safety system',
        'Climate control', 'Heavy machinery access',
        'Modern structure', 'Smoke extractor', 'Water heater',
        'HVAC system', 'Stamp concrete floors'
      ],
      land: [
        'Fenced', 'Water access', 'Electricity connection', 'Road access',
        'Drainage', 'Survey plan', 'Title document', 'Development permit',
        'Interlock streets', 'Modern infrastructure'
      ],
      agricultural: [
        'Water source', 'Irrigation system', 'Farm buildings', 'Fenced',
        'Road access', 'Electricity', 'Storage facilities', 'Equipment shed',
        'Livestock facilities', 'Crop land', 'Modern farming infrastructure'
      ],
      hospitality: [
        'WiFi', 'Air conditioning', 'Restaurant', 'Bar', 'Pool',
        'Gym', 'Spa', 'Conference rooms', 'Parking', 'Room service',
        'Security system', 'Elevator', 'Event facilities', 'Catering kitchen',
        'HVAC system', 'Modern structure', 'Contemporary design',
        'Water heater', 'Chandeliers', 'POP ceiling', 'Cinema',
        'Bluetooth speakers', 'Smoke extractor'
      ]
    }
    return amenitiesMap[amenitiesType] || amenitiesMap.residential
  }, [])

  // Authentication redirects
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/real-estate')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && user && user.accountType === 'individual') {
      router.replace('/real-estate?upgrade=required&reason=add-property',
          '/real-estate?upgrade=required&reason=add-property', {
            scroll: false
          })
    }
  }, [isAuthenticated, user, router])

  // Helper functions
  const canAddProperties = (user) => {
    if (!user) return false;
    return user.accountType && user.accountType !== 'individual';
  };

  const splitFullName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' }
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    return { firstName, lastName }
  }

  // Get user's name parts
  const { firstName: userFirstName, lastName: userLastName } = splitFullName(user?.fullName)

  // Form state management with user data pre-populated
  const [formData, setFormData] = useState({
    title: '',
    category: 'rent',
    propertyType: 'apartment',
    businessType: 'Private seller',
    country: 'US',
    city: 'New York',
    district: 'Queens',
    zipCode: '',
    address: '',
    area: '',
    description: '',
    price: '',
    currency: 'usd',
    priceUnit: 'month',
    firstName: userFirstName || '',
    lastName: userLastName || '',
    email: user?.email || '',
    phone: '',
    company: ''
  })

  // Update form data when user info changes
  useEffect(() => {
    if (user && isAuthenticated) {
      const { firstName: newFirstName, lastName: newLastName } = splitFullName(user.fullName)
      setFormData(prev => ({
        ...prev,
        firstName: newFirstName || prev.firstName,
        lastName: newLastName || prev.lastName,
        email: user.email || prev.email
      }))
    }
  }, [user, isAuthenticated])

  // Reset price unit when category changes to sale
  useEffect(() => {
    if (formData.category === 'sale') {
      setFormData(prev => ({
        ...prev,
        priceUnit: 'total'
      }))
    } else if (formData.priceUnit === 'total') {
      setFormData(prev => ({
        ...prev,
        priceUnit: 'month'
      }))
    }
  }, [formData.category])

  // Company validation effect - Handle business type changes
  useEffect(() => {
    if (formData.businessType === 'Private seller') {
      if (formData.company) {
        setFormData(prev => ({ ...prev, company: '' }))
      }
      if (validationErrors.company) {
        setValidationErrors(prev => ({ ...prev, company: false }))
      }
    } else if (formData.businessType === 'Business') {
      if (!formData.company) {
        setValidationErrors(prev => ({ ...prev, company: true }))
      } else {
        setValidationErrors(prev => ({ ...prev, company: false }))
      }
    }
  }, [formData.businessType, formData.company])

  // Clear submit error when form changes
  useEffect(() => {
    if (submitError) {
      clearSubmitError()
    }
  }, [formData, submitError, clearSubmitError])

  // Get current property configuration
  const currentPropertyConfig = useMemo(() =>
          getPropertyConfig(formData.propertyType),
      [formData.propertyType, getPropertyConfig]
  )

  // Get current amenities list
  const currentAmenitiesList = useMemo(() =>
          getAmenitiesForType(currentPropertyConfig.amenitiesType),
      [currentPropertyConfig.amenitiesType, getAmenitiesForType]
  )

  // Check if serviced option should be shown
  const showServicedOption = useMemo(() => {
    return formData.category !== 'sale' &&
        (currentPropertyConfig.showBedrooms ||
            currentPropertyConfig.amenitiesType === 'commercial' ||
            currentPropertyConfig.amenitiesType === 'hospitality')
  }, [formData.category, currentPropertyConfig])

  // Progress tracking state
  const [sectionProgress, setSectionProgress] = useState({
    basicInfo: false,
    location: false,
    details: false,
    price: false,
    photos: false,
    contacts: false
  })

  // Other states
  const [previewShow, setPreviewShow] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [amenitiesOpen, setAmenitiesOpen] = useState(false)
  const [bedroomsValue, setBedroomsValue] = useState('1')
  const [bathroomsValue, setBathroomsValue] = useState('1')
  const [toiletsValue, setToiletsValue] = useState('1')
  const [parkingsValue, setParkingsValue] = useState('1')
  const [floorsValue, setFloorsValue] = useState('1')
  const [unitsValue, setUnitsValue] = useState('1')
  const [gallery, setGallery] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [selectedAmenities, setSelectedAmenities] = useState([])

  // Register Filepond plugins
  registerPlugin(
      FilePondPluginFileValidateType,
      FilePondPluginFileValidateSize,
      FilePondPluginImagePreview,
      FilePondPluginImageCrop,
      FilePondPluginImageResize,
      FilePondPluginImageTransform
  )

  // File helper functions
  const isImageFile = (file) => {
    if (!file) return false
    const type = file.type || file.file?.type
    return type && type.startsWith('image/')
  }

  const isVideoFile = (file) => {
    if (!file) return false
    const type = file.type || file.file?.type
    return type && type.startsWith('video/')
  }

  const createPreviewUrl = useCallback((file) => {
    try {
      if (file.file && file.file instanceof File) {
        return URL.createObjectURL(file.file)
      }
      if (file.source) {
        return file.source
      }
      return null
    } catch (error) {
      console.error('Error creating preview URL:', error)
      return null
    }
  }, [])

  // Generate preview URLs when gallery changes
  useEffect(() => {
    if (gallery.length > 0) {
      const previews = gallery.map((file, index) => {
        const previewUrl = createPreviewUrl(file)
        return {
          id: index,
          url: previewUrl,
          isImage: isImageFile(file),
          isVideo: isVideoFile(file),
          name: file.filename || file.file?.name || `File ${index + 1}`,
          originalFile: file
        }
      }).filter(preview => preview.url !== null)
      setGalleryPreviews(previews)
    } else {
      setGalleryPreviews([])
    }

    return () => {
      galleryPreviews.forEach(preview => {
        if (preview.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url)
        }
      })
    }
  }, [gallery, createPreviewUrl])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      galleryPreviews.forEach(preview => {
        if (preview.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url)
        }
      })
    }
  }, [])

  // Check if company is required based on business type
  const isCompanyRequired = useMemo(() => {
    return formData.businessType === 'Business'
  }, [formData.businessType])

  // Function to check section completion
  const checkSectionCompletion = useCallback(() => {
    const config = currentPropertyConfig

    let detailsComplete = true

    if (config.areaRequired) {
      detailsComplete = detailsComplete && !!formData.area
    }

    if (config.showBedrooms) detailsComplete = detailsComplete && !!bedroomsValue
    if (config.showBathrooms) detailsComplete = detailsComplete && !!bathroomsValue
    if (config.showToilets) detailsComplete = detailsComplete && !!toiletsValue
    if (config.showParking) detailsComplete = detailsComplete && !!parkingsValue

    const companyComplete = !isCompanyRequired || (isCompanyRequired && !!formData.company)

    const newProgress = {
      basicInfo: !!(formData.title && formData.category && formData.propertyType && formData.businessType),
      location: !!(formData.country && formData.city && formData.district && formData.zipCode && formData.address),
      details: detailsComplete,
      price: !!formData.price,
      photos: gallery.length > 0,
      contacts: !!(formData.firstName && formData.lastName && formData.email && formData.phone && companyComplete)
    }

    setSectionProgress(newProgress)
  }, [formData, bedroomsValue, bathroomsValue, toiletsValue, parkingsValue, gallery, currentPropertyConfig, isCompanyRequired])

  // Calculate overall progress percentage
  const calculateProgress = useCallback(() => {
    const completedSections = Object.values(sectionProgress).filter(Boolean).length
    return Math.round((completedSections / 6) * 100)
  }, [sectionProgress])

  // Form validation function
  const validateForm = useCallback(() => {
    const errors = {}

    // Required field validations
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.category) errors.category = 'Category is required'
    if (!formData.propertyType) errors.propertyType = 'Property type is required'
    if (!formData.country) errors.country = 'Country is required'
    if (!formData.city) errors.city = 'City is required'
    if (!formData.district) errors.district = 'District is required'
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required'
    if (!formData.address.trim()) errors.address = 'Address is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.price) errors.price = 'Price is required'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'

    // Company validation for businesses
    if (isCompanyRequired && !formData.company.trim()) {
      errors.company = 'Company name is required for registered businesses'
    }

    // Area validation if required
    if (currentPropertyConfig.areaRequired && !formData.area) {
      errors.area = 'Area is required for this property type'
    }

    // Gallery validation
    if (gallery.length === 0) {
      errors.gallery = 'At least one photo or video is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, isCompanyRequired, currentPropertyConfig.areaRequired, gallery.length])

  // Prepare form data for submission
  const prepareFormData = useCallback(() => {
    const formDataToSubmit = new FormData()

    // Basic property information
    formDataToSubmit.append('title', formData.title.trim())
    formDataToSubmit.append('category', formData.category)
    formDataToSubmit.append('propertyType', formData.propertyType)
    formDataToSubmit.append('businessType', formData.businessType)

    // Location details
    formDataToSubmit.append('country', formData.country)
    formDataToSubmit.append('city', formData.city)
    formDataToSubmit.append('district', formData.district)
    formDataToSubmit.append('zipCode', formData.zipCode.trim())
    formDataToSubmit.append('address', formData.address.trim())

    // Property details
    if (formData.area) formDataToSubmit.append('area', formData.area)
    formDataToSubmit.append('description', formData.description.trim())

    // Price information
    formDataToSubmit.append('price', formData.price)
    formDataToSubmit.append('currency', formData.currency)
    formDataToSubmit.append('priceUnit', formData.priceUnit)

    // Contact information
    formDataToSubmit.append('phone', formData.phone.trim())
    if (formData.company) formDataToSubmit.append('company', formData.company.trim())

    // Property-specific fields based on configuration
    if (currentPropertyConfig.showBedrooms) {
      formDataToSubmit.append('bedrooms', bedroomsValue)
    }
    if (currentPropertyConfig.showBathrooms) {
      formDataToSubmit.append('bathrooms', bathroomsValue)
    }
    if (currentPropertyConfig.showToilets) {
      formDataToSubmit.append('toilets', toiletsValue)
    }
    if (currentPropertyConfig.showParking) {
      formDataToSubmit.append('parking', parkingsValue)
    }
    if (currentPropertyConfig.showFloors) {
      formDataToSubmit.append('floors', floorsValue)
    }
    if (currentPropertyConfig.showUnits) {
      formDataToSubmit.append('units', unitsValue)
    }

    // Serviced property
    if (showServicedOption) {
      formDataToSubmit.append('isServiced', isServiced)
    }

    // Amenities
    if (selectedAmenities.length > 0) {
      formDataToSubmit.append('amenities', JSON.stringify(selectedAmenities))
    }

    // Files (gallery)
    gallery.forEach((fileItem, index) => {
      if (fileItem.file) {
        formDataToSubmit.append('gallery', fileItem.file)
      }
    })

    return formDataToSubmit
  }, [
    formData,
    currentPropertyConfig,
    bedroomsValue,
    bathroomsValue,
    toiletsValue,
    parkingsValue,
    floorsValue,
    unitsValue,
    showServicedOption,
    isServiced,
    selectedAmenities,
    gallery
  ])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0]
      if (firstErrorField) {
        const element = document.getElementById(`ap-${firstErrorField}`) ||
            document.getElementById(`ab-${firstErrorField}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }
      return
    }

    const propertyData = prepareFormData()
    const result = await addProperty(propertyData)

    if (result.success) {
      setShowSuccessAlert(true)

      // Redirect after success
      setTimeout(() => {
        router.push('/real-estate/property-promotion')
      }, 2000)
    }
  }, [validateForm, validationErrors, prepareFormData, addProperty, router])

  // Update form data handler
  const handleInputChange = useCallback((field, value) => {
    if (['firstName', 'lastName', 'email'].includes(field) && isAuthenticated) {
      return
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear specific field validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }

    // Handle company field validation
    if (field === 'company') {
      if (value && validationErrors.company) {
        setValidationErrors(prev => ({ ...prev, company: false }))
      } else if (!value && isCompanyRequired) {
        setValidationErrors(prev => ({ ...prev, company: true }))
      }
    }
  }, [isAuthenticated, validationErrors, isCompanyRequired])

  // Handle amenities change
  const handleAmenityChange = useCallback((amenityValue, isChecked) => {
    if (isChecked) {
      setSelectedAmenities(prev => [...prev, amenityValue])
    } else {
      setSelectedAmenities(prev => prev.filter(item => item !== amenityValue))
    }
  }, [])

  // Reset form fields when property type or category changes
  useEffect(() => {
    setSelectedAmenities([])
    const config = currentPropertyConfig
    if (!config.showBedrooms) setBedroomsValue('1')
    if (!config.showBathrooms) setBathroomsValue('1')
    if (!config.showToilets) setToiletsValue('1')
    if (!config.showParking) setParkingsValue('1')
    if (!config.showFloors) setFloorsValue('1')
    if (!config.showUnits) setUnitsValue('1')

    if (formData.category === 'sale') {
      setIsServiced(false)
    }
  }, [formData.propertyType, formData.category, currentPropertyConfig])

  // Check completion whenever relevant state changes
  useEffect(() => {
    checkSectionCompletion()
  }, [checkSectionCompletion])

  const handlePreviewClose = () => setPreviewShow(false)
  const handlePreviewShow = () => setPreviewShow(true)

  // Helper functions for display
  const getFullAddress = () => {
    const parts = [formData.address, formData.district, formData.city, formData.zipCode].filter(Boolean)
    return parts.join(', ') || 'Address not provided'
  }

  const getFormattedPrice = () => {
    const currencySymbol = formData.currency === 'usd' ? '$' : '₦'
    const price = formData.price || '0'
    return `${currencySymbol}${parseInt(price).toLocaleString()}`
  }

  const getPropertyTypeDisplay = () => {
    const types = {
      apartment: 'Apartment',
      house: 'House',
      duplex: 'Duplex',
      bungalow: 'Bungalow',
      commercial: 'Commercial',
      office: 'Office Building',
      shop: 'Shop/Retail',
      warehouse: 'Warehouse',
      plot: 'Land',
      land: 'Commercial Land',
      farm: 'Farm Land',
      hotel: 'Hotel',
      'event-centre': 'Event Centre'
    }
    return types[formData.propertyType] || formData.propertyType
  }

  // Dynamic anchors based on completion status
  const anchors = [
    {to: 'basic-info', label: 'Basic info', completed: sectionProgress.basicInfo},
    {to: 'location', label: 'Location', completed: sectionProgress.location},
    {to: 'details', label: 'Property details', completed: sectionProgress.details},
    {to: 'price', label: 'Price range', completed: sectionProgress.price},
    {to: 'photos', label: 'Photos / video', completed: sectionProgress.photos},
    {to: 'contacts', label: 'Contacts', completed: sectionProgress.contacts}
  ]

  const progressPercentage = calculateProgress()

  // Form options arrays
  const bedrooms = [
    {name: 'Studio', value: 'studio'},
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4', value: '4'},
    {name: '5+', value: '5+'}
  ]

  const bathrooms = [
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4', value: '4'},
    {name: '5+', value: '5+'}
  ]

  const toilets = [
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4', value: '4'},
    {name: '5+', value: '5+'}
  ]

  const parkings = [
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4+', value: '4+'}
  ]

  const floors = [
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4+', value: '4+'}
  ]

  const units = [
    {name: '1-5', value: '1-5'},
    {name: '6-10', value: '6-10'},
    {name: '11-20', value: '11-20'},
    {name: '20+', value: '20+'}
  ]

  // Enhanced amenity icons
  const amenityIcons = {
    'WiFi': 'fi-wifi',
    'Air conditioning': 'fi-snowflake',
    'Dishwasher': 'fi-dish',
    'Free parking': 'fi-parking',
    'Iron': 'fi-iron',
    'TV': 'fi-tv',
    'Heating': 'fi-thermometer',
    'Security cameras': 'fi-cctv',
    'Pool': 'fi-swimming-pool',
    'Kitchen': 'fi-dish',
    'Gym': 'fi-dumbbell',
    'Hair dryer': 'fi-iron',
    'Linens': 'fi-bed',
    'Security system': 'fi-security',
    'Elevator': 'fi-stairs',
    'Furnished': 'fi-bed',
    'Pets allowed': 'fi-pet',
    'Water heater': 'fi-thermometer',
    'HVAC system': 'fi-snowflake',
    'Chandeliers': 'fi-bulb',
    'POP ceiling': 'fi-bulb',
    'Study room': 'fi-book',
    'Workspace': 'fi-laptop',
    'Cinema': 'fi-play-circle',
    'Boys Quarters (BQ)': 'fi-home',
    'Family lounge': 'fi-sofa',
    'Ensuite bedrooms': 'fi-bed',
    'Modern structure': 'fi-tool',
    'Contemporary design': 'fi-tool',
    'Bluetooth speakers': 'fi-speaker'
  }

  // Show loading during auth check or redirect
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
        <div style={{ minHeight: '100vh' }} className="bg-secondary d-flex align-items-center justify-content-center">
          <Spinner animation='border' variant='primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </Spinner>
        </div>
    )
  }

  if (isAuthenticated && user?.accountType === 'individual') {
    return (
        <RealEstatePageLayout
            pageTitle='Real Estate'
            activeNav='Home'
            userLoggedIn={isAuthenticated}
            user={user}
        >
          <AddPropertyToast />
          <div style={{ minHeight: '50vh' }} className="d-flex align-items-center justify-content-center">
            <Spinner animation='border' variant='primary' role='status'>
              <span className='visually-hidden'>Redirecting...</span>
            </Spinner>
          </div>
        </RealEstatePageLayout>
    )
  }

  if (isAuthenticated && canAddProperties(user)) {
    return (
        <RealEstatePageLayout
            pageTitle='Add Property'
            activeNav='Vendor'
            userLoggedIn={isAuthenticated}
            user={user}
        >
          {/* Success Alert */}
          {showSuccessAlert && (
              <Alert variant='success' className='position-fixed top-0 start-50 translate-middle-x' style={{zIndex: 9999, marginTop: '20px'}}>
                <i className='fi-check-circle me-2'></i>
                Property added successfully! Redirecting to promotion page...
              </Alert>
          )}

          {/* Submit Error Alert */}
          {submitError && (
              <Alert variant='danger' dismissible onClose={clearSubmitError} className='position-fixed top-0 start-50 translate-middle-x' style={{zIndex: 9999, marginTop: '20px'}}>
                <i className='fi-x-circle me-2'></i>
                {submitError}
              </Alert>
          )}

          {/* Preview modal - Styled like Single Property Page */}
          <Modal
              fullscreen
              show={previewShow}
              onHide={handlePreviewClose}
          >
            <Modal.Header closeButton>
              <h3 className='h5 text-muted fw-normal modal-title d-none d-sm-block text-nowrap'>Property preview</h3>
              <div className='d-flex align-items-center justify-content-sm-end w-100 ms-sm-auto'>
                <span className='fs-xs text-muted ms-auto ms-sm-0 me-2'>[ESC]</span>
              </div>
            </Modal.Header>
            <Modal.Body className='p-0' style={{backgroundColor: '#f8f9fa'}}>
              {/* Page header - Matching single property layout */}
              <Container as='section' className='pt-5 mt-5 pb-1'>
                {/* Breadcrumb */}
                <Breadcrumb className='mb-3 pt-md-3'>
                  <Breadcrumb.Item>Home</Breadcrumb.Item>
                  <Breadcrumb.Item>Property for {formData.category === 'rent' ? 'rent' : formData.category === 'sale' ? 'sale' : 'shortlet'}</Breadcrumb.Item>
                  <Breadcrumb.Item active>{formData.title || 'Property Title'}</Breadcrumb.Item>
                </Breadcrumb>
                <h1 className='h2 mb-2'>{formData.title || 'Property Title'}</h1>
                <p className='mb-2 pb-1 fs-lg'>{getFullAddress()}</p>
                <div className='d-flex justify-content-between align-items-center'>
                  {/* Property stats - Dynamic based on property type */}
                  <ul className='d-flex mb-4 list-unstyled'>
                    {currentPropertyConfig.showBedrooms && (
                        <li className='me-3 pe-3 border-end'>
                          <b className='me-1'>{bedroomsValue === 'studio' ? 'Studio' : bedroomsValue}</b>
                          {bedroomsValue !== 'studio' && <i className='fi-bed mt-n1 lead align-middle text-muted'></i>}
                        </li>
                    )}
                    {currentPropertyConfig.showBathrooms && (
                        <li className='me-3 pe-3 border-end'>
                          <b className='me-1'>{bathroomsValue}</b>
                          <i className='fi-bath mt-n1 lead align-middle text-muted'></i>
                        </li>
                    )}
                    {currentPropertyConfig.showToilets && (
                        <li className='me-3 pe-3 border-end'>
                          <b className='me-1'>{toiletsValue}</b>
                          <i className='fi-toilet mt-n1 lead align-middle text-muted'></i>
                        </li>
                    )}
                    {currentPropertyConfig.showParking && (
                        <li className='me-3 pe-3 border-end'>
                          <b className='me-1'>{parkingsValue}</b>
                          <i className='fi-car mt-n1 lead align-middle text-muted'></i>
                        </li>
                    )}
                    {formData.area && (
                        <li>
                          <b>{formData.area} </b>
                          {currentPropertyConfig.areaLabel.includes('hectares') ? 'hectares' : 'sq.m'}
                        </li>
                    )}
                  </ul>
                  {/* Wishlist + Sharing */}
                  <div className='text-nowrap pb-3'>
                    <OverlayTrigger
                        placement='top'
                        overlay={<Tooltip>Add to Wishlist</Tooltip>}
                    >
                      <Button size='xs' variant='icon btn-light-primary shadow-sm rounded-circle'>
                        <i className='fi-heart'></i>
                      </Button>
                    </OverlayTrigger>
                    <Dropdown className='d-inline-block'>
                      <OverlayTrigger
                          placement='top'
                          overlay={<Tooltip>Share</Tooltip>}
                      >
                        <Dropdown.Toggle variant='icon btn-light-primary btn-xs shadow-sm rounded-circle ms-2'>
                          <i className='fi-share'></i>
                        </Dropdown.Toggle>
                      </OverlayTrigger>
                      <Dropdown.Menu align='end' className='my-1'>
                        <Dropdown.Item as='button'>
                          <i className='fi-facebook fs-base opacity-75 me-2'></i>
                          Facebook
                        </Dropdown.Item>
                        <Dropdown.Item as='button'>
                          <i className='fi-twitter fs-base opacity-75 me-2'></i>
                          Twitter
                        </Dropdown.Item>
                        <Dropdown.Item as='button'>
                          <i className='fi-instagram fs-base opacity-75 me-2'></i>
                          Instagram
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
              </Container>

              {/* Gallery - Matching single property layout */}
              <Container as='section' className='overflow-auto mb-4 pb-3'>
                <Row className='g-2 g-md-3' style={{minWidth: '30rem'}}>
                  {galleryPreviews.length > 0 ? (
                      <>
                        {/* Main image/video */}
                        <Col xs={8}>
                          <div className='position-relative' style={{height: '400px'}}>
                            {galleryPreviews[0].isImage ? (
                                <img
                                    src={galleryPreviews[0].url}
                                    alt='Property main image'
                                    className='rounded rounded-md-3 w-100 h-100'
                                    style={{objectFit: 'cover'}}
                                />
                            ) : galleryPreviews[0].isVideo ? (
                                <video
                                    src={galleryPreviews[0].url}
                                    className='rounded rounded-md-3 w-100 h-100'
                                    style={{objectFit: 'cover'}}
                                    controls
                                    muted
                                    preload="metadata"
                                />
                            ) : (
                                <div className='bg-light rounded rounded-md-3 w-100 h-100 d-flex align-items-center justify-content-center'>
                                  <p className='text-muted'>File preview unavailable</p>
                                </div>
                            )}
                          </div>
                        </Col>
                        {/* Side thumbnails */}
                        <Col xs={4}>
                          {galleryPreviews.slice(1, 3).map((preview, index) => (
                              <div key={preview.id} className={`${index === 0 ? 'mb-2 mb-md-3' : ''}`} style={{height: '195px'}}>
                                {preview.isImage ? (
                                    <img
                                        src={preview.url}
                                        alt={`Property image ${index + 2}`}
                                        className='rounded rounded-md-3 w-100 h-100'
                                        style={{objectFit: 'cover'}}
                                    />
                                ) : preview.isVideo ? (
                                    <video
                                        src={preview.url}
                                        className='rounded rounded-md-3 w-100 h-100'
                                        style={{objectFit: 'cover'}}
                                        muted
                                        preload="metadata"
                                    />
                                ) : (
                                    <div className='bg-light rounded rounded-md-3 w-100 h-100 d-flex align-items-center justify-content-center'>
                                      <p className='text-muted'>File</p>
                                    </div>
                                )}
                              </div>
                          ))}
                        </Col>
                        {/* Bottom thumbnail row */}
                        {galleryPreviews.length > 3 && (
                            <Col xs={12}>
                              <Row className='g-2 g-md-3'>
                                {galleryPreviews.slice(3, 8).map((preview, index) => (
                                    <Col key={preview.id}>
                                      <div className='position-relative' style={{height: '160px'}}>
                                        {preview.isImage ? (
                                            <img
                                                src={preview.url}
                                                alt={`Property image ${index + 4}`}
                                                className='rounded-1 rounded-md-2 w-100 h-100'
                                                style={{objectFit: 'cover'}}
                                            />
                                        ) : preview.isVideo ? (
                                            <video
                                                src={preview.url}
                                                className='rounded-1 rounded-md-2 w-100 h-100'
                                                style={{objectFit: 'cover'}}
                                                muted
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className='bg-light rounded-1 rounded-md-2 w-100 h-100 d-flex align-items-center justify-content-center'>
                                              <p className='text-muted small'>File</p>
                                            </div>
                                        )}
                                        {/* Show remaining count on last thumbnail */}
                                        {index === 4 && galleryPreviews.length > 8 && (
                                            <div className='position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 rounded-1 rounded-md-2 d-flex align-items-center justify-content-center text-white'>
                                              +{galleryPreviews.length - 8} <span className='d-none d-md-inline ms-1'>more</span>
                                            </div>
                                        )}
                                      </div>
                                    </Col>
                                ))}
                              </Row>
                            </Col>
                        )}
                      </>
                  ) : (
                      <Col xs={12}>
                        <div className='bg-light rounded rounded-md-3 d-flex align-items-center justify-content-center' style={{height: '400px'}}>
                          <div className='text-center'>
                            <i className='fi-image display-4 text-muted mb-3'></i>
                            <p className='text-muted mb-0'>No images or videos uploaded</p>
                          </div>
                        </div>
                      </Col>
                  )}
                </Row>
              </Container>

              {/* Post content - Matching single property layout */}
              <Container as='section' className='mb-5 pb-1'>
                <Row>
                  <Col md={7} className='mb-md-0 mb-4'>
                    <Badge bg='success' className='me-2 mb-3'>Verified</Badge>
                    <Badge bg='info' className='me-2 mb-3'>New</Badge>
                    {/* Price */}
                    <h2 className='h3 mb-4 pb-4 border-bottom'>
                      {getFormattedPrice()}
                      {formData.category !== 'sale' && (
                          <span className='d-inline-block ms-1 fs-base fw-normal text-body'>/{formData.priceUnit || 'month'}</span>
                      )}
                    </h2>
                    {/* Overview */}
                    <div className='mb-4 pb-md-3'>
                      <h3 className='h4'>Overview</h3>
                      {formData.description ? (
                          <>
                            <p className='mb-1'>{formData.description.substring(0, 300)}</p>
                            {formData.description.length > 300 && (
                                <>
                                  <Collapse in={overviewOpen}>
                                    <div id='moreOverview'>
                                      <p className='mb-1'>{formData.description.substring(300)}</p>
                                    </div>
                                  </Collapse>
                                  <a
                                      href='#'
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setOverviewOpen(!overviewOpen)
                                      }}
                                      aria-controls='moreOverview'
                                      aria-expanded={overviewOpen}
                                      className={`collapse-label${overviewOpen ? '' : ' collapsed'}`}
                                  >
                                    {overviewOpen ? 'Show less' : 'Show more'}
                                  </a>
                                </>
                            )}
                          </>
                      ) : (
                          <p className='mb-1 text-muted'>No description provided</p>
                      )}
                    </div>
                    {/* Property details list - Dynamic based on property type */}
                    <div className='mb-4 pb-md-3'>
                      <h3 className='h4'>Property Details</h3>
                      <ul className='list-unstyled mb-0'>
                        <li><b>Type: </b>{getPropertyTypeDisplay()}</li>
                        {formData.area && <li><b>Area: </b>{formData.area} {currentPropertyConfig.areaLabel.includes('hectares') ? 'hectares' : 'sq.m'}</li>}
                        {currentPropertyConfig.showBedrooms && <li><b>Bedrooms: </b>{bedroomsValue}</li>}
                        {currentPropertyConfig.showBathrooms && <li><b>Bathrooms: </b>{bathroomsValue}</li>}
                        {currentPropertyConfig.showToilets && <li><b>Toilets: </b>{toiletsValue}</li>}
                        {currentPropertyConfig.showParking && <li><b>Parking places: </b>{parkingsValue}</li>}
                        {currentPropertyConfig.showFloors && <li><b>Floors: </b>{floorsValue}</li>}
                        {currentPropertyConfig.showUnits && <li><b>Units: </b>{unitsValue}</li>}
                        {/* Only show serviced status for non-sale properties */}
                        {showServicedOption && isServiced && (
                            <li><b>Fully Serviced: </b>Yes</li>
                        )}
                      </ul>
                    </div>
                    {/* Amenities */}
                    {selectedAmenities.length > 0 && (
                        <div className='mb-4 pb-md-3'>
                          <h3 className='h4'>Features & Amenities</h3>
                          <Row as='ul' xs={1} md={2} lg={3} className='list-unstyled gy-1 mb-1 text-nowrap'>
                            {selectedAmenities.slice(0, 9).map((amenity, indx) => (
                                <Col key={indx} as='li'>
                                  <i className={`${amenityIcons[amenity] || 'fi-check'} mt-n1 me-2 fs-lg align-middle`}></i>
                                  {amenity}
                                </Col>
                            ))}
                          </Row>
                          {selectedAmenities.length > 9 && (
                              <>
                                <Collapse in={amenitiesOpen}>
                                  <div id='moreAmenities'>
                                    <Row as='ul' xs={1} md={2} lg={3} className='list-unstyled gy-1 mb-1 text-nowrap'>
                                      {selectedAmenities.slice(9).map((amenity, indx) => (
                                          <Col key={indx} as='li'>
                                            <i className={`${amenityIcons[amenity] || 'fi-check'} mt-n1 me-2 fs-lg align-middle`}></i>
                                            {amenity}
                                          </Col>
                                      ))}
                                    </Row>
                                  </div>
                                </Collapse>
                                <a
                                    href='#'
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setAmenitiesOpen(!amenitiesOpen)
                                    }}
                                    aria-controls='moreAmenities'
                                    aria-expanded={amenitiesOpen}
                                    className={`collapse-label${amenitiesOpen ? '' : ' collapsed'}`}
                                >
                                  {amenitiesOpen ? 'Show less' : 'Show more'}
                                </a>
                              </>
                          )}
                        </div>
                    )}
                    {/* Post meta */}
                    <div className='mb-lg-5 mb-md-4 pb-lg-2 py-4 border-top'>
                      <ul className='d-flex mb-4 list-unstyled fs-sm'>
                        <li className='me-3 pe-3 border-end'>Published: <b>{new Date().toLocaleDateString()}</b></li>
                        <li className='me-3 pe-3 border-end'>Ad number: <b>681013232</b></li>
                        <li className='me-3 pe-3'>Market status: <b>Available</b></li>
                      </ul>
                    </div>
                  </Col>
                  {/* Sidebar - Matching single property layout */}
                  <Col as='aside' md={5} lg={4} className='ms-lg-auto pb-1'>
                    {/* Seller's card */}
                    <Card className='shadow-sm mb-4'>
                      <Card.Body>
                        <div className='d-flex align-items-start justify-content-between'>
                          <div className='text-decoration-none'>
                            <div className='d-flex mb-2' style={{width: 60}}>
                              <div
                                  className='rounded-circle bg-secondary d-flex align-items-center justify-content-center'
                                  style={{width: 60, height: 60}}
                              >
                                <i className='fi-user text-white fs-4'></i>
                              </div>
                            </div>
                            <h5 className='mb-1'>{formData.firstName} {formData.lastName}</h5>
                            <div className='mb-1'>
                              <StarRating rating={5} />
                              <span className='ms-1 fs-sm text-muted'>(New agent)</span>
                            </div>
                            <p className='text-body'>{formData.company || 'Private seller'}</p>
                          </div>
                          <div className='ms-4 flex-shrink-0'>
                            <SocialButton href='#' variant='solid' brand='facebook' roundedCircle className='ms-2 mb-2' />
                            <SocialButton href='#' variant='solid' brand='linkedin' roundedCircle className='ms-2 mb-2' />
                          </div>
                        </div>
                        <ul className='list-unstyled border-bottom mb-4 pb-4'>
                          <li>
                            <div className='nav-link fw-normal p-0'>
                              <i className='fi-phone mt-n1 me-2 align-middle opacity-60'></i>
                              {formData.phone || 'Phone not provided'}
                            </div>
                          </li>
                          <li>
                            <div className='nav-link fw-normal p-0'>
                              <i className='fi-mail mt-n1 me-2 align-middle opacity-60'></i>
                              {formData.email}
                            </div>
                          </li>
                        </ul>
                        {/* Contact preview */}
                        <div className='text-center py-3'>
                          <p className='text-muted mb-3'>Contact form will be displayed here</p>
                          <Button variant='primary' size='lg' className='w-100' disabled>
                            Send request
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
          </Modal>

          {/* Main form content */}
          <Container className='mt-5 mb-md-4 py-5'>
            <Form onSubmit={handleSubmit} noValidate>
              <Row>
                <Col lg={8}>
                  {/* Breadcrumb */}
                  <Breadcrumb className='mb-3 pt-2 pt-lg-3'>
                    <Link href='/real-estate' passHref>
                      <Breadcrumb.Item>Home</Breadcrumb.Item>
                    </Link>
                    <Breadcrumb.Item active>Add property</Breadcrumb.Item>
                  </Breadcrumb>

                  {/* Title */}
                  <div className='mb-4'>
                    <h1 className='h2 mb-0'>Add property</h1>
                    <div className='d-lg-none pt-3 mb-2'>{progressPercentage}% content filled</div>
                    <ProgressBar variant='warning' now={progressPercentage} style={{height: '.25rem'}} className='d-lg-none mb-4' />
                  </div>

                  {/* Basic info */}
                  <section id='basic-info' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-info-circle text-primary fs-5 mt-n1 me-2'></i>
                      Basic info
                    </h2>
                    <Form.Group controlId='ap-title' className='mb-3'>
                      <Form.Label>Title <span className='text-danger'>*</span></Form.Label>
                      <Form.Control
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder='Title of your property'
                          isInvalid={!!validationErrors.title}
                          required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.title}
                      </Form.Control.Feedback>
                      <Form.Text>{Math.max(0, 100 - formData.title.length)} characters left</Form.Text>
                    </Form.Group>

                    <Row>
                      <Form.Group as={Col} md={6} controlId='ab-category' className='mb-3'>
                        <Form.Label>Category <span className='text-danger'>*</span></Form.Label>
                        <Form.Select
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            isInvalid={!!validationErrors.category}
                            required
                        >
                          <option value='' disabled>Choose category</option>
                          <option value='rent'>For rent</option>
                          <option value='sale'>For sale</option>
                          <option value='shortlet'>For shortlet</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.category}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group as={Col} md={6} controlId='ab-property-type' className='mb-3'>
                        <Form.Label>Property type <span className='text-danger'>*</span></Form.Label>
                        <Form.Select
                            value={formData.propertyType}
                            onChange={(e) => handleInputChange('propertyType', e.target.value)}
                            isInvalid={!!validationErrors.propertyType}
                            required
                        >
                          <option value='' disabled>Choose property type</option>
                          {/* Multi-unit Residential */}
                          <optgroup label="🏢 Multi-unit Residential">
                            <option value='apartment'>Apartment</option>
                            <option value='duplex'>Duplex</option>
                          </optgroup>
                          {/* Single-family Houses */}
                          <optgroup label="🏠 Houses">
                            <option value='house'>House (General)</option>
                            <option value='bungalow'>Bungalow</option>
                          </optgroup>
                          {/* Commercial Buildings */}
                          <optgroup label="🏢 Commercial">
                            <option value='office'>Office Building</option>
                            <option value='shop'>Shop/Retail</option>
                            <option value='warehouse'>Warehouse</option>
                            <option value='commercial'>Mixed Commercial</option>
                          </optgroup>
                          {/* Land & Development */}
                          <optgroup label="🏞️ Land">
                            <option value='plot'>Residential Plot</option>
                            <option value='land'>Commercial Land</option>
                            <option value='farm'>Farm/Agricultural Land</option>
                          </optgroup>
                          {/* Hospitality & Events */}
                          <optgroup label="🏨 Hospitality">
                            <option value='hotel'>Hotel</option>
                            <option value='event-centre'>Event Centre</option>
                          </optgroup>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.propertyType}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Row>

                    <div className='form-label fw-bold pt-3 pb-2'>Are you listing on Finder as part of a company?</div>
                    <Form.Check
                        type='radio'
                        name='businessType'
                        id='business'
                        value='Business'
                        label='I am a registered business'
                        checked={formData.businessType === 'Business'}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                    />
                    <Form.Check
                        type='radio'
                        name='businessType'
                        id='private'
                        value='Private seller'
                        label='I am a private seller'
                        checked={formData.businessType === 'Private seller'}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                    />
                  </section>

                  {/* Location */}
                  <section id='location' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-map-pin text-primary fs-5 mt-n1 me-2'></i>
                      Location
                    </h2>
                    <Row>
                      <Form.Group as={Col} sm={6} controlId='ap-country' className='mb-3'>
                        <Form.Label>Country / region <span className='text-danger'>*</span></Form.Label>
                        <Form.Select
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            isInvalid={!!validationErrors.country}
                            required
                        >
                          <option value='' disabled>Choose country</option>
                          <option value='Australia'>Australia</option>
                          <option value='Belgium'>Belgium</option>
                          <option value='Germany'>Germany</option>
                          <option value='Canada'>Canada</option>
                          <option value='US'>United States</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.country}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group as={Col} sm={6} controlId='ap-city' className='mb-3'>
                        <Form.Label>City <span className='text-danger'>*</span></Form.Label>
                        <Form.Select
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            isInvalid={!!validationErrors.city}
                            required
                        >
                          <option value='' disabled>Choose city</option>
                          <option value='Chicago'>Chicago</option>
                          <option value='Dallas'>Dallas</option>
                          <option value='Los Angeles'>Los Angeles</option>
                          <option value='New York'>New York</option>
                          <option value='San Diego'>San Diego</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.city}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group as={Col} sm={8} controlId='ap-district' className='mb-3'>
                        <Form.Label>District <span className='text-danger'>*</span></Form.Label>
                        <Form.Select
                            value={formData.district}
                            onChange={(e) => handleInputChange('district', e.target.value)}
                            isInvalid={!!validationErrors.district}
                            required
                        >
                          <option value='' disabled>Choose district</option>
                          <option value='Brooklyn'>Brooklyn</option>
                          <option value='Manhattan'>Manhattan</option>
                          <option value='Staten Island'>Staten Island</option>
                          <option value='The Bronx'>The Bronx</option>
                          <option value='Queens'>Queens</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.district}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group as={Col} sm={4} controlId='ap-zip' className='mb-3'>
                        <Form.Label>Zip code <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            value={formData.zipCode}
                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                            placeholder='Enter Zip code'
                            isInvalid={!!validationErrors.zipCode}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.zipCode}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group as={Col} sm={12} controlId='ap-address' className='mb-3'>
                        <Form.Label>Street address <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder='Enter your street address'
                            isInvalid={!!validationErrors.address}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.address}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Row>
                  </section>

                  {/* Property details - ENHANCED DYNAMIC SECTION */}
                  <section id='details' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-edit text-primary fs-5 mt-n1 me-2'></i>
                      Property details
                    </h2>
                    {/* Area - Optional for apartments, required for others */}
                    <Form.Group controlId='ap-area' className='mb-4' style={{maxWidth: '25rem'}}>
                      <Form.Label>
                        {currentPropertyConfig.areaLabel}
                        {currentPropertyConfig.areaRequired ? (
                            <span className='text-danger'>* </span>
                        ) : (
                            <span className='text-muted'> (Optional)</span>
                        )}
                      </Form.Label>
                      <Form.Control
                          type='number'
                          value={formData.area}
                          onChange={(e) => handleInputChange('area', e.target.value)}
                          min={1}
                          placeholder={`Enter ${currentPropertyConfig.areaLabel.toLowerCase()}`}
                          isInvalid={!!validationErrors.area}
                          required={currentPropertyConfig.areaRequired}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.area}
                      </Form.Control.Feedback>
                      {!currentPropertyConfig.areaRequired && (
                          <Form.Text className='text-muted'>
                            Leave blank if exact area is unknown
                          </Form.Text>
                      )}
                    </Form.Group>

                    {/* Bedrooms - Only for residential */}
                    {currentPropertyConfig.showBedrooms && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Bedrooms <span className='text-danger'>*</span></Form.Label>
                          <ButtonGroup size='sm'>
                            {bedrooms.map((bedroom, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`bedrooms-${indx}`}
                                    name='bedrooms'
                                    value={bedroom.value}
                                    checked={bedroomsValue === bedroom.value}
                                    onChange={(e) => setBedroomsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{bedroom.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Bathrooms - Most properties except land */}
                    {currentPropertyConfig.showBathrooms && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Bathrooms <span className='text-danger'>*</span></Form.Label>
                          <ButtonGroup size='sm'>
                            {bathrooms.map((bathroom, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`bathrooms-${indx}`}
                                    name='bathrooms'
                                    value={bathroom.value}
                                    checked={bathroomsValue === bathroom.value}
                                    onChange={(e) => setBathroomsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{bathroom.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Toilets - Separate from bathrooms */}
                    {currentPropertyConfig.showToilets && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Toilets <span className='text-danger'>*</span></Form.Label>
                          <ButtonGroup size='sm'>
                            {toilets.map((toilet, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`toilets-${indx}`}
                                    name='toilets'
                                    value={toilet.value}
                                    checked={toiletsValue === toilet.value}
                                    onChange={(e) => setToiletsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{toilet.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Parking - Most properties */}
                    {currentPropertyConfig.showParking && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Parking spots <span className='text-danger'>*</span></Form.Label>
                          <ButtonGroup size='sm'>
                            {parkings.map((parking, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`parkings-${indx}`}
                                    name='parkings'
                                    value={parking.value}
                                    checked={parkingsValue === parking.value}
                                    onChange={(e) => setParkingsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{parking.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Floors - Multi-story buildings */}
                    {currentPropertyConfig.showFloors && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Number of floors</Form.Label>
                          <ButtonGroup size='sm'>
                            {floors.map((floor, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`floors-${indx}`}
                                    name='floors'
                                    value={floor.value}
                                    checked={floorsValue === floor.value}
                                    onChange={(e) => setFloorsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{floor.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Units - Commercial/Multi-unit properties */}
                    {currentPropertyConfig.showUnits && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Number of units</Form.Label>
                          <ButtonGroup size='sm'>
                            {units.map((unit, indx) => (
                                <ToggleButton
                                    key={indx}
                                    type='radio'
                                    id={`units-${indx}`}
                                    name='units'
                                    value={unit.value}
                                    checked={unitsValue === unit.value}
                                    onChange={(e) => setUnitsValue(e.currentTarget.value)}
                                    variant='outline-secondary fw-normal'
                                >{unit.name}</ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Form.Group>
                    )}

                    {/* Serviced Property - Only for non-sale properties */}
                    {showServicedOption && (
                        <Form.Group className='mb-4'>
                          <Form.Label className='d-block fw-bold mb-2 pb-1'>Property Services</Form.Label>
                          <div className='d-flex flex-column flex-sm-row gap-3'>
                            <Form.Check
                                type='radio'
                                name='serviced'
                                id='not-serviced'
                                value={false}
                                label='Not Serviced'
                                checked={!isServiced}
                                onChange={() => setIsServiced(false)}
                            />
                            <Form.Check
                                type='radio'
                                name='serviced'
                                id='serviced'
                                value={true}
                                label='Serviced Property'
                                checked={isServiced}
                                onChange={() => setIsServiced(true)}
                            />
                          </div>
                          <Form.Text className='text-muted'>
                            Serviced properties include maintenance, cleaning, security, and utility management services
                          </Form.Text>
                        </Form.Group>
                    )}

                    {/* Enhanced Dynamic Amenities */}
                    <Form.Group className='mb-4'>
                      <Form.Label className='d-block fw-bold mb-2 pb-1'>Features & Amenities</Form.Label>
                      <Row xs={1} sm={2} md={3}>
                        {currentAmenitiesList.map((amenity, indx) => (
                            <Col key={indx}>
                              <Form.Check
                                  type='checkbox'
                                  id={`amenities-${indx}`}
                                  value={amenity}
                                  label={amenity}
                                  onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                              />
                            </Col>
                        ))}
                      </Row>
                    </Form.Group>

                    {/* Description */}
                    <Form.Group controlId='ap-description'>
                      <Form.Label>Description <span className='text-danger'>*</span></Form.Label>
                      <Form.Control
                          as='textarea'
                          rows={5}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder='Describe your property'
                          isInvalid={!!validationErrors.description}
                          required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.description}
                      </Form.Control.Feedback>
                      <Form.Text>{Math.max(0, 1500 - formData.description.length)} characters left</Form.Text>
                    </Form.Group>
                  </section>

                  {/* Price */}
                  <section id='price' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-cash text-primary fs-5 mt-n1 me-2'></i>
                      Price
                    </h2>
                    <Form.Label htmlFor='ap-price'>
                      Price <span className='text-danger'>*</span>
                    </Form.Label>
                    <div className='d-sm-flex'>
                      <Form.Select
                          className='w-25 me-2 mb-2'
                          value={formData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                      >
                        <option value='ngn'>₦</option>
                        <option value='usd'>$</option>
                      </Form.Select>
                      <Form.Control
                          id='ap-price'
                          type='number'
                          min={1}
                          step={1}
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className='w-100 me-2 mb-2'
                          placeholder='Enter price'
                          isInvalid={!!validationErrors.price}
                          required
                      />
                      {/* Dynamic price unit based on category */}
                      {formData.category !== 'sale' ? (
                          <Form.Select
                              value={formData.priceUnit}
                              onChange={(e) => handleInputChange('priceUnit', e.target.value)}
                              className='w-50 mb-2'
                          >
                            <option value='hour'>per hour</option>
                            <option value='day'>per day</option>
                            <option value='week'>per week</option>
                            <option value='month'>per month</option>
                            <option value='year'>per year</option>
                          </Form.Select>
                      ) : (
                          <div className='w-50 mb-2 d-flex align-items-center px-3 bg-light rounded'>
                            <span className='text-muted'>Total price</span>
                          </div>
                      )}
                    </div>
                    {validationErrors.price && (
                        <div className='invalid-feedback d-block'>
                          {validationErrors.price}
                        </div>
                    )}
                  </section>

                  {/* Photos / video */}
                  <section id='photos' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-image text-primary fs-5 mt-n1 me-2'></i>
                      Photos / video
                    </h2>
                    <Alert variant='info' className='d-flex mb-4'>
                      <i className='fi-alert-circle me-2 me-sm-3'></i>
                      <p className='fs-sm mb-1'>The maximum photo size is 8 MB. Formats: jpeg, jpg, png. Put the main picture first.<br />
                        The maximum video size is 10 MB. Formats: mp4, mov.</p>
                    </Alert>
                    <FilePond
                        files={gallery}
                        onupdatefiles={setGallery}
                        name='gallery'
                        labelIdle='<div class="btn btn-primary mb-3"><i class="fi-cloud-upload me-1"></i>Upload photos / video</div><div>or drag them in</div>'
                        acceptedFileTypes={['image/png', 'image/jpeg', 'video/mp4', 'video/mov']}
                        allowMultiple={true}
                        maxFiles={8}
                        maxFileSize='10MB'
                        className='file-uploader file-uploader-grid'
                    />
                    {validationErrors.gallery && (
                        <div className='invalid-feedback d-block'>
                          {validationErrors.gallery}
                        </div>
                    )}
                  </section>

                  {/* Contacts - UPDATED with company validation */}
                  <section id='contacts' className='card card-body border-0 shadow-sm p-4 mb-4'>
                    <h2 className='h4 mb-4'>
                      <i className='fi-phone text-primary fs-5 mt-n1 me-2'></i>
                      Contacts
                    </h2>

                    <Alert variant='info' className='mb-4'>
                      <i className='fi-info-circle me-2'></i>
                      Name and email are from your profile. <Link href='/real-estate/account-info'>Edit in profile</Link>.
                    </Alert>

                    <Row>
                      <Form.Group as={Col} sm={6} controlId='ab-fn' className='mb-3'>
                        <Form.Label>First name <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            value={formData.firstName}
                            placeholder='Update first name in profile'
                            disabled
                            required
                        />
                      </Form.Group>

                      <Form.Group as={Col} sm={6} controlId='ab-sn' className='mb-3'>
                        <Form.Label>Last name <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            value={formData.lastName}
                            placeholder='Update last name in profile'
                            disabled
                            required
                        />
                      </Form.Group>

                      <Form.Group as={Col} sm={6} controlId='ab-email' className='mb-3'>
                        <Form.Label>Email <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            type='email'
                            value={formData.email}
                            placeholder='Email from profile'
                            disabled
                            required
                        />
                      </Form.Group>

                      <Form.Group as={Col} sm={6} controlId='ab-phone' className='mb-3'>
                        <Form.Label>Phone number <span className='text-danger'>*</span></Form.Label>
                        <Form.Control
                            type='tel'
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder='Enter your phone number'
                            isInvalid={!!validationErrors.phone}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.phone}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* UPDATED Company field with conditional validation */}
                      <Form.Group as={Col} xs={12} controlId='ab-company' className='mb-3'>
                        <Form.Label>
                          Company
                          {isCompanyRequired && <span className='text-danger'> *</span>}
                        </Form.Label>
                        <Form.Control
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            placeholder={isCompanyRequired ? 'Enter company name' : 'Enter company name (optional)'}
                            isInvalid={!!validationErrors.company}
                            required={isCompanyRequired}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.company}
                        </Form.Control.Feedback>
                        {!isCompanyRequired && (
                            <Form.Text className='text-muted'>
                              Optional field for private sellers
                            </Form.Text>
                        )}
                      </Form.Group>
                    </Row>
                  </section>

                  {/* Action buttons - UPDATED */}
                  <section className='d-sm-flex justify-content-between pt-2'>
                    <Button
                        size='lg'
                        variant='outline-primary d-block w-100 w-sm-auto mb-3 mb-sm-2'
                        onClick={handlePreviewShow}
                        disabled={isSubmitting}
                    >
                      <i className='fi-eye-on ms-n1 me-2'></i>
                      Preview
                    </Button>

                    <Button
                        size='lg'
                        variant='primary d-block w-100 w-sm-auto mb-2'
                        type='submit'
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                          <>
                            <Spinner animation='border' size='sm' className='me-2' />
                            Adding Property...
                          </>
                      ) : (
                          <>
                            <i className='fi-save ms-n1 me-2'></i>
                            Add Property
                          </>
                      )}
                    </Button>
                  </section>
                </Col>

                {/* Sidebar (Progress of completion) */}
                <Col lg={{span: 3, offset: 1}} className='d-none d-lg-block'>
                  <div className='sticky-top pt-5'>
                    <h6 className='pt-5 mt-3 mb-2'>{progressPercentage}% content filled</h6>
                    <ProgressBar variant='warning' now={progressPercentage} style={{height: '.25rem'}} className='mb-4' />
                    <ul className='list-unstyled'>
                      {anchors.map((anchor, indx) => (
                          <li key={indx} className='d-flex align-items-center'>
                            <i className={`fi-check text-${anchor.completed ? 'primary' : 'muted'} me-2`}></i>
                            <ScrollLink to={anchor.to} smooth='easeInOutQuart' duration={600} offset={-95} className='nav-link fw-normal ps-1 p-0'>
                              {anchor.label}
                            </ScrollLink>
                          </li>
                      ))}
                    </ul>
                  </div>
                </Col>
              </Row>
            </Form>
          </Container>
        </RealEstatePageLayout>
    )
  }
}

export default AddPropertyPage