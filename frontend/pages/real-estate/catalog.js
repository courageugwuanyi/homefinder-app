import { useEffect, useState, useRef } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import RealEstatePageLayout from '../../components/partials/RealEstatePageLayout'
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
import ImageLoader from '../../components/ImageLoader'
import PropertyCard from '../../components/PropertyCard'
import SimpleBar from 'simplebar-react'
import ReactSlider from 'react-slider'
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
  import('../../components/partials/CustomMarker'),
  { ssr: false }
)
const Popup = dynamic(() => 
  import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)
import 'leaflet/dist/leaflet.css'
import AddPropertyToast from "../../components/AddPropertyToast";
import {useAuth} from "../../hooks/useAuth";

const CatalogPage = () => {

  const { user, isAuthenticated } = useAuth()
    
  // Add extra class to body
  useEffect(() => {
    const body = document.querySelector('body')
    document.body.classList.add('fixed-bottom-btn')
    return () => body.classList.remove('fixed-bottom-btn')
  })

  // Query param (Switch between Rent and Sale category)
  const router = useRouter(),
        categoryParam = router.query.category === 'sale' ? 'sale' : 'rent'

        // Media query for displaying Offcanvas on screens larger than 991px
  const isDesktop = useMediaQuery({ query: '(min-width: 992px)' })

  // Offcanvas show/hide
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  // Property type checkboxes
  const propertyType = [
    {value: 'House', checked: false},
    {value: 'Apartment', checked: true},
    {value: 'Shortlet', checked: false},
    {value: 'Office space', checked: false},
    {value: 'Commercial', checked: false},
    {value: 'Land', checked: false},
    {value: 'Room', checked: false},
    {value: 'Plaza', checked: false},
    {value: 'Others', checked: false}
  ]

  // Price range slider
  const PriceRange = () => {
    const [minPrice, setMinPrice] = useState(categoryParam === 'sale' ? 5000000 : 200000)
    const [maxPrice, setMaxPrice] = useState(categoryParam === 'sale' ? 80000000 : 3000000)

    const handleInputChange = e => {
      if (e.target.name === 'minPrice') {
        setMinPrice(e.target.value)
      } else {
        setMaxPrice(e.target.value)
      }
    }

    const handleSliderChange = sliderVal => {
      let sliderMinVal = sliderVal[0]
      let sliderMaxVal = sliderVal[1]
      setMinPrice(sliderMinVal)
      setMaxPrice(sliderMaxVal)
    }

    const formatNumber = (value) => {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    return (
      <>
        <ReactSlider
          className='range-slider'
          thumbClassName='range-slider-handle'
          trackClassName='range-slider-track'
          min={categoryParam === 'sale' ? 100000 : 10000}
          max={categoryParam === 'sale' ? 100000000 : 5000000}
          value={[minPrice, maxPrice]}
          ariaLabel={['Lower handle', 'Upper handle']}
          ariaValuetext={state => `Handle value ${state.valueNow}`}
          renderThumb={(props, state) => (<div {...props}>
            <div className='range-slider-tooltip'>₦ {formatNumber(state.valueNow)}</div>
          </div>)}
          pearling
          onChange={handleSliderChange}
        />
        <div className='d-flex align-items-center'>
          <div className='w-100 pe-2'>
            <InputGroup>
              <InputGroup.Text className='fs-base'>₦</InputGroup.Text>
              <Form.Control
                name='minPrice'
                value={minPrice}
                onChange={handleInputChange}
              />
            </InputGroup>
          </div>
          <div className='text-muted'>—</div>
          <div className='w-100 ps-2'>
            <InputGroup>
              <InputGroup.Text className='fs-base'>₦</InputGroup.Text>
              <Form.Control
                name='maxPrice'
                value={maxPrice}
                onChange={handleInputChange}
              />
            </InputGroup>
          </div>
        </div>
      </>
    )
  }

  // Bedrooms number
  const [bedroomsValue, setBedroomsValue] = useState('')
  const bedrooms = [
    {name: 'Studio', value: 'studio'},
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4+', value: '4+'}
  ]

  // Bathrooms number
  const [bathroomsValue, setBathroomsValue] = useState('')
  const bathrooms = [
    {name: '1', value: '1'},
    {name: '2', value: '2'},
    {name: '3', value: '3'},
    {name: '4', value: '4'}
  ]

  // Amenities checkboxes
  const amenities = [
    {value: 'Smart home', checked: true},
    {value: 'Smoke detector', checked: false},
    {value: 'Ample parking lot', checked: true},
    {value: 'Gym', checked: false},
    {value: 'Parking', checked: false},
    {value: 'Pool', checked: false},
    {value: 'Security cameras', checked: false},
    {value: 'Water heater', checked: true},
    {value: 'POP ceiling', checked: false},
    {value: 'Heat extractor', checked: false},
    {value: 'Drinkable water', checked: false},
    {value: 'Boys quarter', checked: false},
    {value: 'Boys quarter', checked: false}
  ]

  // Pets checkboxes
  const pets = [
    {value: 'Cats allowed', checked: false},
    {value: 'Dogs allowed', checked: false}
  ]

  // Additional options checkboxes
  const options = [
    {value: 'Verified', checked: false},
    {value: 'Featured', checked: false}
  ]

  // Map popup state
  const [showMap, setShowMap] = useState(false)

  // Map markers
  const markers = [
    {
      position: [6.4281, 3.4219],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/18.jpg' : '/images/real-estate/catalog/06.jpg',
        title: categoryParam === 'sale' ? '4 bedroom detached duplex' : '3 bedroom flat / apartment for rent',
        address: categoryParam === 'sale' ? 'Ajah, Lekki, Lagos' : 'Victoria Island (VI), Lagos',
        price: categoryParam === 'sale' ? '165,000,000' : '1,650,000',
        amenities: categoryParam === 'sale' ? [4, 5, 4] : [3, 3, 1]
      }
    },
    {
      position: [6.4398, 3.4890],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/19.jpg' : '/images/real-estate/catalog/07.jpg',
        title: categoryParam === 'sale' ? '4 bedroom semi-detached duplex for sale' : 'Pine Apartments | 56 sq.m',
        address: 'Ikate, Lekki, Lagos',
        price: categoryParam === 'sale' ? '162,000' : '2,000,000',
        amenities: categoryParam === 'sale' ? [2, 1, 1] : [4, 2, 2]
      }
    },
    {
      position: [6.5777, 3.3885],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/20.jpg' : '/images/real-estate/catalog/08.jpg',
        title: categoryParam === 'sale' ? 'Jahi, Abuja' : 'Greenpoint Rentals | 85 sq.m',
        address: '143 E-Houston Street, NY 11105',
        price: categoryParam === 'sale' ? '$85,000' : '$1,350',
        amenities: categoryParam === 'sale' ? [2, 1, 1] : [2, 1, 0]
      }
    },
    {
      position: categoryParam === 'sale' ? [9.1068, 7.4476]: [8.9641, 7.3814],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/21.jpg' : '/images/real-estate/catalog/09.jpg',
        title: categoryParam === 'sale' ? 'Jahi, Abuja' : 'By Glory Dome, Lugbe District, Abuja',
        address: categoryParam === 'sale' ? '4 bedroom house' : '2 bedroom flat / apartment for rent',
        price: categoryParam === 'sale' ? '300,500,000' : '7,500,000',
        amenities: categoryParam === 'sale' ? [4, 4, 2] : [4, 2, 2]
      }
    },
    {
      position: [5.1137, 7.3868],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/22.jpg' : '/images/real-estate/catalog/10.jpg',
        title: categoryParam === 'sale' ? 'Commercial Land' : 'Self contain (single rooms) for rent',
        address: '  Aku Ruo  Ulo Phase 2  Ogbor Hill, Aba, Abia5',
        price: categoryParam === 'sale' ? '8,000,000' : '8,000,000',
        amenities: categoryParam === 'sale' ? [3, 1, 1] : [2, 1, 0]
      }
    },
    {
      position: [6.4252, 3.3976],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/23.jpg' : '/images/real-estate/catalog/11.jpg',
        title: categoryParam === 'sale' ? '5 bedroom terraced duplex' : '2 bedroom flat / apartment for rent',
        address: 'Royal Pine, Lekki Phase 2, Lekki, Lagos',
        price: categoryParam === 'sale' ? '620,400,000' : '6,800,000',
        amenities: categoryParam === 'sale' ? [5, 5, 5] : [2, 2, 1]
      }
    },
    {
      position: [9.20215, 7.39939],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/24.jpg' : '/images/real-estate/catalog/12.jpg',
        title: categoryParam === 'sale' ? '4 bedroom terraced duplex for sale' : '3 bedroom detached duplex for rent',
        address: 'Diplomatic Zone, Katampe Extension, Katampe, Abuja',
        price: categoryParam === 'sale' ? '280,000,000' : '10,000,000',
        amenities: categoryParam === 'sale' ? [4, 4, 3] : [3, 3, 2]
      }
    },
    {
      position: [6.6176, 3.3817],
      popup: {
        href: '/real-estate/single-v1',
        img: categoryParam === 'sale' ? '/images/real-estate/catalog/25.jpg' : '/images/real-estate/catalog/13.jpg',
        title: categoryParam === 'sale' ? '4 bedroom semi-detached duplex for sale' : '2 bedroom flat / apartment for rent',
        address: 'GRA Phase 2, Magodo, Lagos',
        price: categoryParam === 'sale' ? '70,000.000' : '4,500,000',
        amenities: categoryParam === 'sale' ? [4, 4, 3] : [2, 2, 1]
      }
    }
  ]

  // Properties for rent array
  const propertiesRent = [
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/06.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/06.jpg', 504, 230, 'Image']
      ],
      title: '3-bed Apartment',
      location: 'Off Freedom Way, Lekki Phase 1, Lekki, Lagos',
      price: '1,650,000',
      badges: [['success', 'Verified'], ['info', 'New']],
      amenities: [
        [3, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [1, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","67 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/07.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/07.jpg', 504, 230, 'Image']
      ],
      title: '4 bedroom terraced duplex for rent',
      location: 'Chevron, Lekki, Lagos',
      price: '10,000,000',
      badges: [['info', 'New']],
      amenities: [
        [4, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [2, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","67 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/08.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/08.jpg', 504, 230, 'Image']
      ],
      title: 'Self contain (single rooms)',
      location: 'Royal Pine, Lekki Phase 2, Lekki, Lagos',
      price: '1,350,000',
      badges: [['info', 'New']],
      amenities: [
        [2, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [2, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","67 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/09.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/09.jpg', 504, 230, 'Image']
      ],
      title: '5 Bedroom House',
      location: 'Lekki Phase 1, Lekki, Lagos',
      price: '20,000,000',
      badges: [['success', 'Verified']],
      amenities: [
        [5, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [2, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","85 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/10.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/10.jpg', 504, 230, 'Image']
      ],
      title: '4 bedroom terraced duplex',
      location: 'Ikoyi, Lagos',
      price: '5,000,000',
      badges: [['success', 'Verified'], ['danger', 'Featured']],
      amenities: [
        [4, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [4, 'toilets', "toilet"],
        [2, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","65 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/11.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/11.jpg', 504, 230, 'Image']
      ],
      title: '3 bedroom flat / apartment',
      location: 'After Uba, Sangotedo, Ajah, Lagos',
      price: '3,500,000',
      badges: [['info', 'New']],
      amenities: [
        [3, 'bedrooms', 'bedroom'],
        [3, 'bathrooms', "bathroom"],
        [5, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/12.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/12.jpg', 504, 230, 'Image']
      ],
      title: '2 bedroom flat / apartment for rent',
      location: 'Katampe, Katampe (Main), Katampe, Abuja',
      price: '5,000,000',
      badges: [['danger', 'Featured']],
      amenities: [
        [2, 'bedrooms', 'bedroom'],
        [3, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [10, 'parking spaces', "parking space"]
      ],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/13.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/13.jpg', 504, 230, 'Image']
      ],
      title: '3 bedroom flat / apartment',
      location: 'GRA Phase 2, Magodo, Lagos',
      price: '6,000,000',
      badges: [['success', 'Verified']],
      amenities: [
        [3, 'bedrooms', 'bedroom'],
        [3, 'bathrooms', "bathroom"],
        [4, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/14.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/14.jpg', 504, 230, 'Image']
      ],
      title: 'Commercial property/spaces',
      location: 'Life Camp, Abuja',
      price: '5,500,000',
      badges: [],
      amenities: [2, 1, 0],
      coveredArea: ["covered area","1,800 sq.m"],
      totalArea: ["total area", "1,800 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/15.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/15.jpg', 504, 230, 'Image']
      ],
      title: '10 bedroom hotel / guest house for rent',
      location: 'Victoria Island (VI), Lagos',
      price: '110,000,000',
      badges: [],
      amenities: [
        [10, 'bedrooms', 'bedroom'],
        [10, 'bathrooms', "bathroom"],
        [15, 'toilets', "toilet"],
        [15, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area", "1,800 sq.m"],
      totalArea: ["total area", "1,800 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/16.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/16.jpg', 504, 230, 'Image']
      ],
      title: '4 bedroom house for rent',
      location: 'Fully Serviced Luxury Home, Banana Island, Ikoyi, Lagos',
      price: '50,000,000',
      badges: [['danger', 'Featured']],
      amenities: [
        [4, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [5, 'toilets', "toilet"],
        [3, 'parking spaces', "parking space"]
      ],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/17.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/17.jpg', 504, 230, 'Image']
      ],
      title: '2 bedroom terraced duplex for rent',
      location: 'Omole Phase 2, Ikeja, Lagos',
      price: '5,000,000',
      badges: [],
      amenities: [
        [2, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [2, 'toilets', "toilet"],
        [0, 'parking spaces', "parking space"] //TODO: Handle this case where no parking spaces are available
      ],
    }
  ]

  // Properties for sale array
  const propertiesSale = [
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/18.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/18.jpg', 504, 230, 'Image']
      ],
      title: 'Ellis Studio',
      location: 'Lekki Phase 1, Lekki, Lagos',
      price: '50,000',
      badges: [['success', 'Verified'], ['info', 'New']],
      amenities: [
        [1, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ],
      coveredArea: ["covered area","1,800 sq.m"],
      totalArea: ["total area", "1,800 sq.m"],
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/19.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/19.jpg', 504, 230, 'Image']
      ],
      title: 'Country House | 120 sq.m',
      location: '6954 Grand AveMaspeth, NY 11378',
      price: '$162,000',
      badges: [['info', 'New']],
      amenities: [
        [1, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/20.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/20.jpg', 504, 230, 'Image']
      ],
      title: 'Condo | 70 sq.m',
      location: '276 5th Avenue New York, NY 10001',
      price: '$85,000',
      badges: [['info', 'New']],
      amenities: [
        [3, 'bedrooms', 'bedroom'],
        [2, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [2, 'parking spaces', "parking space"]
      ]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/21.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/21.jpg', 504, 230, 'Image']
      ],
      title: 'Luxury Rental Villa | 180 sq.m',
      location: '118-11 Sutphin Blvd Jamaica, NY 11434',
      price: '$300,500',
      badges: [['success', 'Verified']],
      amenities: [
        [1, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/22.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/22.jpg', 504, 230, 'Image']
      ],
      title: 'Cottage | 120 sq.m',
      location: '42 Broadway New York, NY 10004',
      price: '$184,000',
      badges: [['success', 'Verified'], ['danger', 'Featured']],
      amenities: [
        [1, 'bedrooms', 'bedroom'],
        [4, 'bathrooms', "bathroom"],
        [3, 'toilets', "toilet"],
        [1, 'parking spaces', "parking space"]
      ]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/23.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/23.jpg', 504, 230, 'Image']
      ],
      title: 'Modern House | 170 sq.m',
      location: '82 Nassau St New York, NY 10038',
      price: '$620,400',
      badges: [['info', 'New']],
      amenities: [5, 2, 2]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/24.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/24.jpg', 504, 230, 'Image']
      ],
      title: 'Duplex with Garage | 200 sq.m',
      location: '21 Pulaski Road Kings Park, NY 11754',
      price: 'From $200,670',
      badges: [['danger', 'Featured']],
      amenities: [4, 2, 3]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/25.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/25.jpg', 504, 230, 'Image']
      ],
      title: 'Studio | 40 sq.m',
      location: '1879 Whitehaven Road Grand Island, NY 14072',
      price: '$92,000',
      badges: [['success', 'Verified']],
      amenities: [1, 1, 1]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/26.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/26.jpg', 504, 230, 'Image']
      ],
      title: 'Villa with Pool | 85 sq.m',
      location: '21 India St Brooklyn, NY 11222',
      price: '$105,000',
      badges: [],
      amenities: [2, 1, 2]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/27.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/27.jpg', 504, 230, 'Image']
      ],
      title: 'Family Home | 200 sq.m',
      location: '140-60 Beech Ave Flushing, NY 11355',
      price: '$740,000',
      badges: [],
      amenities: [5, 3, 2]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/28.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/28.jpg', 504, 230, 'Image']
      ],
      title: 'Merry House | 98 sq.m',
      location: '123-12 Jamaica Ave Queens, NY 11418',
      price: '$275,800',
      badges: [],
      amenities: [3, 1, 2]
    },
    {
      href: '/real-estate/single-v1',
      images: [
        ['/images/real-estate/catalog/29.jpg', 504, 230, 'Image'],
        ['/images/real-estate/catalog/29.jpg', 504, 230, 'Image']
      ],
      title: 'White Cottage | 70 sq.m',
      location: '3979 Albany Post Road Hyde Park, NY 12538',
      price: '$84,000',
      badges: [['success', 'Verified'], ['danger', 'Featured']],
      amenities: [2, 1, 1]
    }
  ]

  // properties.title keyword array
  const propertyTitleKeywords = ['house', 'apartment', 'flat', 'duplex', 'terrace', 'bedroom'];


  return (
    <RealEstatePageLayout
      pageTitle={`Property for ${categoryParam === 'sale' ? 'Sale' : 'Rent'}`}
      activeNav='Catalog'
      userLoggedIn={isAuthenticated}
      user={user}
    >

      {/* Page container */}
      <Container fluid className='mt-5 pt-5 p-0'>
        <Row className='g-0 mt-n3'>


          {/* Filters sidebar (Offcanvas on screens < 992px) */}
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

              {/* Nav (switch between Rent / Sale) */}
              <Offcanvas.Header className='d-block border-bottom pt-0 pt-lg-4 px-lg-0'>
                <Nav variant='tabs' className='mb-0'>
                  <Nav.Item>
                    <Nav.Link as={Link} href='/real-estate/catalog?category=rent' active={categoryParam === 'rent' ? true : false}>
                      <i className='fi-rent fs-base me-2'></i>
                      For rent
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link as={Link} href='/real-estate/catalog?category=sale' active={categoryParam === 'sale' ? true : false}>
                      <i className='fi-home fs-base me-2'></i>
                      For sale
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Offcanvas.Header>

              {/* Offcanvas body */}
              <Offcanvas.Body className='py-lg-4'>
                <div className='pb-4 mb-2'>
                  <h3 className='h6'>Location</h3>
                  <Form.Select defaultValue='New York' className='mb-2'>
                    <option value='default' disabled>Choose State</option>
                    <option value='Lago'>Lagos</option>
                    <option value='Ibadan'>Ibadan</option>
                    <option value='Abuja'>Abuja</option>
                    <option value='Oyo'>Oyo</option>
                    <option value='Delta'>Delta</option>
                  </Form.Select>
                  <Form.Select defaultValue='default'>
                    <option value='default' disabled>Choose city</option>
                    <option value='Ajah'>Ajah</option>
                    <option value='Lekki'>Lekki</option>
                    <option value='Ojo'>Ojo</option>
                    <option value='Surulere'>Surulere</option>
                    <option value='Ikeja'>Ikeja</option>
                  </Form.Select>
                </div>
                <div className='pb-4 mb-2'>
                  <h3 className='h6'>Property type</h3>
                  <SimpleBar autoHide={false} className='simplebar-no-autohide' style={{maxHeight: '11rem'}}>
                    {propertyType.map(({value, checked}, indx) => (
                      <Form.Check
                        key={indx}
                        id={`type-${indx}`}
                        value={value}
                        defaultChecked={checked}
                        label={<><span className='fs-sm'>{value}</span></>}  
                      />
                    ))}
                  </SimpleBar>
                </div>
                <div className='pb-4 mb-2'>
                  <h3 className='h6'>{ categoryParam === 'rent' ? "Price per year" : "Price range"}</h3>
                  <PriceRange />
                </div>
                <div className='pb-4 mb-2'>
                  <h3 className='h6 pt-1'>Beds &amp; baths</h3>
                  <label className='d-block fs-sm mb-1'>Bedrooms</label>
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
                  <label className='d-block fs-sm pt-2 my-1'>Bathrooms</label>
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
                </div>
                { categoryParam === 'sale' && <div className='pb-4 mb-2'>
                  <h3 className='h6 pt-1'>Square metres</h3>
                  <div className='d-flex align-items-center'>
                    <Form.Control type='number' min={20} max={500} step={10} placeholder='Min' className='w-100'/>
                    <div className='mx-2'>&mdash;</div>
                    <Form.Control type='number' min={20} max={500} step={10} placeholder='Max' className='w-100'/>
                  </div>
                </div> }
                <div className='pb-4 mb-2'>
                  <h3 className='h6'>Amenities</h3>
                  <SimpleBar autoHide={false} className='simplebar-no-autohide' style={{maxHeight: '11rem'}}>
                    {amenities.map(({value, checked}, indx) => (
                      <Form.Check
                        key={indx}
                        id={`amenity-${indx}`}
                        value={value}
                        defaultChecked={checked}
                        label={<><span className='fs-sm'>{value}</span></>}  
                      />
                    ))}
                  </SimpleBar>
                </div>
                { categoryParam === 'rent' && <div className='pb-4 mb-2'>
                  <h3 className='h6'>Pets</h3>
                  {pets.map(({value, checked}, indx) => (
                      <Form.Check
                          key={indx}
                          id={`pets-${indx}`}
                          value={value}
                          defaultChecked={checked}
                          label={<><span className='fs-sm'>{value}</span></>}
                      />
                  ))}
                </div> }
                <div className='pb-4 mb-2'>
                  <h3 className='h6'>Additional options</h3>
                  {options.map(({value, checked}, indx) => (
                    <Form.Check
                      key={indx}
                      id={`options-${indx}`}
                      value={value}
                      defaultChecked={checked}
                      label={<><span className='fs-sm'>{value}</span></>}  
                    />
                  ))}
                </div>
                <div className='border-top py-4'>
                  <Button variant='outline-primary'>
                    <i className='fi-rotate-right me-2'></i>
                    Reset filters
                  </Button>
                </div>
              </Offcanvas.Body>
            </Offcanvas>
          </Col>


          {/* Content */}
          <Col lg={8} xl={9} className='position-relative overflow-hidden pb-5 pt-4 px-3 px-xl-4 px-xxl-5'>

            {/* Map popup */}
            <div className={`map-popup${showMap ? ' show': ''}`}>
              <Button
                size='sm'
                variant='light btn-icon shadow-sm rounded-circle'
                onClick={() => setShowMap(false)}
              >
                <i className='fi-x fs-xs'></i>
              </Button>
              <MapContainer
                center={isDesktop ? [6.4281, 3.4219] : [6.4281, 3.4219]}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: '100vh', width: '100%' }}
              >
                <TileLayer
                  url='https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=BO4zZpr0fIIoydRTOLSx'
                  tileSize={512}
                  zoomOffset={-1}
                  minZoom={1}
                  attribution={'\u003ca href=\'https://www.maptiler.com/copyright/\' target=\'_blank\'\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\'https://www.openstreetmap.org/copyright\' target=\'_blank\'\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e'}
                />
                {markers.map((marker, indx) => {
                  return <CustomMarker
                    key={indx}
                    position={marker.position}
                    icon='dot'
                  >
                    <Popup>
                      <div className='card border-0'>
                        <Link href={marker.popup.href} className='d-block'>
                          <ImageLoader src={marker.popup.img} width={280} height={128} alt='Image' />
                        </Link>
                        <div className='card-body position-relative pb-3'>
                          <h6 className='fs-xs fw-normal text-uppercase text-primary mb-1'>For {categoryParam === 'sale' ? 'sale' : 'rent'}</h6>
                          <h5 className='h6 mb-1 fs-sm'>
                            <Link href={marker.popup.href} className='nav-link stretched-link'>
                              {marker.popup.title}
                            </Link>
                          </h5>
                          <p className='mt-0 mb-2 fs-xs text-muted'>{marker.popup.address}</p>
                          <div className='fs-sm fw-bold'>
                            <i className='fi-cash me-2 fs-base align-middle opacity-70'></i>
                            &#8358;{marker.popup.price}
                          </div>
                        </div>
                        <div className='card-footer d-flex align-items-center justify-content-center mx-2 pt-2 text-nowrap'>
                          <span className='d-inline-block px-2 fs-sm'>
                            {marker.popup.amenities[0]}
                            <i className='fi-bed ms-1 fs-base text-muted'></i>
                          </span>
                          <span className='d-inline-block px-2 fs-sm'>
                            {marker.popup.amenities[1]}
                            <i className='fi-bath ms-1 fs-base text-muted'></i>
                          </span>
                          <span className='d-inline-block px-2 fs-sm'>
                            {marker.popup.amenities[2]}
                            <i className='fi-car ms-1 fs-base text-muted'></i>
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </CustomMarker>
                })}
              </MapContainer>
            </div>

            {/* Breadcrumb */}
            <Breadcrumb className='mb-3 pt-md-2'>
              <Breadcrumb.Item linkAs={Link} href='/real-estate'>Home</Breadcrumb.Item>
              <Breadcrumb.Item active>Properties for {categoryParam === 'sale' ? 'sale' : 'rent'}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Title + Map toggle */}
            <div className='d-sm-flex align-items-center justify-content-between pb-3 pb-sm-4'>
              <h1 className='h2 mb-sm-0'>Properties for {categoryParam === 'sale' ? 'sale' : 'rent'}</h1>
              <a
                href='#'
                className='d-inline-block fw-bold text-decoration-none py-1'
                onClick={(e) => {
                  e.preventDefault()
                  setShowMap(true)
                }}
              >
                <i className='fi-map me-2'></i>
                Map view
              </a>
            </div>

            {/* Sorting */}
            <div className='d-flex flex-sm-row flex-column align-items-sm-center align-items-stretch my-2'>
              <Form.Group controlId='sortby' className='d-flex align-items-center flex-shrink-0'>
                <Form.Label className='text-body fs-sm me-2 mb-0 pe-1 text-nowrap'>
                  <i className='fi-arrows-sort text-muted mt-n1 me-2'></i>
                  Sort by:
                </Form.Label>
                <Form.Select size='sm'>
                  <option value='Newest'>Newest</option>
                  <option value='Low - Hight Price'>Low - High Price</option>
                  <option value='High - Low Price'>High - Low Price</option>
                </Form.Select>
              </Form.Group>
              <hr className='d-none d-sm-block w-100 mx-4' />
              <div className='d-none d-sm-flex align-items-center flex-shrink-0 text-muted'>
                <i className='fi-check-circle me-2'></i>
                <span className='fs-sm mt-n1'>148 results</span>
              </div>
            </div>

            {/* Catalog grid */}
            <Row xs={1} sm={2} xl={3} className='g-4 py-4'>
              {categoryParam === 'sale'
                  ? propertiesSale.map((property, indx) => (
                      <Col key={indx}>
                        <PropertyCard
                          href={property.href}
                          images={property.images}
                          title={property.title}
                          category={property.category}
                          location={property.location}
                          price={property.price}
                          badges={property.badges}
                          wishlistButton={{
                            tooltip: 'Add to Wishlist',
                            props: {
                              onClick: () => console.log('Property added to your Wishlist!')
                            }
                          }}
                          footer={
                              (categoryParam === 'rent' || categoryParam === 'sale')
                              && propertyTitleKeywords.some(keywordInTitle => property.title.toLowerCase().includes(keywordInTitle))
                                ? [
                                  ["fi-bed", property.amenities[0]],
                                  ["fi-bath", property.amenities[1]],
                                  ["fi-toilet", property.amenities[2]],
                                  ["fi-car", property.amenities[2]]
                                ]
                                : [
                                  // ["fi-dice", property.coveredArea],
                                  // ["fi-resize", property.totalArea],
                                ]}
                          className='h-100'
                        />
                      </Col>
                    ))
                  : propertiesRent.map((property, indx) => (
                    <Col key={indx}>
                      <PropertyCard
                        href={property.href}
                        images={property.images}
                        title={property.title}
                        category={property.category}
                        location={property.location}
                        price={property.price}
                        badges={property.badges}
                        wishlistButton={{
                          tooltip: 'Add to Wishlist',
                          props: {
                            onClick: () => console.log('Property added to your Wishlist!')
                          }
                        }}
                        footer={[
                          ['fi-bed', property.amenities[0]],
                          ['fi-bath', property.amenities[1]],
                          ['fi-car', property.amenities[2]]
                        ]}
                        className='h-100'
                      />
                    </Col>
                  ))}
            </Row>

            {/* Pagination */}
            <nav className='border-top pb-md-4 pt-4' aria-label='Pagination'>
              <Pagination className='mb-1'>
                <Pagination.Item active>{1}</Pagination.Item>
                <Pagination.Item>{2}</Pagination.Item>
                <Pagination.Item>{3}</Pagination.Item>
                <Pagination.Ellipsis />
                <Pagination.Item>{8}</Pagination.Item>
                <Pagination.Item>
                  <i className='fi-chevron-right'></i>
                </Pagination.Item>
              </Pagination>
            </nav>
          </Col>
        </Row>
      </Container>

      {/* Filters sidebar toggle button (visible < 991px) */}
      <Button size='sm' className='w-100 rounded-0 fixed-bottom d-lg-none' onClick={handleShow}>
        <i className='fi-filter me-2'></i>
        Filters
      </Button>
      <AddPropertyToast />
    </RealEstatePageLayout>
  )
}

export default CatalogPage
