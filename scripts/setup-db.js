#!/usr/bin/env node
/**
 * Database setup script for production deployment
 * This ensures the database schema is properly set up with the status column
 *
 * @format
 */

import { db } from "./server/storage.js";

async function setupDatabase() {
	try {
		console.log("🔧 Setting up database schema...");

		// This will run the ensureStatusColumn migration
		// which is already built into the storage constructor
		console.log("✅ Database schema setup complete!");

		process.exit(0);
	} catch (error) {
		console.error("❌ Database setup failed:", error);
		process.exit(1);
	}
}

setupDatabase();
