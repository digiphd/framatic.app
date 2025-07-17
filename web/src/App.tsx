import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Slideshows from './pages/Slideshows';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<Home />} />
        
        {/* Dashboard Routes with Layout */}
        <Route path="/dashboard" element={
          <Layout currentPage="dashboard">
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/library" element={
          <Layout currentPage="library">
            <Library />
          </Layout>
        } />
        
        <Route path="/slideshows" element={
          <Layout currentPage="slideshows">
            <Slideshows />
          </Layout>
        } />
        
        <Route path="/settings" element={
          <Layout currentPage="settings">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </div>
          </Layout>
        } />
        
        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App
