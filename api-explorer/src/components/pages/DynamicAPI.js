import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import axios from 'axios';
import './DynamicAPI.css';
import config from '../../config';

const APIExplorer = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [requestParameters, setRequestParameters] = useState({});
  const [responseJSON, setResponseJSON] = useState({});

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const response = await axios.get(config.openapiUrl);
        const openapiSpec = response.data;

        // Process the OpenAPI specification and extract the endpoints
        const extractedEndpoints = getEndpoints(openapiSpec);
        setEndpoints(extractedEndpoints);
      } catch (error) {
        console.error('Error retrieving endpoints:', error);
      }
    };

    fetchEndpoints();
  }, []);

  // Function to extract the endpoints from the OpenAPI specification
  const getEndpoints = (openapiSpec) => {
    console.log("Getting endpoints")
    const endpoints = [];
    const paths = openapiSpec.paths;
    const components = openapiSpec.components;
    for (const path in paths) {
      const methods = paths[path];
      for (const method in methods) {
        const endpoint = {
          method: method.toUpperCase(),
          path: path,
          parameters: methods[method].parameters || [],
          components: components,
          requestBody: methods[method].requestBody,
        };

        endpoints.push(endpoint);
      }
    }
    console.log("endpoints", endpoints)
    return endpoints;
  };

  // Function to handle endpoint selection
  const handleEndpointChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedEndpoint(selectedValue);

    // Reset request and response parameters when the endpoint changes
    setRequestParameters({});
    // setResponse('');
    setResponseJSON({});
  };

  const handleParameterInputs = (parameterName, parameterType, event) => {
    if (parameterType === 'file') {
      const file = event.target.files[0]; // Get the selected file
      const updatedParameters = { ...requestParameters };
      updatedParameters[parameterName] = file;
      setRequestParameters(updatedParameters);
    } else {
      const parameterValue = event.target.value;
      const type = parameterType ? parameterType.toLowerCase() : ''; // Add a null check
  
      let castedValue;
  
      const nestedFields = parameterName.split('.');
      let updatedParameters = { ...requestParameters };
  
      let currentField = updatedParameters;
      for (let i = 0; i < nestedFields.length - 1; i++) {
        const nestedField = nestedFields[i];
        if (!(nestedField in currentField)) {
          currentField[nestedField] = {};
        }
        currentField = currentField[nestedField];
      }
  
      const lastField = nestedFields[nestedFields.length - 1];
  
      // Handle other data types
      switch (type) {
        case 'number':
          castedValue = Number(parameterValue);
          break;
        case 'boolean':
          castedValue = event.target.checked;
          break;
        case 'array':
          castedValue = parameterValue.split(',').map((item) => item.trim());
          break;
        default:
          castedValue = parameterValue;
      }
  
      currentField[lastField] = castedValue;
  
      setRequestParameters(updatedParameters);
    }
  };
  
  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!selectedEndpoint) {
      console.error('No endpoint selected.');
      return;
    }
  
    try {
      const endpoint = endpoints.find(
        (endpoint) => `${endpoint.method} ${endpoint.path}` === selectedEndpoint
      );
  
      const requestUrl = config.apiBaseUrl + `${endpoint.path}`;
      const requestMethod = endpoint.method.toLowerCase();
  
      let formData = null;
      let requestData = requestParameters;
      let headers = {
        // Set the default header to application/json
        'Content-Type': 'application/json',
      };
  
      if (endpoint.requestBody?.content?.['multipart/form-data']) {
        formData = new FormData();
        for (const key in requestData) {
          if (key === 'file' && requestData[key] instanceof File) {
            formData.append(key, requestData[key], requestData[key].name);
          } else {
            formData.append(key, requestData[key]);
          }
        }
        // Clear the requestData as it's now in formData
        requestData = {};
        // Update the header for form data
        headers['Content-Type'] = 'multipart/form-data';
      }
  
      const axiosConfig = {
        url: requestUrl,
        method: requestMethod,
        data: formData || requestData,
        headers: headers, // Update the headers
      };
      const response = await axios.request(axiosConfig);
  
      setResponseJSON(response.data);
    } catch (error) {
      console.error('Error making API request:', error);
      if (error.response && error.response.data) {
        setResponseJSON(error.response.data);
      } else if (error.response) {
        setResponseJSON({ "Error": error.response });
      } else if (error.message) {
        setResponseJSON({ "Error": error.message });
      } else {
        setResponseJSON({ "Error": "Failed to make API request." });
      }
    }
  };
  
  // Function to generate the request body fields
  const generateRequestBodyFields = () => {
    if (!selectedEndpoint) {
      return null;
    }
  
    const endpoint = endpoints.find(
      (endpoint) => `${endpoint.method} ${endpoint.path}` === selectedEndpoint
    );
    if (!endpoint || !endpoint.components || !endpoint.components.schemas) {
      return null;
    }
  
    const getRequestParameterValue = (propertyName) => {
      const nestedKeys = propertyName.split('.');
      let value = requestParameters;
      for (const key of nestedKeys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }
      return value;
    };
  
    const getInputType = (type, format) => {
      if (format === 'binary') {
        return 'file';
      } else {
        switch (type) {
          case 'string':
            return 'text';
          case 'number':
            return 'number';
          case 'boolean':
            return 'checkbox';
          case 'array':
            return 'text';
          default:
            return 'text';
        }
      }
    };
    
  
    const getSchemaDefaultValues = (schema) => {
      if (!schema.properties) {
        return {};
      }
  
      const defaultValues = {};
      Object.entries(schema.properties).forEach(([property, propertyDetails]) => {
        if (propertyDetails.default !== undefined) {
          defaultValues[property] = propertyDetails.default;
        } else if (propertyDetails.$ref) {
          const propertySchemaKey = propertyDetails.$ref.replace('#/components/schemas/', '');
          const nestedSchema = endpoint.components.schemas[propertySchemaKey];
          defaultValues[property] = getSchemaDefaultValues(nestedSchema);
        }
      });
  
      return defaultValues;
    };
  
      // Get the first content type defined for the request body
    const requestBodyContentType = Object.keys(endpoint.requestBody?.content || {})[0];
    if (!requestBodyContentType) {
      return (
        <div className='request-body'>
          <button type="submit">Submit</button>
        </div>
      );
    }

    const requestBodySchemaRef =
      endpoint.requestBody?.content?.[requestBodyContentType]?.schema?.$ref;
    if (!requestBodySchemaRef) {
      return null;
    }

    const requestBodySchemaKey = requestBodySchemaRef.replace('#/components/schemas/', '');
    const requestBodySchema = endpoint.components.schemas[requestBodySchemaKey];
    const defaultValues = getSchemaDefaultValues(requestBodySchema);

    const traverseSchema = (schema, prefix = '') => {
      if (schema.properties) {
        return Object.entries(schema.properties).flatMap(([property, propertyDetails], index) => {
          const { type } = propertyDetails;
          const inputType = getInputType(type, propertyDetails.format);

          let value = '';
    
          const propertyName = `${prefix}${property}`;
          const requestParameterValue = getRequestParameterValue(propertyName);
    
          if (requestParameterValue !== undefined) {
            value = requestParameterValue;
          } else if (defaultValues[property] !== undefined) {
            value = defaultValues[property];
          }
    
          let field;
          if (inputType === 'file') {
            field = (
              <div key={`${prefix}_${property}_${index}`}>
                <label>{`${property}`}:
                  <input
                    type={inputType}
                    onChange={(event) => handleParameterInputs(propertyName, 'file', event)}
                  />
                </label>
              </div>
            );
          } else if (inputType === 'checkbox') {
            field = (
              <div key={`${prefix}_${property}_${index}`} className='checkbox'>
                <label htmlFor={`explicit-${property}-label`}>{`${property}:`}</label>
                  <input
                    type={inputType}
                    id={`explicit-${property}-label`}
                    name={`${property}`}
                    checked={value}
                    onChange={(event) => handleParameterInputs(propertyName, type, event)}
                  />
              </div>
            );
          } else {
            field = (
              <div key={`${prefix}_${property}_${index}`}>
                <label>{`${property}`}:
                  <input
                    type={inputType}
                    value={value}
                    onChange={(event) =>
                      handleParameterInputs(propertyName, type, event)
                    }
                  />
                </label>
              </div>
            );
          }
          
          if (propertyDetails.$ref) {
            const propertySchemaKey = propertyDetails.$ref.replace('#/components/schemas/', '');
            const nestedSchema = endpoint.components.schemas[propertySchemaKey];
            const nestedFields = traverseSchema(nestedSchema, `${propertyName}.`);
            return nestedFields;
          }

          if (typeof propertyDetails === 'object' && !propertyDetails.$ref) {
            const nestedFields = traverseSchema(propertyDetails, `${propertyName}.`);
            return [
              field,
              ...nestedFields.map((nestedField) => (
                <React.Fragment key={`${prefix}_${property}_${index}`}>
                  {nestedField}
                </React.Fragment>
              ))
            ];
          }
          return field;
        });
      }
      return [];
    };
    
  
    const requestBodyFields = traverseSchema(requestBodySchema);
    
    const fieldsByType = {
      text: [],
      number: [],
      checkbox: [],
      file: []
    };
  
    requestBodyFields.forEach((field) => {
      const inputType = field.props.className || 'text';
      fieldsByType[inputType].push(field);
    });
    // Calculate the number of columns for checkboxes
    const numColumns = 3;
    const checkboxes = fieldsByType.checkbox;
    const checkboxesPerColumn = Math.ceil(checkboxes.length / numColumns);
    const checkboxColumns = [];

    for (let i = 0; i < numColumns; i++) {
      const startIndex = i * checkboxesPerColumn;
      const endIndex = startIndex + checkboxesPerColumn;
      const checkboxSlice = checkboxes.slice(startIndex, endIndex);
      checkboxColumns.push(checkboxSlice);
    }


    return (
      <div className='request-body'>
        <h3>Request Body</h3>
        {/* Render fields for main schema */}
        {fieldsByType.text.length > 0 && (
          <div className="text-group">
            {fieldsByType.text}
          </div>
        )}
        {fieldsByType.number.length > 0 && (
          <div className="numeric-group">
            {fieldsByType.number}
          </div>
        )}
        {checkboxColumns.length > 0 && (
          <div className="checkbox-group">
            {checkboxColumns.map((column, columnIndex) => (
              <div className="checkbox-column" key={columnIndex}>
                {column}
              </div>
            ))}
          </div>
        )}
        {fieldsByType.file.length > 0 && (
          <div className="file-group">
            {fieldsByType.file}
          </div>
        )}
        <button type="submit">Submit</button>
      </div>
    );
  };

  return (
    <div className="explorer-container">
      <h1>API Explorer</h1>
      <div className="center-box">
        <form onSubmit={handleSubmit}>
          <div className='endpoint-select'>
            <h3>Select Endpoint:</h3>
            <label>
              <select value={selectedEndpoint} onChange={handleEndpointChange}>
                <option value="">Select</option>
                {endpoints.map((endpoint, index) => (
                  <option key={index} value={`${endpoint.method} ${endpoint.path}`}>
                    {`${endpoint.method} ${endpoint.path}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedEndpoint && (
            <div className='request'>
              <div className='request-parameter'>
                <h3>Request Parameters</h3>
                {endpoints
                  .find((endpoint) => `${endpoint.method} ${endpoint.path}` === selectedEndpoint)
                  .parameters.map((parameter, index) => (
                    <label key={index}>
                      {parameter.name}:
                      <input
                        type="text"
                        value={requestParameters[parameter.name] || ''}
                        onChange={(event) =>
                          handleParameterInputs(parameter.name, parameter.type, event)
                        }
                      />
                    </label>
                ))}
              </div>
                {generateRequestBodyFields()}
            </div>
          )}
        </form>
        {responseJSON && Object.keys(responseJSON).length > 0 && (
          <div className='response_hidden'>
            <h3>Response</h3>
            <ReactJson src={responseJSON} name={false} theme="monokai" />
          </div>
        )}
      </div>
      <div className="response">
        {responseJSON && Object.keys(responseJSON).length > 0 && (
          <div>
            <h3>Response</h3>
            <ReactJson src={responseJSON} name={false} theme="monokai" />
          </div>
        )}
      </div>
    </div>
  );
};

export default APIExplorer;