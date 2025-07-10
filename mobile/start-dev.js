#!/usr/bin/env node

const { startDevServerAsync } = require('@expo/dev-server');
const path = require('path');

async function startDev() {
  try {
    console.log('Starting development server...');
    
    const projectRoot = process.cwd();
    console.log('Project root:', projectRoot);
    
    // Start the development server
    await startDevServerAsync(projectRoot, {
      port: 8081,
      platform: 'all',
      dev: true,
      minify: false,
    });
    
    console.log('Development server started successfully!');
  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}

startDev();