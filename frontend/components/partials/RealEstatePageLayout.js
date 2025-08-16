import {useCallback, useEffect, useState} from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import Dropdown from 'react-bootstrap/Dropdown'
import Button from 'react-bootstrap/Button'
import ImageLoader from '../ImageLoader'
import StickyNavbar from '../StickyNavbar'
import StarRating from '../StarRating'
import SocialButton from '../SocialButton'
import MarketButton from '../MarketButton'
import SignInModalLight from '../partials/SignInModalLight'
import SignUpModalLight from '../partials/SignUpModalLight'
import Card from "react-bootstrap/Card"
import {useRouter} from "next/router"
import { useAuth } from "../../hooks/useAuth"
import {useClerk} from "@clerk/nextjs";
import SignOutToast from "../SignOutToast";

const RealEstatePageLayout = (props) => {
  const { signOut } = useAuth();
  const router = useRouter();
  const { signOut: clerkSignOut } = useClerk();
  const [showSignOutToast, setShowSignOutToast] = useState(false);


  // Sign in modal
  const [signinShow, setSigninShow] = useState(false)
  const handleSigninClose = () => setSigninShow(false)
  const handleSigninShow = () =>  {
    sessionStorage.setItem('preAuthPage', router.asPath);
    setSigninShow(true)
  }

  // Sign up modal
  const [signupShow, setSignupShow] = useState(false)
  const handleSignupClose = () => setSignupShow(false)

  // Swap modals
  const handleSignInToUp = (e) => {
    e.preventDefault()
    setSigninShow(false)
    setSignupShow(true)
  }

  const handleSignUpToIn = (e) => {
    e.preventDefault()
    setSigninShow(true)
    setSignupShow(false)
  }

  const handleSignOut = useCallback(async (e) => {
    e.preventDefault();

    const protectedPaths = ['/real-estate/add-property', '/real-estate/account-', '/agent/'];
    const shouldRedirectToHome = protectedPaths.some(path => router.asPath.includes(path));

    const redirectUrl = shouldRedirectToHome
        ? `${window.location.origin}/real-estate`
        : `${window.location.origin}${router.asPath}`;

    try {
      // Set flag for success toast before redirect
      sessionStorage.setItem('showSignOutToast', 'true');

      await signOut({ redirectUrl });

      // Clean up
      sessionStorage.removeItem('preAuthPage');

    } catch (error) {
      console.error('Signout error:', error);
      sessionStorage.removeItem('showSignOutToast');
      window.location.href = '/real-estate';
    }
  }, [signOut, router]);

  useEffect(() => {
    const shouldShowToast = sessionStorage.getItem('showSignOutToast');
    if (shouldShowToast && !props.userLoggedIn) {
      sessionStorage.removeItem('showSignOutToast');
      setShowSignOutToast(true);
    }
  }, [props.userLoggedIn]);

  // Helper function to check if user can add properties
  const canAddProperties = useCallback((user) => {
    if (!user) return false;
    return user.accountType && user.accountType !== 'individual';
  }, []);

  // Handle Add Property button click
  const handleAddPropertyClick = useCallback((e) => {
    if (!props.userLoggedIn) {
      e.preventDefault()
      sessionStorage.setItem('preAuthPage', router.asPath);
      // router.push('/real-estate');
      handleSigninShow()
      return;
    }

    // If user is logged in but can't add properties (individual account)
    if (props.userLoggedIn && props.user && !canAddProperties(props.user)) {
      e.preventDefault()
      // Trigger toast by adding query parameters to current URL without navigation
      const currentUrl = router.asPath;
      const separator = currentUrl.includes('?') ? '&' : '?';
      const newUrl = `${currentUrl}${separator}upgrade=required&reason=add-property`;

      // Update URL without navigation to trigger toast
      router.replace(newUrl, newUrl, { shallow: true, scroll: false });
      return;
    }

    // If user can add properties, allow normal navigation (Link component will handle this)
  }, [props.userLoggedIn, props.user, canAddProperties, router]);

  return (
      <>
        <Head>
          <title>{`HomeFinder`}</title>
        </Head>

        {/* Sign in modal */}
        {!props.userLoggedIn && <SignInModalLight
            centered
            size='lg'
            show={signinShow}
            onHide={handleSigninClose}
            onSwap={handleSignInToUp}
        />}

        {/* Sign up modal */}
        {!props.userLoggedIn && <SignUpModalLight
            centered
            size='lg'
            show={signupShow}
            onHide={handleSignupClose}
            onSwap={handleSignUpToIn}
        />}

        {/* SignOut Toast */}
        <SignOutToast
            show={showSignOutToast}
            onClose={() => setShowSignOutToast(false)}
        />

        {/* Page wrapper for sticky footer
      Wraps everything except footer to push footer to the bottom of the page if there is little content */}
        <main className='page-wrapper'>
          {/* Navbar (main site header with branding and navigation) */}
          <Navbar as={StickyNavbar}
                  expand='lg'
                  bg='light'
                  className={`fixed-top${props.navbarExtraClass ? ` ${props.navbarExtraClass}` : ''}`}
          >
            <Container>
              <Navbar.Brand as={Link} href='/real-estate' className='me-3 me-xl-4'>
                {/*<ImageLoader priority src='/images/logo/logo-dark.svg' width={116} height={32} placeholder={false} alt='Finder' />*/}
                HomeFinder
              </Navbar.Brand>
              <Navbar.Toggle aria-controls='navbarNav' className='ms-auto' />

              {/* Display content depending on user auth status */}
              {props.userLoggedIn ? <Dropdown className='d-none d-lg-block order-lg-3 my-n2 me-3'>
                    <Dropdown.Toggle as={Link} href='/real-estate/account-info' className='nav-link dropdown-toggle-flush d-flex py-1 px-0' style={{width: '40px'}}>
                      <ImageLoader src='/images/avatars/30.jpg' width={80} height={80} placeholder={false} className='rounded-circle' alt='Annette Black' />
                    </Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount align='end'>
                      <div className='d-flex align-items-start border-bottom px-3 py-1 mb-2' style={{width: '16rem'}}>
                        <ImageLoader src='/images/avatars/03.jpg' width={48} height={48} placeholder={false} className='rounded-circle' alt='Annette Black' />
                        <div className='ps-2'>
                          <h6 className='fs-base mb-0'>Annette Black</h6>
                          <StarRating size='sm' rating={5} />
                          <div className='fs-xs py-2'>
                            (302) 555-0107<br/>annette_black@email.com
                          </div>
                        </div>
                      </div>
                      <Dropdown.Item as={Link} href='/real-estate/account-info'>
                        <i className='fi-lock opacity-60 me-2'></i>
                        Personal Info
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-security'>
                        <i className='fi-heart opacity-60 me-2'></i>
                        Password &amp; Security
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-properties'>
                        <i className='fi-home opacity-60 me-2'></i>
                        My Properties
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-wishlist'>
                        <i className='fi-heart opacity-60 me-2'></i>
                        Wishlist
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-reviews'>
                        <i className='fi-star opacity-60 me-2'></i>
                        Reviews
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-notifications'>
                        <i className='fi-bell opacity-60 me-2'></i>
                        Notifications
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} href='/real-estate/help-center'>Help</Dropdown.Item>
                      <Dropdown.Item onClick={handleSignOut}>
                        <i className='fi-power opacity-60 me-2'></i>
                        Sign Out
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown> :
                  <Button variant='sm text-primary d-none d-lg-block order-lg-3' onClick={handleSigninShow}>
                    <i className='fi-user me-2'></i>
                    Sign in
                  </Button>
              }

              {/* Updated Add Property Button */}
              {props.userLoggedIn ? (
                  <>
                    {canAddProperties(props.user) ? (
                        <Button as={Link} href='/real-estate/add-property' size='sm' className='order-lg-3 ms-2'>
                          <i className='fi-plus me-2'></i>
                          Add <span className='d-none d-sm-inline'>property</span>
                        </Button>
                    ) : (
                        <Button size='sm' className='order-lg-3 ms-2' onClick={handleAddPropertyClick}>
                          <i className='fi-plus me-2'></i>
                          Add <span className='d-none d-sm-inline'>property</span>
                        </Button>
                    )}
                  </>
              ) : (
                  <Button size='sm' className='order-lg-3 ms-2' onClick={handleAddPropertyClick}>
                    <i className='fi-plus me-2'></i>
                    Add <span className='d-none d-sm-inline'>property</span>
                  </Button>
              )}

              <Navbar.Collapse id='navbarNav' className='order-md-2'>
                <Nav navbarScroll style={{maxHeight: '35rem'}}>
                  <Nav.Item as={Dropdown} className='me-lg-2'>
                    <Dropdown.Toggle as={Nav.Link} className='align-items-center pe-lg-4'>
                      <i className='fi-layers me-2'></i>
                      Services
                      <span className='d-none d-lg-block position-absolute top-50 end-0 translate-middle-y border-end' style={{width: '1px', height: '30px'}}></span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount>
                      <Dropdown.Item as={Link} href='/real-estate'>
                        <i className='fi-home fs-base opacity-50 me-2'></i>
                        Home Decorations
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} href='/car-finder'>
                        <i className='fi-camera-plus fs-base opacity-50 me-2'></i>
                        Property Visuals
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} href='/job-board'>
                        <i className='fi-briefcase fs-base opacity-50 me-2'></i>
                        Property Auctions
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} href='/city-guide'>
                        <i className='fi-map-pin fs-base opacity-50 me-2'></i>
                        Co-Living
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Nav.Item>
                  {/*<Nav.Item >*/}
                  {/*  <Nav.Link as={Link} href='/real-estate'>Home</Nav.Link>*/}
                  {/*</Nav.Item>*/}
                  <Nav.Item as={Dropdown}>
                    <Dropdown.Toggle as={Nav.Link} active={props.activeNav==='Pages'}>Home</Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount>
                      <Dropdown.Item as={Link} href='/real-estate/about'>About</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/contacts'>Contacts</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/help-center'>Help Center</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/404-not-found'>404 Not Found</Dropdown.Item>
                    </Dropdown.Menu>
                  </Nav.Item>
                  <Nav.Item as={Dropdown}>
                    <Dropdown.Toggle as={Nav.Link} active={props.activeNav==='Catalog'}>Properties</Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount>
                      <Dropdown.Item as={Link} href='/real-estate/catalog?category=rent'>For Rent</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/catalog?category=sale'>For Sale</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/single-v1'>For Shortlet</Dropdown.Item>
                    </Dropdown.Menu>
                  </Nav.Item>
                  <Nav.Item as={Dropdown}>
                    <Dropdown.Toggle as={Nav.Link} active={props.activeNav==='Vendor'}>Professionals</Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount>
                      <Dropdown.Item as={Link} href='/real-estate/property-promotion'>Property Developers</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/vendor-properties'>Property Lawyers</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/vendor-reviews'>Property Managers</Dropdown.Item>
                    </Dropdown.Menu>
                  </Nav.Item>
                  <Nav.Item as={Dropdown}>
                    <Dropdown.Toggle as={Nav.Link} active={props.activeNav==='Account'}>Estate Agents</Dropdown.Toggle>
                    <Dropdown.Menu renderOnMount>
                      <Dropdown.Item as={Link} href='/real-estate/account-info'>Personal Info</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-security'>Password &amp; Security</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-properties'>My Properties</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-wishlist'>Wishlist</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-reviews'>Reviews</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/real-estate/account-notifications'>Notifications</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/signin-light'>Sign In</Dropdown.Item>
                      <Dropdown.Item as={Link} href='/signup-light'>Sign Up</Dropdown.Item>
                    </Dropdown.Menu>
                  </Nav.Item>

                  {/* Display content depending on user auth status */}
                  {props.userLoggedIn ?<Nav.Item as={Dropdown} className='d-lg-none'>
                        <Dropdown.Toggle as={Nav.Link} className='d-flex align-items-center'>
                          <ImageLoader src='/images/avatars/30.jpg' width={30} height={30} placeholder={false} className='rounded-circle' alt='Annette Black' />
                          <span className='ms-2'>Annette Black</span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <div className='ps-3'>
                            <StarRating size='sm' rating={5} />
                            <div className='fs-xs py-2'>
                              (302) 555-0107<br/>annette_black@email.com
                            </div>
                          </div>
                          <Dropdown.Item as={Link} href='/real-estate/account-info'>
                            <i className='fi-user opacity-60 me-2'></i>
                            Personal Info
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} href='/real-estate/account-security'>
                            <i className='fi-heart opacity-60 me-2'></i>
                            Password &amp; Security
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} href='/real-estate/account-properties'>
                            <i className='fi-home opacity-60 me-2'></i>
                            My Properties
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} href='/real-estate/account-wishlist'>
                            <i className='fi-heart opacity-60 me-2'></i>
                            Wishlist
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} href='/real-estate/account-reviews'>
                            <i className='fi-star opacity-60 me-2'></i>
                            Reviews
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} href='/real-estate/account-notifications'>
                            <i className='fi-bell opacity-60 me-2'></i>
                            Notifications
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item as={Link} href='/real-estate/help-center'>Help</Dropdown.Item>
                          <Dropdown.Item onClick={handleSignOut}>
                            <i className='fi-power opacity-60 me-2'></i>
                            Sign Out
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Nav.Item> :
                      <Nav.Item className='d-lg-none'>
                        <Nav.Link onClick={handleSigninShow}>
                          <i className='fi-user me-2'></i>
                          Sign in
                        </Nav.Link>
                      </Nav.Item>}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          {/* Page content */}
          {props.children}
        </main>

        {/* Footer */}
        <footer className='footer bg-dark pt-5'>
          <Container className='pb-2'>
            <Row className='align-items-center pb-4'>
              <Col md={6} xl={5}>
                {/* Links */}
                <Row xs={1} sm={3} className='gy-4'>
                  <Col>
                    <h3 className='h6 mb-1 pb-1 fs-base text-light'>
                      <Link href='/real-estate' className=' ' style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem'}}>
                        HomeFinder
                      </Link>
                    </h3>
                    <ul className='list-unstyled fs-sm'>
                      <li><Link href='#' className='nav-link-light'>About us</Link></li>
                      <li><Link href='#' className='nav-link-light'>News</Link></li>
                      <li><Link href='#' className='nav-link-light'>Contacts</Link></li>
                    </ul>
                  </Col>
                  <Col>
                    <h3 className='h6 mb-2 pb-1 fs-base text-light'>Quick Links</h3>
                    <ul className='list-unstyled fs-sm'>
                      <li><Link href='#' className='nav-link-light'>Find properties</Link></li>
                      <li><Link href='#' className='nav-link-light'>Sell properties</Link></li>
                      <li><Link href='#' className='nav-link-light'>Find Agents</Link></li>
                    </ul>
                  </Col>
                  <Col>
                    <h3 className='h6 mb-2 pb-1 fs-base text-light'>Services</h3>
                    <ul className='list-unstyled fs-sm'>
                      <li><Link href='#' className='nav-link-light'>Save for next rent</Link></li>
                      <li><Link href='#' className='nav-link-light'>Property profit potential</Link></li>
                      <li><Link href='#' className='nav-link-light'>Get Hot Deals</Link></li>
                    </ul>
                  </Col>
                </Row>

                {/* Socials */}
                <div className='text-nowrap border-top border-light mt-3 py-4'>
                  <Nav className='mb-sm-4 mb-1 h6 pb-1 fs-base text-light fs-sm'>
                    <Nav.Item className='mb-2'>
                      <Nav.Link href='enquiries@homefindernigeria.com' active={false} className='me-5 p-0 fw-normal'>
                        <i className='fi-mail me-2 align-middle opacity-70'></i>
                        info@homefindernigeria.com
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link href='tel:4065550120' active={false} className='p-0 fw-normal'>
                        <i className='fi-device-mobile me-2 align-middle opacity-70'></i>
                        +234 706 555 0120
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <SocialButton href='#' brand='facebook' variant='translucent' roundedCircle light className='me-2' />
                  <SocialButton href='#' brand='instagram' variant='translucent' roundedCircle light className='me-2' />
                  <SocialButton href='#' brand='tiktok' variant='translucent' roundedCircle light className='me-2' />
                  <SocialButton href='#' brand='whatsapp' variant='translucent' roundedCircle light />
                </div>
              </Col>
              <Col md={6} xl={{offset: 1}}>
                <div className='d-flex align-items-center'>
                  <Card className='card-light w-100' style={{maxWidth: '526px'}}>
                    <Card.Body className='p-4 p-xl-5 my-2 my-md-0'>
                      <div style={{maxWidth: '380px'}}>
                        <h3 className='h4 text-light'>Download Our App</h3>
                        <p className='fs-sm text-light opacity-70 mb-2 mb-lg-3'>Discover everything you need for buying, selling, and renting properties easily with our app!</p>
                        <div className='d-flex flex-column flex-sm-row ms-n3'>
                          <MarketButton href='#' market='apple' target='_blank' className='mt-3 ms-3' />
                          <MarketButton href='#' market='google' target='_blank' className='mt-3 ms-3' />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                  <div className='d-none d-xl-block ms-n4'>
                    <ImageLoader priority src='/images/job-board/footer-mobile.svg' width={116} height={233} alt='Mobile app' />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Copyright */}
            <div className='text-center fs-sm pt-4 mt-3 pb-2'>
              &copy;2025 HomeFinder Nigeria. All rights reserved.
            </div>
          </Container>
        </footer>
      </>
  )
}

export default RealEstatePageLayout