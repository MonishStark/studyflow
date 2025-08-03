/** @format */

import {
	type StudySession,
	type InsertStudySession,
	type SessionProgress,
	type InsertSessionProgress,
	type UserSettings,
	type InsertUserSettings,
	studySessions,
	sessionProgress,
	userSettings,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { config } from "dotenv";

// Load environment variables
config();

export interface IStorage {
	// Study Sessions
	getStudySession(id: string): Promise<StudySession | undefined>;
	getStudySessions(): Promise<StudySession[]>;
	getStudySessionsByDateRange(
		startDate: Date,
		endDate: Date
	): Promise<StudySession[]>;
	createStudySession(session: InsertStudySession): Promise<StudySession>;
	updateStudySession(
		id: string,
		session: Partial<StudySession>
	): Promise<StudySession | undefined>;
	deleteStudySession(id: string): Promise<boolean>;
	cancelStudySession(id: string): Promise<StudySession | undefined>;
	getActiveSession(): Promise<StudySession | undefined>;

	// Session Progress
	getSessionProgress(sessionId: string): Promise<SessionProgress[]>;
	createSessionProgress(
		progress: InsertSessionProgress
	): Promise<SessionProgress>;
	getWeeklyProgress(startDate: Date, endDate: Date): Promise<SessionProgress[]>;

	// User Settings
	getUserSettings(): Promise<UserSettings | undefined>;
	updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}

export class PostgreSQLStorage implements IStorage {
	private db;

	constructor() {
		if (!process.env.DATABASE_URL) {
			throw new Error("DATABASE_URL environment variable is required");
		}

		// Debug: Log the DATABASE_URL (safely, without showing password)
		const dbUrl = process.env.DATABASE_URL;
		const safeUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
		console.log("🔗 DATABASE_URL format:", safeUrl);
		console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

		// Enhanced PostgreSQL configuration for Railway
		const pool = new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl:
				process.env.NODE_ENV === "production"
					? { rejectUnauthorized: false }
					: false,
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		});

		// Add connection error handling
		pool.on("error", (err) => {
			console.error("Unexpected error on idle client", err);
		});

		this.db = drizzle(pool);

		// Test connection and run manual migration
		this.initializeDatabase();
	}

	private async initializeDatabase() {
		try {
			console.log("🔄 Testing database connection...");

			// Test basic connection with timeout
			const result = await Promise.race([
				this.db.execute(sql`SELECT NOW() as current_time`),
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error("Database connection timeout")),
						5000
					)
				),
			]);
			console.log("✅ Database connected successfully!");

			// Check if tables exist, if not create them
			await this.ensureTablesExist();

			// Ensure status column exists
			await this.ensureStatusColumn();

			// Ensure language column exists in user_settings
			await this.ensureLanguageColumn();
		} catch (error) {
			console.error("❌ Database initialization failed:", error);
			console.log("⚠️  App will continue running without database connection");
			console.log(
				"🔧 Please check your DATABASE_URL environment variable in Railway"
			);
			// Don't throw the error - let the app continue running
		}
	}

	private async ensureTablesExist() {
		try {
			console.log("🔄 Checking if tables exist...");
			
			// Check if study_sessions table exists
			const tablesResult = await this.db.execute(sql`
				SELECT table_name 
				FROM information_schema.tables 
				WHERE table_schema = 'public' AND table_name IN ('study_sessions', 'session_progress', 'user_settings')
			`);

			const existingTables = tablesResult.rows.map((row: any) => row.table_name);
			console.log("📋 Existing tables:", existingTables);

			if (existingTables.length === 0) {
				console.log("🏗️  No tables found, creating them...");
				await this.createTables();
			} else {
				console.log("✅ Tables already exist");
			}
		} catch (error) {
			console.error("❌ Error checking/creating tables:", error);
		}
	}

	private async createTables() {
		try {
			// Create study_sessions table
			await this.db.execute(sql`
				CREATE TABLE IF NOT EXISTS "study_sessions" (
					"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
					"subject" text NOT NULL,
					"duration" integer NOT NULL,
					"start_date" timestamp NOT NULL,
					"end_date" timestamp NOT NULL,
					"start_time" text NOT NULL,
					"is_active" boolean DEFAULT false,
					"is_completed" boolean DEFAULT false,
					"completed_at" timestamp,
					"created_at" timestamp DEFAULT now(),
					"status" text DEFAULT 'active'
				);
			`);
			console.log("✅ Created study_sessions table");

			// Create session_progress table
			await this.db.execute(sql`
				CREATE TABLE IF NOT EXISTS "session_progress" (
					"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
					"session_id" varchar,
					"studied_minutes" integer DEFAULT 0,
					"date" timestamp NOT NULL,
					"created_at" timestamp DEFAULT now()
				);
			`);
			console.log("✅ Created session_progress table");

			// Create user_settings table
			await this.db.execute(sql`
				CREATE TABLE IF NOT EXISTS "user_settings" (
					"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
					"music_volume" integer DEFAULT 60,
					"selected_music_track" text DEFAULT 'nature-sounds',
					"notifications_enabled" boolean DEFAULT true,
					"created_at" timestamp DEFAULT now(),
					"language" text DEFAULT 'en'
				);
			`);
			console.log("✅ Created user_settings table");

			// Add foreign key constraint
			await this.db.execute(sql`
				ALTER TABLE "session_progress" 
				ADD CONSTRAINT IF NOT EXISTS "session_progress_session_id_study_sessions_id_fk" 
				FOREIGN KEY ("session_id") REFERENCES "public"."study_sessions"("id") ON DELETE no action ON UPDATE no action;
			`);
			console.log("✅ Added foreign key constraints");

		} catch (error) {
			console.error("❌ Error creating tables:", error);
		}
	}

	private async ensureLanguageColumn() {
		try {
			await this.db.execute(sql`
				ALTER TABLE user_settings 
				ADD COLUMN IF NOT EXISTS language text DEFAULT 'en'
			`);
			console.log("✅ Language column ensured in user_settings table");
		} catch (error) {
			console.log("Note: Language column may already exist:", error);
		}
	}

	private async ensureStatusColumn() {
		try {
			// Try to add the status column if it doesn't exist
			await this.db.execute(sql`
				ALTER TABLE study_sessions 
				ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
			`);
			console.log("✅ Status column ensured in study_sessions table");
		} catch (error) {
			console.log(
				"Note: Status column may already exist or migration failed:",
				error
			);
		}
	}

	async getStudySession(id: string): Promise<StudySession | undefined> {
		const result = await this.db
			.select()
			.from(studySessions)
			.where(eq(studySessions.id, id))
			.limit(1);

		return result[0];
	}

	async getStudySessions(): Promise<StudySession[]> {
		return await this.db
			.select()
			.from(studySessions)
			.orderBy(desc(studySessions.createdAt));
	}

	async getStudySessionsByDateRange(
		startDate: Date,
		endDate: Date
	): Promise<StudySession[]> {
		return await this.db
			.select()
			.from(studySessions)
			.where(
				and(
					gte(studySessions.startDate, startDate),
					lte(studySessions.startDate, endDate)
				)
			)
			.orderBy(desc(studySessions.startDate));
	}

	async createStudySession(
		insertSession: InsertStudySession
	): Promise<StudySession> {
		const result = await this.db
			.insert(studySessions)
			.values(insertSession)
			.returning();

		return result[0];
	}

	async updateStudySession(
		id: string,
		updates: Partial<StudySession>
	): Promise<StudySession | undefined> {
		const result = await this.db
			.update(studySessions)
			.set(updates)
			.where(eq(studySessions.id, id))
			.returning();

		return result[0];
	}

	async deleteStudySession(id: string): Promise<boolean> {
		const result = await this.db
			.delete(studySessions)
			.where(eq(studySessions.id, id))
			.returning();

		return result.length > 0;
	}

	async cancelStudySession(id: string): Promise<StudySession | undefined> {
		const result = await this.db
			.update(studySessions)
			.set({
				status: "canceled",
				isActive: false, // Make sure canceled sessions are not active
			})
			.where(eq(studySessions.id, id))
			.returning();

		return result[0];
	}

	async getActiveSession(): Promise<StudySession | undefined> {
		console.log("Storage: Querying for active session...");
		const result = await this.db
			.select()
			.from(studySessions)
			.where(eq(studySessions.isActive, true))
			.limit(1);

		console.log("Storage: Active session query result:", result);
		console.log("Storage: Number of active sessions found:", result.length);
		if (result.length > 0) {
			console.log("Storage: Returning first active session:", result[0]);
		} else {
			console.log("Storage: No active session found in database");
		}
		return result[0];
	}

	async getSessionProgress(sessionId: string): Promise<SessionProgress[]> {
		return await this.db
			.select()
			.from(sessionProgress)
			.where(eq(sessionProgress.sessionId, sessionId))
			.orderBy(desc(sessionProgress.date));
	}

	async createSessionProgress(
		insertProgress: InsertSessionProgress
	): Promise<SessionProgress> {
		console.log(`Creating session progress:`, insertProgress);
		const result = await this.db
			.insert(sessionProgress)
			.values(insertProgress)
			.returning();
		console.log(`Session progress created:`, result[0]);
		return result[0];
	}

	async getWeeklyProgress(
		startDate: Date,
		endDate: Date
	): Promise<SessionProgress[]> {
		console.log(
			`Storage: Querying weekly progress from ${startDate} to ${endDate}`
		);

		const result = await this.db
			.select()
			.from(sessionProgress)
			.where(
				and(
					gte(sessionProgress.date, startDate),
					lte(sessionProgress.date, endDate)
				)
			)
			.orderBy(desc(sessionProgress.date));
		console.log(`Storage: Weekly progress query result:`, result);
		return result;
	}

	async getUserSettings(): Promise<UserSettings | undefined> {
		const result = await this.db.select().from(userSettings).limit(1);

		// If no settings exist, create default ones
		if (result.length === 0) {
			const defaultSettings: InsertUserSettings = {
				musicVolume: 60,
				selectedMusicTrack: "nature-sounds",
				notificationsEnabled: true,
				language: "en",
			};

			const newSettings = await this.db
				.insert(userSettings)
				.values(defaultSettings)
				.returning();

			return newSettings[0];
		}

		return result[0];
	}

	async updateUserSettings(
		updates: Partial<UserSettings>
	): Promise<UserSettings> {
		// Filter out read-only fields that shouldn't be updated
		const { id, createdAt, ...allowedUpdates } = updates;

		// First, get existing settings or create default ones
		let existingSettings = await this.getUserSettings();

		if (!existingSettings) {
			const defaultSettings: InsertUserSettings = {
				musicVolume: 60,
				selectedMusicTrack: "nature-sounds",
				notificationsEnabled: true,
				language: "en",
				...allowedUpdates,
			};

			const result = await this.db
				.insert(userSettings)
				.values(defaultSettings)
				.returning();

			return result[0];
		}

		const result = await this.db
			.update(userSettings)
			.set(allowedUpdates)
			.where(eq(userSettings.id, existingSettings.id))
			.returning();

		return result[0];
	}
}

export const storage = new PostgreSQLStorage();
