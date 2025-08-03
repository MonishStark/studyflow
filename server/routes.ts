/** @format */

import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
	insertStudySessionSchema,
	insertSessionProgressSchema,
	insertUserSettingsSchema,
} from "@shared/schema";
import { z } from "zod";

// Store SSE connections for real-time notifications
const sseConnections = new Set<Response>();

export async function registerRoutes(app: Express): Promise<Server> {
	// Server-Sent Events for real-time notifications
	app.get("/api/events", (req, res) => {
		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Cache-Control",
		});

		// Add this connection to our set
		sseConnections.add(res);

		// Send initial connection message
		res.write("data: " + JSON.stringify({ type: "connected" }) + "\n\n");

		// Clean up on client disconnect
		req.on("close", () => {
			sseConnections.delete(res);
		});
	});

	// Function to broadcast notifications to all connected clients
	const broadcastNotification = (notification: any) => {
		const message = `data: ${JSON.stringify(notification)}\n\n`;
		sseConnections.forEach((res) => {
			try {
				res.write(message);
			} catch (error) {
				// Remove broken connections
				sseConnections.delete(res);
			}
		});
	};

	// Export broadcast function for use by scheduler
	(global as any).broadcastNotification = broadcastNotification;

	// Study Sessions
	app.get("/api/study-sessions", async (req, res) => {
		try {
			const sessions = await storage.getStudySessions();
			console.log("Fetched study sessions:", sessions);
			res.json(sessions);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch study sessions" });
		}
	});

	app.get("/api/study-sessions/active", async (req, res) => {
		try {
			console.log("=== ACTIVE SESSION ROUTE CALLED ===");
			console.log("Checking for active session...");
			const activeSession = await storage.getActiveSession();
			console.log("Active session result from storage:", activeSession);
			if (!activeSession) {
				console.log("No active session found, returning null with 200 status");
				return res.status(200).json(null);
			}
			console.log("Active session found! Returning:", activeSession);
			res.status(200).json(activeSession);
		} catch (error) {
			console.error("Error fetching active session:", error);
			res.status(500).json({ message: "Failed to fetch active session" });
		}
	});

	app.get("/api/study-sessions/:id", async (req, res) => {
		try {
			const session = await storage.getStudySession(req.params.id);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			res.json(session);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch study session" });
		}
	});

	app.get(
		"/api/study-sessions/date-range/:startDate/:endDate",
		async (req, res) => {
			try {
				const startDate = new Date(req.params.startDate);
				const endDate = new Date(req.params.endDate);
				const sessions = await storage.getStudySessionsByDateRange(
					startDate,
					endDate
				);
				res.json(sessions);
			} catch (error) {
				res
					.status(500)
					.json({ message: "Failed to fetch study sessions by date range" });
			}
		}
	);

	app.post("/api/study-sessions", async (req, res) => {
		try {
			console.log("Received request to create study session:", req.body);
			const validatedData = insertStudySessionSchema.parse(req.body);
			console.log("Creating study session with data:", validatedData);

			// Create sessions for each day in the date range
			const startDate = new Date(validatedData.startDate);
			const endDate = new Date(validatedData.endDate);
			const sessions = [];

			// Iterate through each day from start to end date
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const sessionForDay = {
					...validatedData,
					startDate: new Date(currentDate),
					endDate: new Date(currentDate), // Each session is for one day
				};

				const session = await storage.createStudySession(sessionForDay);
				sessions.push(session);

				// Move to next day
				currentDate.setDate(currentDate.getDate() + 1);
			}

			console.log(
				`Created ${
					sessions.length
				} sessions from ${startDate.toDateString()} to ${endDate.toDateString()}`
			);
			res.status(201).json({
				message: `Created ${sessions.length} sessions`,
				sessions,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid session data", errors: error.errors });
			}
			console.error("Error creating study sessions:", error);
			res.status(500).json({ message: "Failed to create study session" });
		}
	});

	app.patch("/api/study-sessions/:id", async (req, res) => {
		try {
			const session = await storage.updateStudySession(req.params.id, req.body);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			res.json(session);
		} catch (error) {
			res.status(500).json({ message: "Failed to update study session" });
		}
	});

	app.patch("/api/study-sessions/:id/cancel", async (req, res) => {
		try {
			const session = await storage.cancelStudySession(req.params.id);
			if (!session) {
				return res.status(404).json({ message: "Study session not found" });
			}
			res.json(session);
		} catch (error) {
			res.status(500).json({ message: "Failed to cancel study session" });
		}
	});

	app.delete("/api/study-sessions/:id", async (req, res) => {
		try {
			const deleted = await storage.deleteStudySession(req.params.id);
			if (!deleted) {
				return res.status(404).json({ message: "Study session not found" });
			}
			res.status(204).send();
		} catch (error) {
			res.status(500).json({ message: "Failed to delete study session" });
		}
	});

	// Session Progress
	app.get("/api/session-progress/:sessionId", async (req, res) => {
		try {
			const progress = await storage.getSessionProgress(req.params.sessionId);
			res.json(progress);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch session progress" });
		}
	});

	app.post("/api/session-progress", async (req, res) => {
		try {
			const validatedData = insertSessionProgressSchema.parse(req.body);
			const progress = await storage.createSessionProgress(validatedData);
			res.status(201).json(progress);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid progress data", errors: error.errors });
			}
			res.status(500).json({ message: "Failed to create session progress" });
		}
	});

	app.get("/api/weekly-progress/:startDate/:endDate", async (req, res) => {
		try {
			const startDate = new Date(req.params.startDate);
			// Make endDate inclusive of the entire day by setting it to 23:59:59.999 of that date
			const endDate = new Date(req.params.endDate);
			endDate.setHours(23, 59, 59, 999);

			console.log(`Fetching weekly progress from ${startDate} to ${endDate}`);
			const progress = await storage.getWeeklyProgress(startDate, endDate);
			console.log(`Weekly progress result:`, progress);
			res.json(progress);
		} catch (error) {
			console.error("Error fetching weekly progress:", error);
			res.status(500).json({ message: "Failed to fetch weekly progress" });
		}
	});

	// User Settings
	app.get("/api/user-settings", async (req, res) => {
		try {
			const settings = await storage.getUserSettings();
			res.json(settings);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch user settings" });
		}
	});

	app.patch("/api/user-settings", async (req, res) => {
		try {
			console.log("Updating user settings with:", req.body);
			const settings = await storage.updateUserSettings(req.body);
			console.log("Updated settings result:", settings);
			res.json(settings);
		} catch (error) {
			console.error("Error updating user settings:", error);
			res.status(500).json({ message: "Failed to update user settings" });
		}
	});

	const httpServer = createServer(app);
	return httpServer;
}
