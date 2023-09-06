import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuItems } from './MenuItems';
import Dropdown from './Dropdown';
import config from '../config';
import './Navbar.css';

function Navbar() {
  const [click, setClick] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const onMouseEnter = (index) => {
    if (window.innerWidth < 960) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(index);
    }
  };

  const onMouseLeave = () => {
    if (window.innerWidth < 960) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(null);
    }
  };

  return (
    <>
      <nav className='navbar'>
        <Link to='/redoc' className='navbar-logo' onClick={closeMobileMenu}>
          { config.appName }
          <i className='fab fa-firstdraft' />
        </Link>
        <div className='menu-icon' onClick={handleClick}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          {MenuItems.map((item, index) => (
            
            <li
              key={index}
              className='nav-item'
              onMouseEnter={() => onMouseEnter(index)}
              onMouseLeave={onMouseLeave}
            >
              <Link to={item.dropdownItems[0].path} className='nav-links' onClick={closeMobileMenu}>
                {item.title} <i className='fas fa-caret-down' />
              </Link>
              {activeDropdown === index && <Dropdown dropdownItems={item.dropdownItems} />}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default Navbar;