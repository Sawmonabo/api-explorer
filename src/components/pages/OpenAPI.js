import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import axios from 'axios';
import config from '../../config';

const OpenAPISchema = () => {
  const [openapi, setOpenAPI] = useState({});

  useEffect(() => {
    const fetchOpenAPI = async () => {
      try {
        const response = await axios.get(config.openapiUrl);
        setOpenAPI(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOpenAPI();
  }, []);

  return (
    <div className="container">
      <div>
        <h1>OpenAPI Schema</h1>
        <div>
          <ReactJson src={openapi} theme="monokai" />
        </div>
      </div>
    </div>
  );
};

export default OpenAPISchema;