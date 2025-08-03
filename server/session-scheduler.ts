/** @format */

import { storage } from "./storage";
import { StudySession } from "@shared/schema";

// Fallback quotes in case API is unavailable
const fallbackQuotes = [
	{
		text: "The expert in anything was once a beginner.",
		author: "Helen Hayes",
	},
	{
		text: "Success is the sum of small efforts, repeated day in and day out.",
		author: "Robert Collier",
	},
	{
		text: "Education is the most powerful weapon which you can use to change the world.",
		author: "Nelson Mandela",
	},
	{
		text: "The beautiful thing about learning is that no one can take it away from you.",
		author: "B.B. King",
	},
	{
		text: "Study while others are sleeping; work while others are loafing.",
		author: "William A. Ward",
	},
	{
		text: "Don't let what you cannot do interfere with what you can do.",
		author: "John Wooden",
	},
	{
		text: "It is during our darkest moments that we must focus to see the light.",
		author: "Aristotle",
	},
];

class SessionScheduler {
	private checkInterval: NodeJS.Timeout | null = null;
	private readonly CHECK_INTERVAL_MS = 15000; // Check every 15 seconds (more frequent)

	constructor() {
		this.startScheduler();
	}

	private startScheduler() {
		if (this.checkInterval) return;

		console.log("🕒 Session scheduler started");
		this.checkInterval = setInterval(() => {
			this.checkForSessionsToStart();
		}, this.CHECK_INTERVAL_MS);

		// Also check immediately
		this.checkForSessionsToStart();
	}

	private async checkForSessionsToStart() {
		try {
			console.log("🔍 Checking for sessions to start/complete...");
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			// Get today's sessions
			const sessions = await storage.getStudySessionsByDateRange(
				today,
				tomorrow
			);
			console.log(
				`Found ${sessions.length} sessions for today:`,
				sessions.map((s) => ({
					id: s.id,
					subject: s.subject,
					startTime: s.startTime,
					isActive: s.isActive,
					isCompleted: s.isCompleted,
				}))
			);

			for (const session of sessions) {
				if (this.shouldStartSession(session, now)) {
					await this.startSession(session);
				} else if (this.shouldCompleteSession(session, now)) {
					await this.completeSession(session);
				}
			}
		} catch (error) {
			console.error("Error checking sessions:", error);
		}
	}

	private shouldStartSession(session: StudySession, now: Date): boolean {
		// Don't start if already active or completed
		if (session.isActive || session.isCompleted) return false;

		// Check if it's time to start
		const sessionDate = new Date(session.startDate);
		const [hours, minutes] = session.startTime.split(":").map(Number);

		const sessionStartTime = new Date(sessionDate);
		sessionStartTime.setHours(hours, minutes, 0, 0);

		// Start if current time is within 2 minutes of start time (wider window)
		const timeDiff = now.getTime() - sessionStartTime.getTime();
		return timeDiff >= 0 && timeDiff < 120000; // Within 2 minutes
	}

	private shouldCompleteSession(session: StudySession, now: Date): boolean {
		// Only complete if currently active
		if (!session.isActive || session.isCompleted) return false;

		// Calculate when session should end
		const sessionDate = new Date(session.startDate);
		const [hours, minutes] = session.startTime.split(":").map(Number);

		const sessionStartTime = new Date(sessionDate);
		sessionStartTime.setHours(hours, minutes, 0, 0);

		const sessionEndTime = new Date(
			sessionStartTime.getTime() + session.duration * 60000
		); // duration in minutes

		// Complete if current time is past the end time
		return now.getTime() >= sessionEndTime.getTime();
	}

	private async startSession(session: StudySession) {
		try {
			console.log(
				`🎯 Auto-starting session: ${session.subject} at ${session.startTime}`
			);

			// Mark session as active
			await storage.updateStudySession(session.id, {
				isActive: true,
			});

			// Fetch inspirational quote
			let quote = null;
			try {
				// Use JSON GPT API (working API as confirmed)
				const response = await fetch(
					"https://api.jsongpt.com/json?prompt=Generate 1 inspiration quote for studies with the author name &quotes=array of quotes",
					{
						headers: {
							accept: "application/json",
						},
					}
				);

				if (response.ok) {
					const data = await response.json();

					// Parse the quote format: "quote text" - Author Name
					if (data.quotes && data.quotes.length > 0) {
						const quoteString = data.quotes[0];
						const match = quoteString.match(/^"(.+?)"\s*-\s*(.+)$/);

						if (match) {
							quote = {
								text: match[1],
								author: match[2],
							};
						} else {
							// Fallback parsing if format is different
							quote = {
								text: quoteString.replace(/^"|"$/g, ""), // Remove quotes
								author: "Unknown",
							};
						}
					}
				} else {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (error) {
				console.log("Error fetching quote from JSON GPT API:", error);

				// Try quotable.io as fallback
				try {
					const fallbackResponse = await fetch(
						"https://api.quotable.io/random?tags=motivational,inspirational,success",
						{
							headers: {
								accept: "application/json",
							},
						}
					);

					if (fallbackResponse.ok) {
						const fallbackData = await fallbackResponse.json();
						quote = {
							text: fallbackData.content,
							author: fallbackData.author,
						};
					}
				} catch (fallbackError) {
					console.log("Fallback API also failed, using local quote");
				}
			} // Fallback quote if API fails
			if (!quote) {
				quote =
					fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
			}

			// Broadcast notification to all connected clients
			const broadcastNotification = (global as any).broadcastNotification;
			if (broadcastNotification) {
				broadcastNotification({
					type: "session_started",
					data: {
						id: session.id,
						subject: session.subject,
						duration: session.duration,
						startTime: session.startTime,
						message: `📚 Study session "${session.subject}" has started!`,
						quote: quote,
					},
				});
			}

			console.log(`📚 Session "${session.subject}" has started automatically!`);
		} catch (error) {
			console.error(`Error starting session ${session.id}:`, error);
		}
	}

	private async completeSession(session: StudySession) {
		try {
			console.log(
				`✅ Auto-completing session: ${session.subject} (${session.duration} minutes completed)`
			);

			// Mark session as completed
			await storage.updateStudySession(session.id, {
				isActive: false,
				isCompleted: true,
				completedAt: new Date(),
			});

			// Create progress record for the completed session
			await storage.createSessionProgress({
				sessionId: session.id,
				studiedMinutes: session.duration,
				date: new Date(),
			});

			// Broadcast notification to all connected clients
			const broadcastNotification = (global as any).broadcastNotification;
			if (broadcastNotification) {
				broadcastNotification({
					type: "session_completed",
					data: {
						id: session.id,
						subject: session.subject,
						duration: session.duration,
						message: `🎉 Study session "${session.subject}" completed! Great job!`,
						minutesStudied: session.duration,
					},
				});
			}

			console.log(`🎉 Session "${session.subject}" completed automatically!`);
		} catch (error) {
			console.error(`Error completing session ${session.id}:`, error);
		}
	}
	public stopScheduler() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
			console.log("🛑 Session scheduler stopped");
		}
	}
}

export const sessionScheduler = new SessionScheduler();
