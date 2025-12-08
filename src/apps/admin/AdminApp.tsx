/* ===================================================
   Admin App Wrapper
   ================================================= */

import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Import original admin App
import OriginalApp from './App';

const AdminApp = () => {
  return <OriginalApp />;
};

export default AdminApp;
