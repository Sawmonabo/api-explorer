import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import config from '../../../config';


const SwaggerPage = () => {
  return (
    <div>
      <SwaggerUI url={ config.openapiUrl } />
    </div>
  );
};

export default SwaggerPage;
