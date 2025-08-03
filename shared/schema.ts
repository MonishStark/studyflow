/** @format */

import { sql } from "drizzle-orm";
import {
	pgTable,
	text,
	varchar,
	timestamp,
	integer,
	boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studySessions = pgTable("study_sessions", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	subject: text("subject").notNull(),
	duration: integer("duration").notNull(), // in minutes
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	startTime: text("start_time").notNull(), // HH:MM format
	isActive: boolean("is_active").default(false),
	isCompleted: boolean("is_completed").default(false),
	status: text("status").default("active"), // 'active', 'completed', 'canceled'
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").default(sql`now()`),
});

export const sessionProgress = pgTable("session_progress", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	sessionId: varchar("session_id").references(() => studySessions.id),
	studiedMinutes: integer("studied_minutes").default(0),
	date: timestamp("date").notNull(),
	createdAt: timestamp("created_at").default(sql`now()`),
});

export const userSettings = pgTable("user_settings", {
	id: varchar("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	musicVolume: integer("music_volume").default(60),
	selectedMusicTrack: text("selected_music_track").default("nature-sounds"),
	notificationsEnabled: boolean("notifications_enabled").default(true),
	language: text("language").default("en"), // 'en' for English, 'tr' for Turkish
	createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertStudySessionSchema = createInsertSchema(studySessions, {
	startDate: z.string().transform((str) => new Date(str)),
	endDate: z.string().transform((str) => new Date(str)),
}).omit({
	id: true,
	isActive: true,
	isCompleted: true,
	status: true,
	completedAt: true,
	createdAt: true,
});

export const insertSessionProgressSchema = createInsertSchema(sessionProgress, {
	date: z.string().transform((str) => new Date(str)),
}).omit({
	id: true,
	createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
	id: true,
	createdAt: true,
});

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type SessionProgress = typeof sessionProgress.$inferSelect;
export type InsertSessionProgress = z.infer<typeof insertSessionProgressSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
