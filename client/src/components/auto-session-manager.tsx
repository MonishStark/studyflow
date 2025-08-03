/** @format */

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { useAudio } from "@/hooks/use-audio"; // DISABLED - music now handled by MusicPlayer
import { StudySession, UserSettings } from "@shared/schema";
// import { getMusicTrackById, getDefaultMusicTrack } from "@/lib/music-tracks"; // DISABLED

export function AutoSessionManager() {
	const queryClient = useQueryClient();
	const [activeSession, setActiveSession] = useState<StudySession | null>(null);
	const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
	const lastActiveSessionIdRef = useRef<string | null>(null);

	// Get user settings for music preferences
	const { data: settings } = useQuery<UserSettings>({
		queryKey: ["/api/user-settings"],
	});

	// Get all sessions for debugging
	const { data: allSessions } = useQuery<StudySession[]>({
		queryKey: ["/api/study-sessions"],
		refetchInterval: 5000,
	});

	// Log session state for debugging
	useEffect(() => {
		const activeSessions = allSessions?.filter((s) => s.isActive) || [];
		console.log("All active sessions from query:", activeSessions);
	}, [allSessions]);

	// Get active session with aggressive polling
	const { data: currentActiveSession, refetch: refetchActiveSession } =
		useQuery<StudySession | null>({
			queryKey: ["/api/study-sessions/active"],
			refetchInterval: 3000, // Check every 3 seconds
			refetchOnWindowFocus: true,
			refetchOnMount: true,
			refetchIntervalInBackground: true,
			staleTime: 0, // Always consider data stale
			retry: 3,
		});

	// Additional polling to catch missed updates
	useEffect(() => {
		const additionalPolling = setInterval(() => {
			refetchActiveSession();
		}, 2000); // Additional check every 2 seconds

		return () => clearInterval(additionalPolling);
	}, [refetchActiveSession]);

	// DISABLED - music track selection now handled by MusicPlayer
	// const currentTrack = settings?.selectedMusicTrack
	// 	? getMusicTrackById(settings.selectedMusicTrack) || getDefaultMusicTrack()
	// 	: getDefaultMusicTrack();

	// Audio hook for background music - DISABLED (now handled by MusicPlayer)
	// const {
	// 	isPlaying,
	// 	toggle: toggleMusic,
	// 	stop: stopMusic,
	// 	setVolume,
	// } = useAudio({
	// 	src: currentTrack.audioUrl,
	// 	loop: true,
	// 	initialVolume: (settings?.musicVolume || 60) / 100,
	// });

	// Handle session state changes
	useEffect(() => {
		const currentSessionId = currentActiveSession?.id || null;
		const lastSessionId = lastActiveSessionIdRef.current;

		console.log("Session state change detected:", {
			currentActiveSession: currentSessionId,
			lastActiveSession: lastSessionId,
			currentSubject: currentActiveSession?.subject,
		});

		// Update the ref
		lastActiveSessionIdRef.current = currentSessionId;

		if (currentActiveSession && !activeSession) {
			// New session started
			console.log("🎯 New session started:", currentActiveSession.subject);
			setActiveSession(currentActiveSession);
			// startSessionMusic(); // DISABLED - now handled by MusicPlayer
			setupSessionTimer(currentActiveSession);
		} else if (!currentActiveSession && activeSession) {
			// Session ended
			console.log("⏹️ Session ended:", activeSession.subject);
			setActiveSession(null);
			// stopSessionMusic(); // DISABLED - now handled by MusicPlayer
			clearSessionTimer();
		} else if (
			currentActiveSession &&
			activeSession &&
			currentActiveSession.id !== activeSession.id
		) {
			// Different session started
			console.log(
				"🔄 Different session started:",
				currentActiveSession.subject
			);
			setActiveSession(currentActiveSession);
			// startSessionMusic(); // DISABLED - now handled by MusicPlayer
			setupSessionTimer(currentActiveSession);
		}
	}, [currentActiveSession, activeSession]);

	// DISABLED - Music now handled by MusicPlayer component
	// const startSessionMusic = () => {
	// 	// Start background music for the session
	// 	if (!isPlaying) {
	// 		toggleMusic();
	// 	}

	// 	// Set volume based on user settings
	// 	if (settings?.musicVolume) {
	// 		setVolume(settings.musicVolume / 100);
	// 	}
	// };

	// const stopSessionMusic = () => {
	// 	// Stop background music
	// 	if (isPlaying) {
	// 		stopMusic();
	// 	}
	// };

	const setupSessionTimer = (session: StudySession) => {
		clearSessionTimer();

		// Calculate when session should end
		const endTime = new Date(session.endDate).getTime();
		const now = new Date().getTime();
		const timeUntilEnd = endTime - now;

		if (timeUntilEnd > 0) {
			sessionTimerRef.current = setTimeout(async () => {
				// Auto-complete the session
				try {
					await fetch(`/api/study-sessions/${session.id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							isActive: false,
							isCompleted: true,
							completedAt: new Date().toISOString(),
						}),
					});

					// Refresh queries
					queryClient.invalidateQueries({
						queryKey: ["/api/study-sessions/active"],
					});
					queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });

					// Stop music - DISABLED, now handled by MusicPlayer
					// stopSessionMusic();
				} catch (error) {
					console.error("Error completing session:", error);
				}
			}, timeUntilEnd);
		}
	};

	const clearSessionTimer = () => {
		if (sessionTimerRef.current) {
			clearTimeout(sessionTimerRef.current);
			sessionTimerRef.current = null;
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clearSessionTimer();
		};
	}, []);

	// This component doesn't render anything visible
	return null;
}
