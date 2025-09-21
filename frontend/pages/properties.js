import { useEffect, useState, useRef } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import RealEstatePageLayout from '../components/partials/RealEstatePageLayout'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Offcanvas from 'react-bootstrap/Offcanvas'
import Nav from 'react-bootstrap/Nav'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import Pagination from 'react-bootstrap/Pagination'
import ListGroup from 'react-bootstrap/ListGroup'
import ImageLoader from '../components/ImageLoader'
import PropertyCard from '../components/PropertyCard'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'

const MapContainer = dynamic(() =>
        import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(() =>
        import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
)
const CustomMarker = dynamic(() =>
        import('../components/partials/CustomMarker'),
    { ssr: false }
)
const Popup = dynamic(() =>
        import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
)
import 'leaflet/dist/leaflet.css'
import AccountUpgradeToast from "../components/toasts/AccountUpgradeToast";
import {useAuth} from "../hooks/useAuth";
import FormGroup from '../components/FormGroup'

const PropertiesPage = () => {
    const { user, isAuthenticated } = useAuth()

    // Add extra class to body
    useEffect(() => {
        const body = document.querySelector('body')
        document.body.classList.add('fixed-bottom-btn')
        return () => body.classList.remove('fixed-bottom-btn')
    })

    // Query param (Switch between Rent, Shortlet and Sale category)
    const router = useRouter()
    let categoryParam = 'rent' // default
    if (router.query.category === 'sale') categoryParam = 'sale'
    if (router.query.category === 'shortlet') categoryParam = 'shortlet'

    // Media query for displaying Offcanvas on screens larger than 991px
    const isDesktop = useMediaQuery({ query: '(min-width: 992px)' })

    // Offcanvas show/hide
    const [show, setShow] = useState(false)
    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 9 // Properties per page

    // Search and sorting states
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('newest')

    // Location autocomplete state
    const [locationValue, setLocationValue] = useState('')
    const [locationSuggestions, setLocationSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const locationInputRef = useRef(null)

    // Nigerian locations data
    const nigerianLocations = [
        'Lagos, Lagos State', 'Lekki, Lagos State', 'Victoria Island, Lagos State',
        'Ikoyi, Lagos State', 'Ajah, Lagos State', 'Ikeja, Lagos State',
        'Surulere, Lagos State', 'Yaba, Lagos State', 'Maryland, Lagos State',
        'Banana Island, Lagos State', 'Magodo, Lagos State', 'Gbagada, Lagos State',
        'Festac, Lagos State', 'Ojo, Lagos State', 'Badagry, Lagos State',
        'Abuja, FCT', 'Wuse, Abuja FCT', 'Maitama, Abuja FCT',
        'Gwarinpa, Abuja FCT', 'Garki, Abuja FCT', 'Asokoro, Abuja FCT',
        'Katampe, Abuja FCT', 'Jahi, Abuja FCT', 'Life Camp, Abuja FCT',
        'Kubwa, Abuja FCT', 'Lugbe, Abuja FCT', 'Karu, Abuja FCT',
        'Port Harcourt, Rivers State', 'Kano, Kano State', 'Ibadan, Oyo State',
        'Kaduna, Kaduna State', 'Jos, Plateau State', 'Benin City, Edo State',
        'Enugu, Enugu State', 'Abeokuta, Ogun State', 'Owerri, Imo State',
        'Warri, Delta State', 'Calabar, Cross River State', 'Akure, Ondo State',
        'Lokoja, Kogi State', 'Lafia, Nasarawa State', 'Makurdi, Benue State'
    ]

    // Handle location input change
    const handleLocationChange = (e) => {
        const value = e.target.value
        setLocationValue(value)

        if (value.length > 0) {
            const filteredSuggestions = nigerianLocations
                .filter(location =>
                    location.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5)

            setLocationSuggestions(filteredSuggestions)
            setShowSuggestions(true)
        } else {
            setShowSuggestions(false)
            setLocationSuggestions([])
        }
    }

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion) => {
        setLocationValue(suggestion)
        setShowSuggestions(false)
        setLocationSuggestions([])
    }

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationInputRef.current && !locationInputRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Filter states (these are temporary states until user clicks "Apply Filters")
    const [tempFilters, setTempFilters] = useState({
        location: '',
        propertyTypes: {},
        priceRange: { min: '', max: '' },
        bedrooms: '',
        bathrooms: '',
        squareMetres: { min: '', max: '' },
        amenities: {},
        pets: {},
        options: {}
    })

    // Applied filters (these are the actual filters being used)
    const [appliedFilters, setAppliedFilters] = useState({
        location: '',
        propertyTypes: {},
        priceRange: { min: '', max: '' },
        bedrooms: '',
        bathrooms: '',
        squareMetres: { min: '', max: '' },
        amenities: {},
        pets: {},
        options: {}
    })

    // Handle temp filter changes (before applying)
    const handleTempFilterChange = (filterType, key, value) => {
        setTempFilters(prev => ({
            ...prev,
            [filterType]: typeof prev[filterType] === 'object' ? {
                ...prev[filterType],
                [key]: value
            } : value
        }))
    }

    // Apply filters
    const applyFilters = () => {
        setAppliedFilters({...tempFilters, location: locationValue})
        setCurrentPage(1) // Reset to first page when filters change
    }

    // Reset filters function
    const resetFilters = () => {
        const resetState = {
            location: '',
            propertyTypes: {},
            priceRange: { min: '', max: '' },
            bedrooms: '',
            bathrooms: '',
            squareMetres: { min: '', max: '' },
            amenities: {},
            pets: {},
            options: {}
        }
        setTempFilters(resetState)
        setAppliedFilters(resetState)
        setLocationValue('')
        setSearchQuery('')
        setCurrentPage(1)
    }

    // Fixed property data that won't change
    const propertiesRent = [
        {
            id: 1,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/01.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/02.jpg', 504, 230, 'Image']
            ],
            title: '3 bedroom apartment',
            location: 'Off Freedom Way, Lekki Phase 1, Lagos',
            price: 1650000,
            badges: [['success', 'Verified'], ['info', 'New']],
            amenities: { bedrooms: 3, bathrooms: 2, toilets: 2, parking: 1 },
            coveredArea: 67,
            features: ['Smart home', 'Parking', 'Water heater'],
            dateAdded: new Date('2024-01-15')
        },
        {
            id: 2,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/03.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/04.jpg', 504, 230, 'Image']
            ],
            title: '4 bedroom terraced duplex',
            location: 'Chevron, Lekki, Lagos',
            price: 10000000,
            badges: [['info', 'New']],
            amenities: { bedrooms: 4, bathrooms: 3, toilets: 3, parking: 2 },
            coveredArea: 120,
            features: ['Gym', 'Pool', 'Security cameras'],
            dateAdded: new Date('2024-01-20')
        },
        {
            id: 3,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/05.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/06.jpg', 504, 230, 'Image']
            ],
            title: '2 bedroom apartment',
            location: 'Victoria Island, Lagos',
            price: 3500000,
            badges: [['success', 'Verified']],
            amenities: { bedrooms: 2, bathrooms: 2, toilets: 2, parking: 1 },
            coveredArea: 85,
            features: ['Smart home', 'Ample parking lot'],
            dateAdded: new Date('2024-01-10')
        },
        {
            id: 4,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/07.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/08.jpg', 504, 230, 'Image']
            ],
            title: '5 bedroom house',
            location: 'Ikoyi, Lagos',
            price: 25000000,
            badges: [['danger', 'Featured']],
            amenities: { bedrooms: 5, bathrooms: 4, toilets: 4, parking: 3 },
            coveredArea: 250,
            features: ['Pool', 'Gym', 'Boys quarter'],
            dateAdded: new Date('2024-01-25')
        },
        {
            id: 5,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/09.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/10.jpg', 504, 230, 'Image']
            ],
            title: '1 bedroom apartment',
            location: 'Yaba, Lagos',
            price: 1200000,
            badges: [['info', 'New']],
            amenities: { bedrooms: 1, bathrooms: 1, toilets: 1, parking: 1 },
            coveredArea: 45,
            features: ['Water heater'],
            dateAdded: new Date('2024-02-01')
        },
        {
            id: 6,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/11.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/12.jpg', 504, 230, 'Image']
            ],
            title: 'Studio apartment',
            location: 'Surulere, Lagos',
            price: 900000,
            badges: [],
            amenities: { bedrooms: 0, bathrooms: 1, toilets: 1, parking: 0 },
            coveredArea: 30,
            features: ['Smart home'],
            dateAdded: new Date('2024-01-30')
        },
        // Add more properties for pagination testing (50+ properties)
        ...Array.from({ length: 44 }, (_, i) => ({
            id: i + 7,
            href: '/single-v1',
            images: [
                [`/images/real-estate/catalog/${String((i % 20) + 13).padStart(2, '0')}.jpg`, 504, 230, 'Image'],
                [`/images/real-estate/catalog/${String((i % 20) + 14).padStart(2, '0')}.jpg`, 504, 230, 'Image']
            ],
            title: `${Math.floor(Math.random() * 4) + 1} bedroom ${i % 2 === 0 ? 'apartment' : 'house'}`,
            location: `Area ${i + 1}, Lagos, Nigeria`,
            price: Math.floor(Math.random() * 15000000) + 1000000,
            badges: i % 3 === 0 ? [['success', 'Verified']] : i % 2 === 0 ? [['danger', 'Featured']] : [['info', 'New']],
            amenities: {
                bedrooms: Math.floor(Math.random() * 4) + 1,
                bathrooms: Math.floor(Math.random() * 3) + 1,
                toilets: Math.floor(Math.random() * 3) + 1,
                parking: Math.floor(Math.random() * 2) + 1
            },
            coveredArea: Math.floor(Math.random() * 150) + 50,
            features: ['Smart home', 'Parking', 'Water heater'].slice(0, Math.floor(Math.random() * 3) + 1),
            dateAdded: new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        }))
    ]

    // Properties for shortlet (50+ properties)
    const propertiesShortlet = [
        {
            id: 101,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/30.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/31.jpg', 504, 230, 'Image']
            ],
            title: '1 bedroom serviced apartment',
            location: 'Victoria Island, Lagos',
            price: 25000,
            badges: [['success', 'Verified']],
            amenities: { bedrooms: 1, bathrooms: 1, toilets: 1, parking: 1 },
            coveredArea: 45,
            features: ['Smart home', 'Pool', 'Gym'],
            dateAdded: new Date('2024-01-15')
        },
        // Add more shortlet properties
        ...Array.from({ length: 49 }, (_, i) => ({
            id: i + 102,
            href: '/single-v1',
            images: [
                [`/images/real-estate/catalog/${String((i % 20) + 1).padStart(2, '0')}.jpg`, 504, 230, 'Image'],
                [`/images/real-estate/catalog/${String((i % 20) + 2).padStart(2, '0')}.jpg`, 504, 230, 'Image']
            ],
            title: `${Math.floor(Math.random() * 3) + 1} bedroom shortlet apartment`,
            location: `Shortlet Area ${i + 1}, Lagos, Nigeria`,
            price: Math.floor(Math.random() * 40000) + 15000,
            badges: i % 3 === 0 ? [['success', 'Verified']] : i % 2 === 0 ? [['danger', 'Featured']] : [['info', 'New']],
            amenities: {
                bedrooms: Math.floor(Math.random() * 3) + 1,
                bathrooms: Math.floor(Math.random() * 2) + 1,
                toilets: Math.floor(Math.random() * 2) + 1,
                parking: Math.floor(Math.random() * 2) + 1
            },
            coveredArea: Math.floor(Math.random() * 80) + 30,
            features: ['Smart home', 'Pool', 'Gym', 'Security cameras'].slice(0, Math.floor(Math.random() * 3) + 1),
            dateAdded: new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        }))
    ]

    // Properties for sale (50+ properties)
    const propertiesSale = [
        {
            id: 201,
            href: '/single-v1',
            images: [
                ['/images/real-estate/catalog/18.jpg', 504, 230, 'Image'],
                ['/images/real-estate/catalog/19.jpg', 504, 230, 'Image']
            ],
            title: '4 bedroom detached duplex',
            location: 'Lekki Phase 1, Lagos',
            price: 85000000,
            badges: [['success', 'Verified'], ['info', 'New']],
            amenities: { bedrooms: 4, bathrooms: 4, toilets: 5, parking: 2 },
            coveredArea: 200,
            totalArea: 300,
            features: ['Smart home', 'Pool', 'Boys quarter'],
            dateAdded: new Date('2024-01-15')
        },
        // Add more sale properties
        ...Array.from({ length: 49 }, (_, i) => ({
            id: i + 202,
            href: '/single-v1',
            images: [
                [`/images/real-estate/catalog/${String((i % 15) + 20).padStart(2, '0')}.jpg`, 504, 230, 'Image'],
                [`/images/real-estate/catalog/${String((i % 15) + 21).padStart(2, '0')}.jpg`, 504, 230, 'Image']
            ],
            title: `${Math.floor(Math.random() * 4) + 2} bedroom ${i % 2 === 0 ? 'house' : 'duplex'} for sale`,
            location: `Sale Area ${i + 1}, Lagos, Nigeria`,
            price: Math.floor(Math.random() * 100000000) + 20000000,
            badges: i % 3 === 0 ? [['success', 'Verified']] : i % 2 === 0 ? [['danger', 'Featured']] : [['info', 'New']],
            amenities: {
                bedrooms: Math.floor(Math.random() * 4) + 2,
                bathrooms: Math.floor(Math.random() * 4) + 2,
                toilets: Math.floor(Math.random() * 4) + 2,
                parking: Math.floor(Math.random() * 3) + 1
            },
            coveredArea: Math.floor(Math.random() * 200) + 100,
            totalArea: Math.floor(Math.random() * 300) + 150,
            features: ['Smart home', 'Pool', 'Gym', 'Boys quarter', 'Security cameras'].slice(0, Math.floor(Math.random() * 4) + 1),
            dateAdded: new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        }))
    ]

    // Get current properties based on category
    const getCurrentProperties = () => {
        switch(categoryParam) {
            case 'sale':
                return propertiesSale
            case 'shortlet':
                return propertiesShortlet
            default:
                return propertiesRent
        }
    }

    // Filter properties based on applied filters and search
    const filterProperties = (properties) => {
        return properties.filter(property => {
            // Search query filter
            if (searchQuery && !property.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !property.location.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Location filter
            if (appliedFilters.location && !property.location.toLowerCase().includes(appliedFilters.location.toLowerCase())) {
                return false
            }

            // Property type filter
            const selectedTypes = Object.entries(appliedFilters.propertyTypes || {})
                .filter(([key, value]) => value)
                .map(([key, value]) => key.toLowerCase())

            if (selectedTypes.length > 0) {
                const propertyMatchesType = selectedTypes.some(type =>
                    property.title.toLowerCase().includes(type) ||
                    property.title.toLowerCase().includes(type.split(' ')[0])
                )
                if (!propertyMatchesType) return false
            }

            // Price range filter
            if (appliedFilters.priceRange?.min || appliedFilters.priceRange?.max) {
                const minPrice = appliedFilters.priceRange.min ? parseInt(appliedFilters.priceRange.min) : 0
                const maxPrice = appliedFilters.priceRange.max ? parseInt(appliedFilters.priceRange.max) : Infinity

                if (property.price < minPrice || property.price > maxPrice) {
                    return false
                }
            }

            // Bedrooms filter
            if (appliedFilters.bedrooms) {
                if (appliedFilters.bedrooms === 'studio') {
                    if (property.amenities.bedrooms !== 0) return false
                } else if (appliedFilters.bedrooms === '4+') {
                    if (property.amenities.bedrooms < 4) return false
                } else {
                    if (property.amenities.bedrooms !== parseInt(appliedFilters.bedrooms)) return false
                }
            }

            // Bathrooms filter
            if (appliedFilters.bathrooms) {
                if (property.amenities.bathrooms !== parseInt(appliedFilters.bathrooms)) return false
            }

            // Amenities filter
            const selectedAmenities = Object.entries(appliedFilters.amenities || {})
                .filter(([key, value]) => value)
                .map(([key, value]) => key)

            if (selectedAmenities.length > 0) {
                const hasAllAmenities = selectedAmenities.every(amenity =>
                    property.features.includes(amenity)
                )
                if (!hasAllAmenities) return false
            }

            // Options filter
            if (appliedFilters.options?.Verified) {
                const hasVerifiedBadge = property.badges.some(badge => badge[1] === 'Verified')
                if (!hasVerifiedBadge) return false
            }

            if (appliedFilters.options?.Featured) {
                const hasFeaturedBadge = property.badges.some(badge => badge[1] === 'Featured')
                if (!hasFeaturedBadge) return false
            }

            return true
        })
    }

    // Sort properties
    const sortProperties = (properties) => {
        const sorted = [...properties]
        switch(sortBy) {
            case 'price-low-high':
                return sorted.sort((a, b) => a.price - b.price)
            case 'price-high-low':
                return sorted.sort((a, b) => b.price - a.price)
            case 'newest':
            default:
                return sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        }
    }

    // Get processed properties
    const currentProperties = getCurrentProperties()
    const filteredProperties = filterProperties(currentProperties)
    const sortedProperties = sortProperties(filteredProperties)

    // Calculate pagination
    const totalPages = Math.ceil(sortedProperties.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentPageProperties = sortedProperties.slice(startIndex, endIndex)

    // Format property for display
    const formatPropertyForDisplay = (property) => ({
        href: property.href,
        images: property.images,
        title: property.title,
        location: property.location,
        price: property.price.toLocaleString(),
        badges: property.badges,
        footer: [
            ['fi-bed', [property.amenities.bedrooms, 'bedrooms', 'bedroom']],
            ['fi-bath', [property.amenities.bathrooms, 'bathrooms', 'bathroom']],
            ['fi-car', [property.amenities.parking, 'parking spaces', 'parking space']]
        ]
    })

    // FIXED PAGINATION COMPONENT
    const renderPagination = () => {
        if (totalPages <= 1) return null

        const items = []
        const maxVisiblePages = 5 // Show up to 5 pages before using ellipsis

        // Previous button
        if (currentPage > 1) {
            items.push(
                <Pagination.Item
                    key="prev"
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    <i className='fi-chevron-left'></i>
                </Pagination.Item>
            )
        }

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is 5 or less
            for (let page = 1; page <= totalPages; page++) {
                items.push(
                    <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </Pagination.Item>
                )
            }
        } else {
            // More than 5 pages - show smart pagination
            if (currentPage <= 3) {
                // Show first 3 pages, ellipsis, last page
                for (let page = 1; page <= 3; page++) {
                    items.push(
                        <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Pagination.Item>
                    )
                }

                if (totalPages > 4) {
                    items.push(<Pagination.Ellipsis key="ellipsis" />)
                    items.push(
                        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
                            {totalPages}
                        </Pagination.Item>
                    )
                }
            } else if (currentPage >= totalPages - 2) {
                // Show first page, ellipsis, last 3 pages
                items.push(
                    <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
                        1
                    </Pagination.Item>
                )

                if (totalPages > 4) {
                    items.push(<Pagination.Ellipsis key="ellipsis" />)
                }

                for (let page = totalPages - 2; page <= totalPages; page++) {
                    items.push(
                        <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Pagination.Item>
                    )
                }
            } else {
                // Show first page, ellipsis, current page and neighbors, ellipsis, last page
                items.push(
                    <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
                        1
                    </Pagination.Item>
                )

                items.push(<Pagination.Ellipsis key="ellipsis1" />)

                // Show current page and immediate neighbors
                for (let page = currentPage - 1; page <= currentPage + 1; page++) {
                    items.push(
                        <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Pagination.Item>
                    )
                }

                items.push(<Pagination.Ellipsis key="ellipsis2" />)

                items.push(
                    <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                    </Pagination.Item>
                )
            }
        }

        // Next button
        if (currentPage < totalPages) {
            items.push(
                <Pagination.Item
                    key="next"
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    <i className='fi-chevron-right'></i>
                </Pagination.Item>
            )
        }

        return (
            <nav className='border-top pb-md-4 pt-4' aria-label='Pagination'>
                <Pagination className='mb-1'>
                    {items}
                </Pagination>
            </nav>
        )
    }

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(1)
    }

    // Property type options
    const propertyTypeOptions = [
        'House', 'Apartment', 'Shortlet', 'Office space',
        'Commercial', 'Land', 'Room', 'Plaza', 'Others'
    ]

    // Amenities options
    const amenityOptions = [
        'Smart home', 'Smoke detector', 'Ample parking lot', 'Gym',
        'Parking', 'Pool', 'Security cameras', 'Water heater',
        'POP ceiling', 'Heat extractor', 'Drinkable water', 'Boys quarter'
    ]

    // Bedrooms and bathrooms options
    const bedroomOptions = [
        {name: 'Studio', value: 'studio'},
        {name: '1', value: '1'},
        {name: '2', value: '2'},
        {name: '3', value: '3'},
        {name: '4+', value: '4+'}
    ]

    const bathroomOptions = [
        {name: '1', value: '1'},
        {name: '2', value: '2'},
        {name: '3', value: '3'},
        {name: '4', value: '4'}
    ]

    return (
        <RealEstatePageLayout
            pageTitle={`Property for ${categoryParam === 'sale' ? 'Sale' : categoryParam === 'shortlet' ? 'Shortlet' : 'Rent'}`}
            activeNav='Catalog'
            userLoggedIn={isAuthenticated}
            user={user}
        >
            {/* Page container */}
            <Container fluid className='mt-5 pt-5 p-0'>
                <Row className='g-0 mt-n3'>

                    {/* Filters sidebar */}
                    <Col
                        as='aside'
                        lg={4}
                        xl={3}
                        className='border-top-lg border-end-lg shadow-sm px-3 px-xl-4 px-xxl-5 pt-lg-2'
                    >
                        <Offcanvas
                            show={show}
                            onHide={handleClose}
                            responsive='lg'
                        >
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title as='h5'>Filters</Offcanvas.Title>
                            </Offcanvas.Header>

                            {/* Search form */}
                            <Offcanvas.Header className='d-block border-bottom pt-0 pt-lg-4 px-lg-0'>
                                <Form onSubmit={handleSearch}>
                                    <FormGroup>
                                        <InputGroup size='sm'>
                                            <InputGroup.Text className='text-muted'>
                                                <i className='fi-search'></i>
                                            </InputGroup.Text>
                                            <Form.Control
                                                placeholder='Search properties...'
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </InputGroup>
                                        <Button variant='primary' size='sm' type='submit'>Search</Button>
                                    </FormGroup>
                                </Form>
                            </Offcanvas.Header>

                            {/* Nav tabs */}
                            <Offcanvas.Header className='d-block border-bottom pt-0 pt-lg-4 px-lg-0'>
                                <Nav variant='tabs' className='mb-0'>
                                    <Nav.Item>
                                        <Nav.Link as={Link} href='/properties?category=rent' active={categoryParam === 'rent'}>
                                            Rent
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link as={Link} href='/properties?category=shortlet' active={categoryParam === 'shortlet'}>
                                            Shortlet
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link as={Link} href='/properties?category=sale' active={categoryParam === 'sale'}>
                                            Sale
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Offcanvas.Header>

                            {/* Filter controls */}
                            <Offcanvas.Body className='py-lg-4'>
                                {/* Location */}
                                <div className='pb-4 mb-2 position-relative' ref={locationInputRef}>
                                    <h3 className='h6'>Location</h3>
                                    <Form.Control
                                        type='text'
                                        placeholder='Enter state, city, or area...'
                                        value={locationValue}
                                        onChange={handleLocationChange}
                                    />

                                    {showSuggestions && locationSuggestions.length > 0 && (
                                        <div className='position-absolute w-100 bg-white border rounded shadow-sm' style={{ zIndex: 1050, top: '100%' }}>
                                            <ListGroup variant="flush">
                                                {locationSuggestions.map((suggestion, index) => (
                                                    <ListGroup.Item
                                                        key={index}
                                                        action
                                                        onClick={() => handleSuggestionSelect(suggestion)}
                                                        className='py-2 px-3 border-0'
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {suggestion}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}
                                </div>

                                {/* Property type */}
                                <div className='pb-4 mb-2'>
                                    <h3 className='h6'>Property type</h3>
                                    <SimpleBar autoHide={false} className='simplebar-no-autohide' style={{maxHeight: '11rem'}}>
                                        {propertyTypeOptions.map((type, index) => (
                                            <Form.Check
                                                key={index}
                                                id={`type-${index}`}
                                                type="checkbox"
                                                checked={tempFilters.propertyTypes?.[type] || false}
                                                onChange={(e) => handleTempFilterChange('propertyTypes', type, e.target.checked)}
                                                label={<span className='fs-sm'>{type}</span>}
                                            />
                                        ))}
                                    </SimpleBar>
                                </div>

                                {/* Price range */}
                                <div className='pb-4 mb-2'>
                                    <h3 className='h6 pt-1'>
                                        {categoryParam === 'rent' ? "Price per year" :
                                            categoryParam === 'shortlet' ? "Price per night" : "Price range"}
                                    </h3>
                                    <div className='d-flex align-items-center'>
                                        <Form.Control
                                            type='number'
                                            step={categoryParam === 'shortlet' ? 1000 : 100000}
                                            placeholder='From'
                                            className='w-100'
                                            value={tempFilters.priceRange?.min || ''}
                                            onChange={(e) => handleTempFilterChange('priceRange', 'min', e.target.value)}
                                        />
                                        <div className='mx-2'>&mdash;</div>
                                        <Form.Control
                                            type='number'
                                            step={categoryParam === 'shortlet' ? 1000 : 100000}
                                            placeholder='To'
                                            className='w-100'
                                            value={tempFilters.priceRange?.max || ''}
                                            onChange={(e) => handleTempFilterChange('priceRange', 'max', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Beds & baths */}
                                <div className='pb-4 mb-2'>
                                    <h3 className='h6 pt-1'>Beds &amp; baths</h3>
                                    <label className='d-block fs-sm mb-1'>Bedrooms</label>
                                    <ButtonGroup size='sm' className='d-flex flex-wrap'>
                                        {bedroomOptions.map((bedroom, index) => (
                                            <Button
                                                key={index}
                                                variant={tempFilters.bedrooms === bedroom.value ? 'primary' : 'outline-secondary'}
                                                size="sm"
                                                className='me-1 mb-1'
                                                onClick={() => handleTempFilterChange('bedrooms', null,
                                                    tempFilters.bedrooms === bedroom.value ? '' : bedroom.value)}
                                            >
                                                {bedroom.name}
                                            </Button>
                                        ))}
                                    </ButtonGroup>

                                    <label className='d-block fs-sm pt-2 my-1'>Bathrooms</label>
                                    <ButtonGroup size='sm' className='d-flex flex-wrap'>
                                        {bathroomOptions.map((bathroom, index) => (
                                            <Button
                                                key={index}
                                                variant={tempFilters.bathrooms === bathroom.value ? 'primary' : 'outline-secondary'}
                                                size="sm"
                                                className='me-1 mb-1'
                                                onClick={() => handleTempFilterChange('bathrooms', null,
                                                    tempFilters.bathrooms === bathroom.value ? '' : bathroom.value)}
                                            >
                                                {bathroom.name}
                                            </Button>
                                        ))}
                                    </ButtonGroup>
                                </div>

                                {/* Square metres */}
                                {categoryParam === 'sale' && (
                                    <div className='pb-4 mb-2'>
                                        <h3 className='h6 pt-1'>Square metres</h3>
                                        <div className='d-flex align-items-center'>
                                            <Form.Control
                                                type='number'
                                                min={20}
                                                max={500}
                                                step={10}
                                                placeholder='Min'
                                                className='w-100'
                                                value={tempFilters.squareMetres?.min || ''}
                                                onChange={(e) => handleTempFilterChange('squareMetres', 'min', e.target.value)}
                                            />
                                            <div className='mx-2'>&mdash;</div>
                                            <Form.Control
                                                type='number'
                                                min={20}
                                                max={500}
                                                step={10}
                                                placeholder='Max'
                                                className='w-100'
                                                value={tempFilters.squareMetres?.max || ''}
                                                onChange={(e) => handleTempFilterChange('squareMetres', 'max', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Amenities */}
                                <div className='pb-4 mb-2'>
                                    <h3 className='h6'>Amenities</h3>
                                    <SimpleBar autoHide={false} className='simplebar-no-autohide' style={{maxHeight: '11rem'}}>
                                        {amenityOptions.map((amenity, index) => (
                                            <Form.Check
                                                key={index}
                                                id={`amenity-${index}`}
                                                type="checkbox"
                                                checked={tempFilters.amenities?.[amenity] || false}
                                                onChange={(e) => handleTempFilterChange('amenities', amenity, e.target.checked)}
                                                label={<span className='fs-sm'>{amenity}</span>}
                                            />
                                        ))}
                                    </SimpleBar>
                                </div>

                                {/* Pets */}
                                {(categoryParam === 'rent' || categoryParam === 'shortlet') && (
                                    <div className='pb-4 mb-2'>
                                        <h3 className='h6'>Pets</h3>
                                        {['Cats allowed', 'Dogs allowed'].map((pet, index) => (
                                            <Form.Check
                                                key={index}
                                                id={`pets-${index}`}
                                                type="checkbox"
                                                checked={tempFilters.pets?.[pet] || false}
                                                onChange={(e) => handleTempFilterChange('pets', pet, e.target.checked)}
                                                label={<span className='fs-sm'>{pet}</span>}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Additional options */}
                                <div className='pb-4 mb-2'>
                                    <h3 className='h6'>Additional options</h3>
                                    {['Verified', 'Featured'].map((option, index) => (
                                        <Form.Check
                                            key={index}
                                            id={`options-${index}`}
                                            type="checkbox"
                                            checked={tempFilters.options?.[option] || false}
                                            onChange={(e) => handleTempFilterChange('options', option, e.target.checked)}
                                            label={<span className='fs-sm'>{option}</span>}
                                        />
                                    ))}
                                </div>

                                {/* Filter buttons */}
                                <div className='border-top py-4'>
                                    <div className='d-grid gap-2'>
                                        <Button variant='primary' onClick={applyFilters}>
                                            <i className='fi-filter me-2'></i>
                                            Apply Filters
                                        </Button>
                                        <Button variant='outline-primary' onClick={resetFilters}>
                                            <i className='fi-rotate-right me-2'></i>
                                            Reset filters
                                        </Button>
                                    </div>
                                </div>
                            </Offcanvas.Body>
                        </Offcanvas>
                    </Col>

                    {/* Content */}
                    <Col lg={8} xl={9} className='position-relative overflow-hidden pb-5 pt-4 px-3 px-xl-4 px-xxl-5'>
                        {/* Breadcrumb */}
                        <Breadcrumb className='mb-3 pt-md-2'>
                            <Breadcrumb.Item linkAs={Link} href='/'>Home</Breadcrumb.Item>
                            <Breadcrumb.Item active>
                                Properties for {categoryParam === 'sale' ? 'sale' : categoryParam === 'shortlet' ? 'shortlet' : 'rent'}
                            </Breadcrumb.Item>
                        </Breadcrumb>

                        {/* Title */}
                        <div className='d-sm-flex align-items-center justify-content-between pb-3 pb-sm-4'>
                            <h1 className='h2 mb-sm-0'>
                                Properties for {categoryParam === 'sale' ? 'sale' : categoryParam === 'shortlet' ? 'shortlet' : 'rent'}
                            </h1>
                        </div>

                        {/* Sorting */}
                        <div className='d-flex flex-sm-row flex-column align-items-sm-center align-items-stretch my-2'>
                            <Form.Group controlId='sortby' className='d-flex align-items-center flex-shrink-0'>
                                <Form.Label className='text-body fs-sm me-2 mb-0 pe-1 text-nowrap'>
                                    <i className='fi-arrows-sort text-muted mt-n1 me-2'></i>
                                    Sort by:
                                </Form.Label>
                                <Form.Select
                                    size='sm'
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value='newest'>Newest</option>
                                    <option value='price-low-high'>Low - High Price</option>
                                    <option value='price-high-low'>High - Low Price</option>
                                </Form.Select>
                            </Form.Group>
                            <hr className='d-none d-sm-block w-100 mx-4' />
                            <div className='d-none d-sm-flex align-items-center flex-shrink-0 text-muted'>
                                <i className='fi-check-circle me-2'></i>
                                <span className='fs-sm mt-n1'>{sortedProperties.length} results</span>
                            </div>
                        </div>

                        {/* Properties display */}
                        {currentPageProperties.length > 0 ? (
                            <Row xs={1} sm={2} xl={3} className='g-4 py-4'>
                                {currentPageProperties.map((property, index) => {
                                    const displayProperty = formatPropertyForDisplay(property)
                                    return (
                                        <Col key={property.id}>
                                            <PropertyCard
                                                href={displayProperty.href}
                                                images={displayProperty.images}
                                                title={displayProperty.title}
                                                location={displayProperty.location}
                                                price={displayProperty.price}
                                                badges={displayProperty.badges}
                                                wishlistButton={{
                                                    tooltip: 'Add to Wishlist',
                                                    props: {
                                                        onClick: () => console.log('Property added to your Wishlist!')
                                                    }
                                                }}
                                                footer={displayProperty.footer}
                                                className='h-100'
                                            />
                                        </Col>
                                    )
                                })}
                            </Row>
                        ) : (
                            <div className='d-flex align-items-center justify-content-center' style={{ minHeight: '60vh' }}>
                                <div className='text-center'>
                                    <i className='fi-home display-1 text-muted mb-4'></i>
                                    <h3 className='h4 mb-3'>No properties found</h3>
                                    <p className='text-muted mb-0 fs-lg'>Try adjusting your search filters or search terms.</p>
                                </div>
                            </div>
                        )}

                        {/* Fixed Pagination */}
                        {renderPagination()}
                    </Col>
                </Row>
            </Container>

            {/* Mobile filter button */}
            <Button size='sm' className='w-100 rounded-0 fixed-bottom d-lg-none' onClick={handleShow}>
                <i className='fi-filter me-2'></i>
                Filters
            </Button>
            <AccountUpgradeToast />
        </RealEstatePageLayout>
    )
}

export default PropertiesPage