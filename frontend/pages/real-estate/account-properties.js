import {useMemo, useState} from 'react'
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
import PropertyCard from '../../components/PropertyCard'

const AccountPropertiesPage = () => {
  // Extended properties array with analytics
  const initialProperties = [
    // Published Properties (12 properties) with analytics
    {
      id: 1,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/08.jpg', 'Image']],
      category: 'For rent',
      title: 'Greenpoint Rentals | 85 sq.m',
      location: '1510 Castle Hill Ave Bronx, NY 10462',
      price: '$1,330',
      badges: [['info', 'New']],
      amenities: [1, 1, 1],
      status: 'published',
      createdAt: '2024-01-15',
      isPromoted: false,
      analytics: {
        views: 245,
        viewsThisMonth: 89
      }
    },
    {
      id: 2,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/10.jpg', 'Image']],
      category: 'For sale',
      title: 'Modern Downtown Apartment | 95 sq.m',
      location: '123 Main St New York, NY 10001',
      price: '$450,000',
      badges: [['success', 'Verified']],
      amenities: [2, 2, 1],
      status: 'published',
      createdAt: '2024-01-10',
      isPromoted: true,
      analytics: {
        views: 1205,
        viewsThisMonth: 234
      }
    },
    {
      id: 3,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/22.jpg', 'Image']],
      category: 'For rent',
      title: 'Luxury Penthouse | 150 sq.m',
      location: '456 Park Ave New York, NY 10016',
      price: '$3,500',
      badges: [['warning', 'Featured']],
      amenities: [3, 2, 2],
      status: 'published',
      createdAt: '2024-01-08',
      isPromoted: false,
      analytics: {
        views: 567,
        viewsThisMonth: 178
      }
    },
    {
      id: 4,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/15.jpg', 'Image']],
      category: 'For sale',
      title: 'Family House with Garden | 200 sq.m',
      location: '789 Oak St Brooklyn, NY 11201',
      price: '$650,000',
      badges: [['success', 'Verified']],
      amenities: [4, 3, 2],
      status: 'published',
      createdAt: '2024-01-05',
      isPromoted: false,
      analytics: {
        views: 834,
        viewsThisMonth: 145
      }
    },
    {
      id: 13,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/11.jpg', 'Image']],
      category: 'For rent',
      title: 'Riverside Studio | 45 sq.m',
      location: '123 Water St Manhattan, NY 10005',
      price: '$1,650',
      badges: [['success', 'Verified']],
      amenities: [1, 1, 0],
      status: 'published',
      createdAt: '2024-01-12',
      isPromoted: true,
      analytics: {
        views: 423,
        viewsThisMonth: 167
      }
    },
    {
      id: 16,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/13.jpg', 'Image']],
      category: 'For sale',
      title: 'Executive Condo | 130 sq.m',
      location: '555 Executive Plaza Manhattan, NY 10022',
      price: '$899,000',
      badges: [['success', 'Verified']],
      amenities: [3, 2, 2],
      status: 'published',
      createdAt: '2024-01-03',
      isPromoted: false,
      analytics: {
        views: 1445,
        viewsThisMonth: 298
      }
    },
    {
      id: 17,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/17.jpg', 'Image']],
      category: 'For rent',
      title: 'Art District Loft | 110 sq.m',
      location: '777 Creative Ave Brooklyn, NY 11201',
      price: '$2,800',
      badges: [['info', 'New']],
      amenities: [2, 2, 1],
      status: 'published',
      createdAt: '2024-01-01',
      isPromoted: true,
      analytics: {
        views: 698,
        viewsThisMonth: 201
      }
    },
    {
      id: 18,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/21.jpg', 'Image']],
      category: 'For sale',
      title: 'Suburban Dream House | 280 sq.m',
      location: '888 Dream Lane Queens, NY 11354',
      price: '$750,000',
      badges: [['warning', 'Featured']],
      amenities: [5, 3, 3],
      status: 'published',
      createdAt: '2023-12-28',
      isPromoted: false,
      analytics: {
        views: 1012,
        viewsThisMonth: 134
      }
    },
    {
      id: 19,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/23.jpg', 'Image']],
      category: 'For rent',
      title: 'City View Apartment | 75 sq.m',
      location: '999 High Rise Dr Manhattan, NY 10014',
      price: '$2,100',
      badges: [['success', 'Verified']],
      amenities: [2, 1, 1],
      status: 'published',
      createdAt: '2023-12-25',
      isPromoted: false,
      analytics: {
        views: 356,
        viewsThisMonth: 78
      }
    },
    {
      id: 20,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/09.jpg', 'Image']],
      category: 'For sale',
      title: 'Waterfront Villa | 220 sq.m',
      location: '1111 Beach Rd Staten Island, NY 10305',
      price: '$920,000',
      badges: [['warning', 'Featured']],
      amenities: [4, 3, 2],
      status: 'published',
      createdAt: '2023-12-20',
      isPromoted: true,
      analytics: {
        views: 2189,
        viewsThisMonth: 445
      }
    },
    {
      id: 21,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/12.jpg', 'Image']],
      category: 'For rent',
      title: 'Downtown Studio Plus | 55 sq.m',
      location: '2222 Urban St Manhattan, NY 10013',
      price: '$1,850',
      badges: [['info', 'New']],
      amenities: [1, 1, 0],
      status: 'published',
      createdAt: '2023-12-18',
      isPromoted: false,
      analytics: {
        views: 503,
        viewsThisMonth: 89
      }
    },
    {
      id: 22,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/16.jpg', 'Image']],
      category: 'For sale',
      title: 'Historic Mansion | 350 sq.m',
      location: '3333 Heritage Ave Brooklyn, NY 11215',
      price: '$1,200,000',
      badges: [['success', 'Verified']],
      amenities: [6, 4, 3],
      status: 'published',
      createdAt: '2023-12-15',
      isPromoted: true,
      analytics: {
        views: 3234,
        viewsThisMonth: 567
      }
    },
    // Draft Properties (15 properties) - some with analytics (previously published)
    {
      id: 5,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/12.jpg', 'Image']],
      category: 'For rent',
      title: 'Cozy Studio Apartment | 35 sq.m',
      location: '321 Broadway New York, NY 10007',
      price: '$1,200',
      badges: [],
      amenities: [1, 1, 0],
      status: 'draft',
      createdAt: '2024-01-20',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 6,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/18.jpg', 'Image']],
      category: 'For sale',
      title: 'Victorian House | 180 sq.m',
      location: '654 Elm St Queens, NY 11354',
      price: '$520,000',
      badges: [],
      amenities: [3, 2, 1],
      status: 'draft',
      createdAt: '2024-01-18',
      analytics: {
        views: 234,
        viewsThisMonth: 0 // Reset monthly views when moved to draft
      }
    },
    {
      id: 7,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/25.jpg', 'Image']],
      category: 'For rent',
      title: 'Loft Space | 120 sq.m',
      location: '987 Industrial Blvd Brooklyn, NY 11222',
      price: '$2,100',
      badges: [],
      amenities: [2, 1, 1],
      status: 'draft',
      createdAt: '2024-01-22',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 8,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/14.jpg', 'Image']],
      category: 'For sale',
      title: 'Waterfront Condo | 110 sq.m',
      location: '147 River Dr Manhattan, NY 10280',
      price: '$780,000',
      badges: [],
      amenities: [2, 2, 1],
      status: 'draft',
      createdAt: '2024-01-19',
      analytics: {
        views: 567,
        viewsThisMonth: 0 // Reset monthly views when moved to draft
      }
    },
    {
      id: 14,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/17.jpg', 'Image']],
      category: 'For rent',
      title: 'Garden Apartment | 80 sq.m',
      location: '456 Green Ave Brooklyn, NY 11238',
      price: '$1,950',
      badges: [],
      amenities: [2, 1, 1],
      status: 'draft',
      createdAt: '2024-01-21',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 23,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/19.jpg', 'Image']],
      category: 'For sale',
      title: 'Modern Townhouse | 160 sq.m',
      location: '4444 Modern Lane Bronx, NY 10458',
      price: '$680,000',
      badges: [],
      amenities: [3, 2, 2],
      status: 'draft',
      createdAt: '2024-01-17',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 24,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/20.jpg', 'Image']],
      category: 'For rent',
      title: 'Penthouse Suite | 200 sq.m',
      location: '5555 Sky Tower Manhattan, NY 10019',
      price: '$4,500',
      badges: [],
      amenities: [3, 3, 2],
      status: 'draft',
      createdAt: '2024-01-16',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 25,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/24.jpg', 'Image']],
      category: 'For sale',
      title: 'Country Estate | 400 sq.m',
      location: '6666 Country Rd Staten Island, NY 10307',
      price: '$1,500,000',
      badges: [],
      amenities: [7, 5, 4],
      status: 'draft',
      createdAt: '2024-01-14',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 26,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/08.jpg', 'Image']],
      category: 'For rent',
      title: 'Designer Apartment | 90 sq.m',
      location: '7777 Design St Brooklyn, NY 11201',
      price: '$2,600',
      badges: [],
      amenities: [2, 2, 1],
      status: 'draft',
      createdAt: '2024-01-13',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 27,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/10.jpg', 'Image']],
      category: 'For sale',
      title: 'Investment Property | 140 sq.m',
      location: '8888 Investment Ave Queens, NY 11375',
      price: '$590,000',
      badges: [],
      amenities: [3, 2, 1],
      status: 'draft',
      createdAt: '2024-01-11',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 28,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/15.jpg', 'Image']],
      category: 'For rent',
      title: 'Luxury Flat | 95 sq.m',
      location: '9999 Luxury Blvd Manhattan, NY 10021',
      price: '$3,200',
      badges: [],
      amenities: [2, 2, 1],
      status: 'draft',
      createdAt: '2024-01-09',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 29,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/22.jpg', 'Image']],
      category: 'For sale',
      title: 'Duplex Unit | 170 sq.m',
      location: '1010 Duplex Dr Bronx, NY 10462',
      price: '$720,000',
      badges: [],
      amenities: [4, 3, 2],
      status: 'draft',
      createdAt: '2024-01-07',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 30,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/11.jpg', 'Image']],
      category: 'For rent',
      title: 'Urban Loft | 85 sq.m',
      location: '1212 Urban Plaza Brooklyn, NY 11238',
      price: '$2,300',
      badges: [],
      amenities: [2, 1, 1],
      status: 'draft',
      createdAt: '2024-01-06',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 31,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/13.jpg', 'Image']],
      category: 'For sale',
      title: 'Smart Home | 190 sq.m',
      location: '1313 Tech Ave Queens, NY 11354',
      price: '$820,000',
      badges: [],
      amenities: [4, 3, 2],
      status: 'draft',
      createdAt: '2024-01-04',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    {
      id: 32,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/25.jpg', 'Image']],
      category: 'For rent',
      title: 'Minimalist Studio | 40 sq.m',
      location: '1414 Minimal St Manhattan, NY 10003',
      price: '$1,400',
      badges: [],
      amenities: [1, 1, 0],
      status: 'draft',
      createdAt: '2024-01-02',
      analytics: {
        views: 0,
        viewsThisMonth: 0
      }
    },
    // Archived Properties (18 properties) - historical analytics
    {
      id: 9,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/20.jpg', 'Image']],
      category: 'For rent',
      title: 'Old Town Apartment | 75 sq.m',
      location: '258 Heritage St Staten Island, NY 10301',
      price: '$1,800',
      badges: [],
      amenities: [2, 1, 1],
      status: 'archived',
      createdAt: '2023-12-15',
      archivedAt: '2024-01-10',
      analytics: {
        views: 456,
        viewsThisMonth: 0
      }
    },
    {
      id: 10,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/16.jpg', 'Image']],
      category: 'For sale',
      title: 'Suburban Villa | 250 sq.m',
      location: '369 Maple Ave Bronx, NY 10470',
      price: '$890,000',
      badges: [],
      amenities: [5, 3, 2],
      status: 'archived',
      createdAt: '2023-12-10',
      archivedAt: '2024-01-05',
      analytics: {
        views: 823,
        viewsThisMonth: 0
      }
    },
    {
      id: 11,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/24.jpg', 'Image']],
      category: 'For rent',
      title: 'High-rise Unit | 90 sq.m',
      location: '741 Sky Tower Dr Queens, NY 11375',
      price: '$2,200',
      badges: [],
      amenities: [2, 2, 1],
      status: 'archived',
      createdAt: '2023-11-28',
      archivedAt: '2023-12-28',
      analytics: {
        views: 698,
        viewsThisMonth: 0
      }
    },
    {
      id: 12,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/19.jpg', 'Image']],
      category: 'For sale',
      title: 'Historic Brownstone | 160 sq.m',
      location: '852 Classic St Brooklyn, NY 11215',
      price: '$725,000',
      badges: [],
      amenities: [3, 2, 0],
      status: 'archived',
      createdAt: '2023-11-20',
      archivedAt: '2023-12-20',
      analytics: {
        views: 1025,
        viewsThisMonth: 0
      }
    },
    {
      id: 15,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/13.jpg', 'Image']],
      category: 'For sale',
      title: 'Corner Townhouse | 190 sq.m',
      location: '789 Corner St Queens, NY 11411',
      price: '$599,000',
      badges: [],
      amenities: [3, 2, 2],
      status: 'archived',
      createdAt: '2023-11-15',
      archivedAt: '2023-12-15',
      analytics: {
        views: 367,
        viewsThisMonth: 0
      }
    },
    // Adding more archived properties with analytics to reach 18
    {
      id: 33,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/14.jpg', 'Image']],
      category: 'For rent',
      title: 'Archived Studio | 30 sq.m',
      location: '1515 Archive St Manhattan, NY 10001',
      price: '$1,100',
      badges: [],
      amenities: [1, 1, 0],
      status: 'archived',
      createdAt: '2023-11-10',
      archivedAt: '2023-12-10',
      analytics: {
        views: 189,
        viewsThisMonth: 0
      }
    },
    {
      id: 34,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/18.jpg', 'Image']],
      category: 'For sale',
      title: 'Removed Villa | 300 sq.m',
      location: '1616 Removed Rd Brooklyn, NY 11201',
      price: '$950,000',
      badges: [],
      amenities: [6, 4, 3],
      status: 'archived',
      createdAt: '2023-11-05',
      archivedAt: '2023-12-05',
      analytics: {
        views: 1245,
        viewsThisMonth: 0
      }
    },
    {
      id: 35,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/21.jpg', 'Image']],
      category: 'For rent',
      title: 'Deleted Loft | 100 sq.m',
      location: '1717 Delete Ave Queens, NY 11354',
      price: '$2,400',
      badges: [],
      amenities: [2, 2, 1],
      status: 'archived',
      createdAt: '2023-10-30',
      archivedAt: '2023-11-30',
      analytics: {
        views: 534,
        viewsThisMonth: 0
      }
    },
    {
      id: 36,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/23.jpg', 'Image']],
      category: 'For sale',
      title: 'Expired Condo | 120 sq.m',
      location: '1818 Expire St Bronx, NY 10458',
      price: '$620,000',
      badges: [],
      amenities: [3, 2, 1],
      status: 'archived',
      createdAt: '2023-10-25',
      archivedAt: '2023-11-25',
      analytics: {
        views: 478,
        viewsThisMonth: 0
      }
    },
    {
      id: 37,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/09.jpg', 'Image']],
      category: 'For rent',
      title: 'Withdrawn Apartment | 70 sq.m',
      location: '1919 Withdraw Blvd Manhattan, NY 10014',
      price: '$1,900',
      badges: [],
      amenities: [2, 1, 1],
      status: 'archived',
      createdAt: '2023-10-20',
      archivedAt: '2023-11-20',
      analytics: {
        views: 323,
        viewsThisMonth: 0
      }
    },
    {
      id: 38,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/12.jpg', 'Image']],
      category: 'For sale',
      title: 'Cancelled House | 210 sq.m',
      location: '2020 Cancel Lane Staten Island, NY 10305',
      price: '$780,000',
      badges: [],
      amenities: [4, 3, 2],
      status: 'archived',
      createdAt: '2023-10-15',
      archivedAt: '2023-11-15',
      analytics: {
        views: 689,
        viewsThisMonth: 0
      }
    },
    {
      id: 39,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/17.jpg', 'Image']],
      category: 'For rent',
      title: 'Inactive Flat | 65 sq.m',
      location: '2121 Inactive Ave Brooklyn, NY 11238',
      price: '$1,750',
      badges: [],
      amenities: [2, 1, 0],
      status: 'archived',
      createdAt: '2023-10-10',
      archivedAt: '2023-11-10',
      analytics: {
        views: 256,
        viewsThisMonth: 0
      }
    },
    {
      id: 40,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/25.jpg', 'Image']],
      category: 'For sale',
      title: 'Discontinued Property | 180 sq.m',
      location: '2222 Discontinued Dr Queens, NY 11375',
      price: '$670,000',
      badges: [],
      amenities: [3, 2, 2],
      status: 'archived',
      createdAt: '2023-10-05',
      archivedAt: '2023-11-05',
      analytics: {
        views: 401,
        viewsThisMonth: 0
      }
    },
    {
      id: 41,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/15.jpg', 'Image']],
      category: 'For rent',
      title: 'Suspended Rental | 85 sq.m',
      location: '2323 Suspend St Bronx, NY 10462',
      price: '$2,050',
      badges: [],
      amenities: [2, 2, 1],
      status: 'archived',
      createdAt: '2023-09-30',
      archivedAt: '2023-10-30',
      analytics: {
        views: 367,
        viewsThisMonth: 0
      }
    },
    {
      id: 42,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/11.jpg', 'Image']],
      category: 'For sale',
      title: 'Terminated Sale | 150 sq.m',
      location: '2424 Terminate Ave Manhattan, NY 10019',
      price: '$740,000',
      badges: [],
      amenities: [3, 2, 1],
      status: 'archived',
      createdAt: '2023-09-25',
      archivedAt: '2023-10-25',
      analytics: {
        views: 634,
        viewsThisMonth: 0
      }
    },
    {
      id: 43,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/22.jpg', 'Image']],
      category: 'For rent',
      title: 'Closed Listing | 95 sq.m',
      location: '2525 Close Rd Brooklyn, NY 11215',
      price: '$2,300',
      badges: [],
      amenities: [2, 2, 1],
      status: 'archived',
      createdAt: '2023-09-20',
      archivedAt: '2023-10-20',
      analytics: {
        views: 445,
        viewsThisMonth: 0
      }
    },
    {
      id: 44,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/16.jpg', 'Image']],
      category: 'For sale',
      title: 'Paused Property | 220 sq.m',
      location: '2626 Pause Blvd Queens, NY 11354',
      price: '$850,000',
      badges: [],
      amenities: [4, 3, 2],
      status: 'archived',
      createdAt: '2023-09-15',
      archivedAt: '2023-10-15',
      analytics: {
        views: 798,
        viewsThisMonth: 0
      }
    },
    {
      id: 45,
      href: '/real-estate/single-v1',
      images: [['/images/real-estate/catalog/20.jpg', 'Image']],
      category: 'For rent',
      title: 'Halted Apartment | 75 sq.m',
      location: '2727 Halt St Staten Island, NY 10307',
      price: '$1,850',
      badges: [],
      amenities: [2, 1, 1],
      status: 'archived',
      createdAt: '2023-09-10',
      archivedAt: '2023-10-10',
      analytics: {
        views: 312,
        viewsThisMonth: 0
      }
    }
  ]

  const [properties, setProperties] = useState(initialProperties)
  const [activeTab, setActiveTab] = useState('draft') // Default to draft tab
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState(null)
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [bulkActionType, setBulkActionType] = useState('') // 'archive' or 'delete'
  const propertiesPerPage = 6

  // Filter and sort properties
  const processedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesTab = property.status === activeTab
      const matchesSearch = searchTerm === '' ||
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesTab && matchesSearch
    })

    // Sort properties
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

  // Calculate total analytics for the current tab
  const getTabAnalytics = () => {
    const tabProperties = properties.filter(p => p.status === activeTab)
    const totalViews = tabProperties.reduce((sum, prop) => sum + (prop.analytics?.views || 0), 0)
    const totalViewsThisMonth = tabProperties.reduce((sum, prop) => sum + (prop.analytics?.viewsThisMonth || 0), 0)
    return { totalViews, totalViewsThisMonth }
  }

  // Reset pagination when changing tabs or search
  const handleTabChange = (selectedKey) => {
    setActiveTab(selectedKey)
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (sortValue) => {
    setSortBy(sortValue)
    setCurrentPage(1)
  }

  // Get count for each tab
  const getCounts = () => {
    return {
      published: properties.filter(p => p.status === 'published').length,
      draft: properties.filter(p => p.status === 'draft').length,
      archived: properties.filter(p => p.status === 'archived').length
    }
  }

  const counts = getCounts()
  const tabAnalytics = getTabAnalytics()

  // Get tab-specific description
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

  // Delete modal functions
  const handleDeleteClick = (property) => {
    setPropertyToDelete(property)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      if (propertyToDelete.status === 'draft') {
        // Move to archived
        changePropertyStatus(propertyToDelete.id, 'archived')
      } else if (propertyToDelete.status === 'archived') {
        // Permanent deletion
        setProperties(properties.filter(property => property.id !== propertyToDelete.id))
      }
    }
    setShowDeleteModal(false)
    setPropertyToDelete(null)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setPropertyToDelete(null)
  }

  // Bulk action modal functions
  const handleBulkActionClick = (actionType) => {
    setBulkActionType(actionType)
    setShowBulkActionModal(true)
  }

  const handleConfirmBulkAction = () => {
    let newProperties = [...properties]

    if (bulkActionType === 'archive') {
      // Archive all drafts
      newProperties = properties.map(property =>
          property.status === 'draft'
              ? { ...property, status: 'archived', archivedAt: new Date().toISOString().split('T')[0] }
              : property
      )
    } else if (bulkActionType === 'delete') {
      // Delete all archived
      newProperties = properties.filter(property => property.status !== 'archived')
    }

    setProperties(newProperties)
    setShowBulkActionModal(false)
    setBulkActionType('')
  }

  const handleCancelBulkAction = () => {
    setShowBulkActionModal(false)
    setBulkActionType('')
  }

  // Tab-specific delete all function
  const deleteAll = (e) => {
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
  }

  // Function to change property status with analytics handling
  const changePropertyStatus = (propertyId, newStatus) => {
    setProperties(properties.map(property => {
      if (property.id === propertyId) {
        let updatedProperty = {
          ...property,
          status: newStatus,
          ...(newStatus === 'archived' && { archivedAt: new Date().toISOString().split('T')[0] })
        }

        // Handle analytics based on status change
        if (newStatus === 'published') {
          // When publishing, start fresh monthly views but keep total views
          updatedProperty.analytics = {
            ...property.analytics,
            viewsThisMonth: 0 // Reset monthly counter when republishing
          }
        } else if (newStatus === 'draft') {
          // When moving to draft, reset monthly views to 0
          updatedProperty.analytics = {
            ...property.analytics,
            viewsThisMonth: 0
          }
        }

        return updatedProperty
      }
      return property
    }))
  }

  // Function to promote property
  const promoteProperty = (propertyId) => {
    setProperties(properties.map(property =>
        property.id === propertyId
            ? { ...property, isPromoted: !property.isPromoted }
            : property
    ))
  }

  // Function to restore from archived
  const restoreProperty = (propertyId) => {
    changePropertyStatus(propertyId, 'draft')
  }

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  // Format date for display with human readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Analytics card component with improved mobile layout
  const AnalyticsCard = ({ property }) => {
    const { analytics, createdAt, status } = property

    // Show analytics card for all published and archived properties, and drafts with views
    const shouldShowAnalytics = status === 'published' || status === 'archived' || (status === 'draft' && analytics.views > 0)

    if (!shouldShowAnalytics) {
      return null
    }

    const hasViews = analytics.views > 0
    const hasMonthlyViews = status === 'published' && analytics.viewsThisMonth > 0

    return (
        <div className='card border-0 bg-light mt-2' style={{ borderRadius: '0px !important' }}>
          <div className='card-body py-2 px-3'>
            <div className='d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between'>
              {/* Created date */}
              <div className='d-flex align-items-center text-muted small mb-2 mb-md-0'>
                <i className='fi-calendar me-2 opacity-60'></i>
                <span className='fw-medium'>Created: {formatDate(createdAt)}</span>
              </div>

              {/* Analytics info - always show for published, even if 0 views */}
              <div className='d-flex align-items-center flex-wrap gap-3'>
                {/* Always show views for published properties, even if 0 */}
                {status === 'published' && (
                    <div className='d-flex align-items-center text-muted small'>
                      <i className='fi-eye me-2 opacity-60'></i>
                      <span className='fw-medium'>{formatNumber(analytics.views)} views</span>
                    </div>
                )}

                {/* Show views for archived/draft only if > 0 */}
                {(status === 'archived' || status === 'draft') && hasViews && (
                    <div className='d-flex align-items-center text-muted small'>
                      <i className='fi-eye me-2 opacity-60'></i>
                      <span className='fw-medium'>{formatNumber(analytics.views)} views</span>
                    </div>
                )}

                {/* Monthly views only for published properties with monthly views */}
                {hasMonthlyViews && (
                    <div className='d-flex align-items-center text-success small'>
                      <i className='fi-trending-up me-2'></i>
                      <span className='fw-medium'>{formatNumber(analytics.viewsThisMonth)}+ this month</span>
                    </div>
                )}
              </div>
            </div>
          </div>
          <style jsx>{`
            .card {
              border-radius: 0 !important;
            }
            .card-body {
              border-radius: 0 !important;
            }
            @media (max-width: 767.98px) {
              .card-body {
                padding: 0.75rem 1rem;
              }
              .small {
                font-size: 0.8125rem;
              }
            }
          `}</style>
        </div>
    )
  }

  return (
      <RealEstatePageLayout
          pageTitle='Account My Properties'
          activeNav='Account'
          userLoggedIn
      >
        <RealEstateAccountLayout accountPageTitle='My Properties'>
          <div className='d-flex align-items-center justify-content-between mb-3'>
            <h1 className='h2 mb-0'>My Properties</h1>
            {processedProperties.length > 0 && activeTab !== 'published' && (
                <a href='#' className='fw-bold text-decoration-none' onClick={deleteAll}>
                  <i className='fi-trash mt-n1 me-2'></i>
                  {activeTab === 'draft' ? 'Archive all' : 'Delete all'}
                </a>
            )}
          </div>

          {/* Dynamic tab description */}
          <p className='pt-1 mb-4 text-muted'>
            {getTabDescription(activeTab)}
          </p>

          <Nav
              variant='tabs'
              activeKey={activeTab}
              onSelect={handleTabChange}
              className='border-bottom mb-4'
          >
            <Nav.Item>
              <Nav.Link eventKey='draft' className=''>
                <i className='fi-file-clean fs-base me-2'></i>
                Drafts
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey='published' className='px-3 py-2'>
                <i className='fi-file fs-base me-2'></i>
                Published
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className='mb-3'>
              <Nav.Link eventKey='archived' className=''>
                <i className='fi-archive fs-base me-2'></i>
                Archived
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Search and Filter Controls with Analytics */}
          <Row className='mb-4'>
            <Col md={6} lg={5}>
              <Form.Control
                  type='text'
                  placeholder={`Search ${activeTab} properties...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className='mb-3'
              />
            </Col>
            <Col md={6} lg={4}>
              <Form.Select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className='mb-3'
              >
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
            <Col lg={3}>
              {/* Count and Analytics integrated into results section */}
              <div className='text-muted mb-2'>
                <div className='d-flex align-items-center mb-1'>
                  <i className={`fi-${activeTab === 'published' ? 'file' : activeTab === 'draft' ? 'file-clean' : 'archive'} me-2 text-primary`}></i>
                  <strong>{counts[activeTab === 'draft' ? 'draft' : activeTab]} {activeTab} {counts[activeTab === 'draft' ? 'draft' : activeTab] === 1 ? 'property' : 'properties'}</strong>
                </div>
                {(activeTab === 'published' || activeTab === 'archived') && tabAnalytics.totalViews > 0 && (
                    <div className='small d-flex flex-wrap gap-3'>
                  <span>
                    <i className='fi-eye-on me-1 text-muted'></i>
                    {formatNumber(tabAnalytics.totalViews)} total views
                  </span>
                    </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Results info */}
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

          {/* List of properties or empty state */}
          {paginatedProperties.length ? paginatedProperties.map((property, indx) => (
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

                {/* Add spacing between icons and numbers in PropertyCard footer */}
                <style jsx global>{`
                  .property-card .card-footer .d-flex i {
                    margin-right: 0.375rem !important;
                  }
                  .property-card .card-footer .text-muted {
                    margin-right: 1rem;
                  }
                  .property-card .card-footer .text-muted:last-child {
                    margin-right: 0;
                  }
                `}</style>
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

          {/* Pagination */}
          {totalPages > 1 && (
              <div className='d-flex justify-content-center mt-5'>
                <Pagination>
                  <Pagination.First
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                  />
                  <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                  />
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                          <Pagination.Item
                              key={page}
                              active={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Pagination.Item>
                      )
                    } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                    ) {
                      return <Pagination.Ellipsis key={page} />
                    }
                    return null
                  })}
                  <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                  />
                  <Pagination.Last
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                  />
                </Pagination>
              </div>
          )}

          {/* Individual Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className='fi-alert-triangle text-warning me-2'></i>
                Confirm Action
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {propertyToDelete && (
                  <div>
                    {propertyToDelete.status === 'draft' ? (
                        <p>Are you sure you want to archive this property? You can restore it later from the archived tab.</p>
                    ) : (
                        <p>Are you sure you want to permanently delete this property? This action cannot be undone.</p>
                    )}
                  </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' onClick={handleCancelDelete}>
                Cancel
              </Button>
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
              <Button variant='secondary' onClick={handleCancelBulkAction}>
                Cancel
              </Button>
              <Button
                  variant={bulkActionType === 'archive' ? 'primary' : 'danger'}
                  onClick={handleConfirmBulkAction}
              >
                {bulkActionType === 'archive' ? `Archive ${counts.draft} Properties` : `Delete ${counts.archived} Properties`}
              </Button>
            </Modal.Footer>
          </Modal>
        </RealEstateAccountLayout>
      </RealEstatePageLayout>
  )
}

// Helper function for empty state messages
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

// Helper function to get dropdown options
const getDropdownOptions = (property, activeTab, changePropertyStatus, handleDeleteClick, promoteProperty, restoreProperty) => {
  const options = []

  // Edit option (available for all except archived)
  if (activeTab !== 'archived') {
    options.push({
      icon: 'fi-edit',
      label: 'Edit',
      props: {onClick: () => console.log('Edit property', property.id)}
    })
  }

  // Tab-specific options
  if (activeTab === 'published') {
    options.push(
        {
          icon: property.isPromoted ? 'fi-star-filled' : 'fi-flame',
          label: property.isPromoted ? 'Remove Promotion' : 'Promote Property',
          props: {onClick: () => promoteProperty(property.id)}
        },
        {
          icon: 'fi-power',
          label: 'Deactivate',
          props: {onClick: () => changePropertyStatus(property.id, 'draft')}
        }
    )
  } else if (activeTab === 'draft') {
    options.push(
        {
          icon: 'fi-check',
          label: 'Publish',
          props: {onClick: () => changePropertyStatus(property.id, 'published')}
        },
        {
          icon: 'fi-archive',
          label: 'Archive',
          props: {onClick: () => changePropertyStatus(property.id, 'archived')}
        },
        {
          icon: 'fi-trash',
          label: 'Delete',
          props: {onClick: () => handleDeleteClick(property)}
        }
    )
  } else if (activeTab === 'archived') {
    options.push(
        {
          icon: 'fi-refresh-cw',
          label: 'Restore to Draft',
          props: {onClick: () => restoreProperty(property.id)}
        },
        {
          icon: 'fi-trash',
          label: 'Delete Permanently',
          props: {onClick: () => handleDeleteClick(property)}
        }
    )
  }

  return options
}

export default AccountPropertiesPage