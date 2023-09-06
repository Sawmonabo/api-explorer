import React, { useEffect } from 'react';
import { RedocStandalone } from 'redoc';
import config from '../../../config';

const RedocPage = () => {
  
  const redocOptions = {
    disableSearch: true,
  };

  useEffect(() => {
    const divElement = document.querySelector('.sc-ehixzo.fvCUyW');
    if (divElement) {
      const imgElement = divElement.querySelector('img');
      if (imgElement) {
        divElement.removeChild(imgElement);
        // imgElement.src = require('./fortress-logo-recent.png');
      }
    }
  }, []);

  return (
    <div className='redoc'>
      < RedocStandalone 
        specUrl={config.openapiUrl}
        options={redocOptions}
      />
      <style>{`
        .redoc div.sc-eBHhsj.dhHelK.menu-content {
          top: 80px !important;
        }
        .redoc img.sc-kbhJrz.eWQeXK {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
export default RedocPage;