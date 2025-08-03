/** @format */

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationEvent {
	type: string;
	data?: any;
}

export function useNotifications() {
	const { toast } = useToast();
	const eventSourceRef = useRef<EventSource | null>(null);

	const handleNotification = useCallback(
		(event: NotificationEvent) => {
			switch (event.type) {
				case "session_started":
					const quote = event.data?.quote;
					const quoteText = quote
						? `\n\n💡 "${quote.text}" - ${quote.author}`
						: "";

					// Show notification with quote
					toast({
						title: "Study Session Started! 📚",
						description: (
							<div className='space-y-2'>
								<p>
									{event.data?.message ||
										"Your scheduled study session has begun"}
								</p>
								{quote && (
									<div className='border-l-2 border-blue-300 pl-3 py-2 bg-blue-50 rounded'>
										<p className='italic text-sm text-blue-800'>
											"{quote.text}"
										</p>
										<p className='text-xs text-blue-600 font-medium'>
											- {quote.author}
										</p>
									</div>
								)}
							</div>
						),
						duration: 8000, // Show longer to read the quote
					});

					// Request browser notification permission and show notification
					if (
						"Notification" in window &&
						Notification.permission === "granted"
					) {
						const notificationBody = `${
							event.data?.message || "Your scheduled study session has begun"
						}${quoteText}`;
						new Notification("Ziloss - Session Started", {
							body: notificationBody,
							icon: "/favicon.ico",
							tag: "session-start",
						});
					} else if (
						"Notification" in window &&
						Notification.permission !== "denied"
					) {
						Notification.requestPermission().then((permission) => {
							if (permission === "granted") {
								const notificationBody = `${
									event.data?.message ||
									"Your scheduled study session has begun"
								}${quoteText}`;
								new Notification("Ziloss - Session Started", {
									body: notificationBody,
									icon: "/favicon.ico",
									tag: "session-start",
								});
							}
						});
					}

					// Play notification sound (optional)
					try {
						const audio = new Audio("/notification-sound.mp3");
						audio.volume = 0.3;
						audio.play().catch(() => {
							// Ignore audio play errors (user might not have interacted with page yet)
						});
					} catch (error) {
						// Ignore audio errors
					}
					break;

				case "session_completed":
					toast({
						title: "Session Complete! 🎉",
						description:
							event.data?.message || "Great job finishing your study session!",
						duration: 5000,
					});

					// Browser notification for completion
					if (
						"Notification" in window &&
						Notification.permission === "granted"
					) {
						new Notification("Ziloss - Session Complete", {
							body:
								event.data?.message ||
								"Great job finishing your study session!",
							icon: "/favicon.ico",
							tag: "session-complete",
						});
					}
					break;

				case "connected":
					console.log("Connected to notification service");
					break;

				default:
					console.log("Unknown notification type:", event.type);
			}
		},
		[toast]
	);

	useEffect(() => {
		// Create EventSource connection
		const eventSource = new EventSource("/api/events");
		eventSourceRef.current = eventSource;

		eventSource.onmessage = (event) => {
			try {
				const notification = JSON.parse(event.data);
				handleNotification(notification);
			} catch (error) {
				console.error("Error parsing notification:", error);
			}
		};

		eventSource.onerror = (error) => {
			console.error("EventSource error:", error);
		};

		// Request notification permission on mount
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission();
		}

		return () => {
			eventSource.close();
		};
	}, [handleNotification]);

	return {
		// You can add methods here if needed
	};
}

// Also export as default for compatibility
export default useNotifications;
