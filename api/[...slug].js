/** @format */

import { storage } from "../server/storage";
import {
	insertStudySessionSchema,
	insertSessionProgressSchema,
} from "../shared/schema";
import { z } from "zod";

export default async function handler(req, res) {
	// Enable CORS
	res.setHeader("Access-Control-Allow-Credentials", true);
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,OPTIONS,PATCH,DELETE,POST,PUT"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
	);

	if (req.method === "OPTIONS") {
		res.status(200).end();
		return;
	}

	const { slug } = req.query;
	const path = Array.isArray(slug) ? slug.join("/") : slug || "";

	try {
		// Study Sessions Routes
		if (req.method === "GET" && path === "study-sessions") {
			const sessions = await storage.getStudySessions();
			return res.json(sessions);
		}

		if (req.method === "GET" && path === "study-sessions/active") {
			const activeSession = await storage.getActiveSession();
			return res.json(activeSession);
		}

		if (
			req.method === "GET" &&
			path.startsWith("study-sessions/") &&
			!path.includes("/")
		) {
			const id = path.split("/")[1];
			const session = await storage.getStudySession(id);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			return res.json(session);
		}

		if (req.method === "POST" && path === "study-sessions") {
			const validatedData = insertStudySessionSchema.parse(req.body);

			// Create sessions for each day in the date range
			const startDate = new Date(validatedData.startDate);
			const endDate = new Date(validatedData.endDate);
			const sessions = [];

			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const sessionForDay = {
					...validatedData,
					startDate: new Date(currentDate),
					endDate: new Date(currentDate),
				};

				const session = await storage.createStudySession(sessionForDay);
				sessions.push(session);
				currentDate.setDate(currentDate.getDate() + 1);
			}

			return res.status(201).json({
				message: `Created ${sessions.length} sessions`,
				sessions,
			});
		}

		if (req.method === "PATCH" && path.includes("/cancel")) {
			const id = path.split("/")[1];
			const session = await storage.cancelStudySession(id);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			return res.json(session);
		}

		if (req.method === "PATCH" && path.startsWith("study-sessions/")) {
			const id = path.split("/")[1];
			const session = await storage.updateStudySession(id, req.body);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			return res.json(session);
		}

		if (req.method === "DELETE" && path.startsWith("study-sessions/")) {
			const id = path.split("/")[1];
			const deleted = await storage.deleteStudySession(id);
			if (!deleted) {
				return res.status(404).json({ message: "Study session not found" });
			}
			return res.status(204).end();
		}

		// Session Progress Routes
		if (req.method === "GET" && path.startsWith("session-progress/")) {
			const sessionId = path.split("/")[1];
			const progress = await storage.getSessionProgress(sessionId);
			return res.json(progress);
		}

		if (req.method === "POST" && path === "session-progress") {
			const validatedData = insertSessionProgressSchema.parse(req.body);
			const progress = await storage.createSessionProgress(validatedData);
			return res.status(201).json(progress);
		}

		// Weekly Progress Routes
		if (req.method === "GET" && path.startsWith("weekly-progress/")) {
			const parts = path.split("/");
			const startDate = new Date(parts[1]);
			const endDate = new Date(parts[2]);
			endDate.setHours(23, 59, 59, 999);

			const progress = await storage.getWeeklyProgress(startDate, endDate);
			return res.json(progress);
		}

		// User Settings Routes
		if (req.method === "GET" && path === "user-settings") {
			const settings = await storage.getUserSettings();
			return res.json(settings);
		}

		if (req.method === "PATCH" && path === "user-settings") {
			const settings = await storage.updateUserSettings(req.body);
			return res.json(settings);
		}

		// Default 404
		return res.status(404).json({ message: "API route not found" });
	} catch (error) {
		console.error("API Error:", error);
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Invalid data", errors: error.errors });
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}
