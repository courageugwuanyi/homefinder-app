import dynamic from 'next/dynamic'
import Link from 'next/link'
import Dropdown from 'react-bootstrap/Dropdown'
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const CardImage = dynamic(() => import('./partials/CardImage'))
const CardImageSlider = dynamic(() => import('./partials/CardImageSlider'))

const PropertyCard = ({
  images,
  href,
  title,
  category,
  location,
  price,
  badges,
  wishlistButton,
  dropdown,
  footer,
  horizontal,
  light,
  className,
  ...props
}) => {

  const horizontalClass = horizontal ? ' card-horizontal' : '',
        extraClass = className ? ` ${className}` : ''

  return (
    <div
      {...props}
      className={light ? `card card-light card-hover${horizontalClass}${extraClass}` : `card card-hover shadow-sm border-0${horizontalClass}${extraClass}`}
    >
      {images && <>
        {images.length > 1 ? 
          <CardImageSlider
            horizontal={horizontal ? true : false}
            images={images}
            href={href}
            badges={badges}
            wishlistButton={wishlistButton}
            light={light ? 1 : 0}
          /> :
          <CardImage
            horizontal={horizontal ? true : false}
            images={images}
            href={href}
            badges={badges}
            wishlistButton={wishlistButton}
            light={light ? 1 : 0}
          />
        }
      </>}
      <div className='card-body position-relative pb-3'>
      {dropdown && <Dropdown className='dropdown position-absolute zindex-5 top-0 end-0 mt-3 me-3'>
        <Dropdown.Toggle variant={`${light ? 'translucent-light' : 'light shadow-sm'} btn-icon btn-xs rounded-circle`}>
          <i className='fi-dots-vertical'></i>
        </Dropdown.Toggle>
        <Dropdown.Menu variant={light? 'dark' : ''} className='my-1'>
          {dropdown.map((item, indx) => {
            if (item.href) {
              return <Dropdown.Item key={indx} as={Link} href={item.href} {...item.props}>
                <i className={`${item.icon}${light ? '' : ' opacity-60'} me-2`}></i>
                {item.label}
              </Dropdown.Item>
            } else {
              return <Dropdown.Item key={indx} as='button' {...item.props}>
                <i className={`${item.icon}${light ? '' : ' opacity-60'} me-2`}></i>
                {item.label}
              </Dropdown.Item>
            }
          })}
        </Dropdown.Menu></Dropdown>}
        {category && <div className='mb-1 fs-xs text-uppercase text-primary'>{category}</div>}
        {title && <h3 className='h6 mb-2 fs-base'>
          {href ? <Link href={href} className={light ? 'nav-link-light stretched-link' : 'nav-link stretched-link'}>
            {title}
          </Link> : <span className={light ? 'text-light' : ''}>{title}</span>}
        </h3>}
        {location && <p className={`mb-2 fs-sm ${light ? 'text-light opacity-50' : 'text-muted'}`}>{location}</p>}
        {price && <div className='fw-bold'>
          <i className={`fi-cash mt-n1 me-2 lead align-middle${light ? ' opacity-50' : ' opacity-70'}`}></i>
          <span className={light ? 'opacity-70' : ''}>₦{price}
            {!category?.toLocaleLowerCase().includes('sale') &&
            <span className="d-inline-block ms-1 fs-base fw-normal text-body">/year</span> }
          </span>
        </div>}
        {horizontal && <>
          {footer && <div className={`d-flex align-items-center justify-content-center justify-content-sm-start border-top${light ? ' border-light' : ''} pt-3 pb-2 mt-3 text-nowrap`}>
            {footer.map((item, indx) => {
              return item[0].includes('icon')
                  ? <span key={indx} className='d-inline-block me-4 fs-sm'>
                    {item[1]}
                    <i className={`${item[0]} ms-1 mt-n1 fs-lg text-muted me-1`}></i>
                    </span>
                  : <span key={indx} className='d-inline-block me-4 fs-sm'>
                    <i className={`${item[0]} ms-1 mt-n1 fs-lg text-muted me-1`}></i>
                    {item[1]}
                    </span>
            })}
          </div>}
        </>}
      </div>
      {!horizontal && <>
        {footer && <div className='card-footer d-flex align-items-center justify-content-center mx-3 pt-3 text-nowrap'>
          {footer.map((item, indx) => {
            const isPropIcon = item[0].includes('dice') || item[0].includes('resize');
            const toolTipText = isPropIcon
                ? (item[1].length > 1 ? item[1][0] : item[1][2])
                : item[1][0] > 1 ? item[1][1] : item[1][2];
            return <OverlayTrigger placement='bottom' overlay={<Tooltip>{toolTipText}</Tooltip>} key={indx}>
                    <span className='d-inline-block me-4 fs-sm'>
                      {isPropIcon
                          ? item[1].length > 1 &&
                            <>
                              <i className={`${item[0]} mx-1 mt-n1 fs-lg text-muted me-1`}></i>
                              {item[1][1]}
                            </>
                          :
                            item[1].length > 2 &&
                            <>
                              {item[1][0]}
                              <i className={`${item[0]} ms-1 mt-n1 fs-lg text-muted me-1`}></i>
                            </>
                      }
                    </span>
                  </OverlayTrigger>
          })}
        </div>}
      </>}
    </div>
  )
}

export default PropertyCard
