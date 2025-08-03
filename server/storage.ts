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

		const pool = new Pool({
			connectionString: process.env.DATABASE_URL,
		});

		this.db = drizzle(pool);

		// Run manual migration to add status column if it doesn't exist
		this.ensureStatusColumn();
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
