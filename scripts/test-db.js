/** @format */

import { config } from "dotenv";
import { Pool } from "pg";

// Load environment variables
config();

async function testDatabaseConnection() {
	try {
		console.log("🔄 Testing database connection...");

		if (!process.env.DATABASE_URL) {
			throw new Error("DATABASE_URL environment variable is not set");
		}

		const pool = new Pool({
			connectionString: process.env.DATABASE_URL,
		});

		// Test connection
		const client = await pool.connect();
		console.log("✅ Successfully connected to database!");

		// Test query
		const result = await client.query("SELECT NOW() as current_time");
		console.log("✅ Database query successful:", result.rows[0]);

		// Check if tables exist
		const tablesResult = await client.query(`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
		`);

		console.log(
			"📋 Existing tables:",
			tablesResult.rows.map((row) => row.table_name)
		);

		client.release();
		await pool.end();

		console.log("🎉 Database connection test completed successfully!");
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	}
}

testDatabaseConnection();
