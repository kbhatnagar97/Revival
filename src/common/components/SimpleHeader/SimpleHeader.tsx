import React from 'react';
import { Link } from 'react-router-dom';
import AuthButton from '../AuthButton/AuthButton';
import GalaxyToggleButton from '../GalaxyToggleButton/GalaxyToggleButton';
import './SimpleHeader.scss';

interface SimpleHeaderProps {
  title: string;
  buttonType?: 'auth' | 'galaxy';
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  title,
  buttonType = 'auth',
}) => {
  return (
    <header className='simple-header'>
      <div className='simple-header__content'>
        <h1 className='simple-header__title'>{title}</h1>
        <div className='simple-header__nav'>
          {buttonType === 'galaxy' ? (
            <Link to='/' className='simple-header__galaxy-nav'>
              <GalaxyToggleButton onClick={() => {}} isOpen={false} />
            </Link>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
