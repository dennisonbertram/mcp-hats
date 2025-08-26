#!/usr/bin/env node

/**
 * Hats Protocol MCP Server Entry Point
 * 
 * This is the main entry point for the Hats Protocol Model Context Protocol server.
 * It provides comprehensive tools for managing Hats Protocol operations including
 * role management, permission checking, organizational structures, and analytics
 * across multiple blockchain networks.
 */

import { config } from 'dotenv';
import { createServer, startServer } from './server.js';
import process from 'process';

// Load environment variables
config();

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Create and start the MCP server
    await startServer();

    // Handle graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.warn(`Received ${signal}, shutting down gracefully...`);
      try {
        // Server graceful shutdown will happen automatically
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Register signal handlers for graceful shutdown
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Handle uncaught exceptions and promise rejections
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('Unhandled rejection:', reason);
      process.exit(1);
    });

  } catch (error: any) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Check if this module is being run directly  
if (import.meta.url.endsWith('index.js') || import.meta.url.endsWith('index.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createServer, startServer };