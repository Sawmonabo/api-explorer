import React, { useEffect } from 'react';
import config from './config';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import RedocPage from './components/pages/docs/Redoc';
import SwaggerPage from './components/pages/docs/Swagger';
import DynamicAPI from './components/pages/DynamicAPI';
import OpenAPISchema from './components/pages/OpenAPI';
import './App.css';

function App() {
  useEffect(() => {
    // Set the title based on your configuration
    document.title = config.appName || 'Default Title';
  }, []);

  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path='/' exact component={RedocPage} />
        <Route path='/redoc' component={RedocPage} />
        <Route path='/swagger' component={SwaggerPage} />
        <Route path='/endpoints' component={DynamicAPI} />
        <Route path='/openapi-schema' component={OpenAPISchema} />
      </Switch>
    </Router>
  );
}

export default App;