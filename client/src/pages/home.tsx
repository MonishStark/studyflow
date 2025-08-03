/** @format */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	format,
	isToday,
	startOfWeek,
	endOfWeek,
	isWithinInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { StudySession } from "@shared/schema";
import { MotivationalQuote } from "@/components/motivational-quote";
import { StudySessionCard } from "@/components/study-session-card";
import { ActiveSession } from "@/components/active-session";
import { WeeklyProgress } from "@/components/weekly-progress";
import { MusicPlayer } from "@/components/music-player";
import { FloatingActionButton } from "@/components/floating-action-button";
import { ScheduleModal } from "@/components/schedule-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/use-audio";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Home() {
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { playNotification } = useNotificationSound();
	const { t } = useTranslation();

	const [selectedView, setSelectedView] = useState<"today" | "week">("today");

	const { data: allSessions = [] } = useQuery<StudySession[]>({
		queryKey: ["/api/study-sessions"],
		refetchInterval: 5000, // Refetch sessions regularly
		refetchOnWindowFocus: true,
	});

	const { data: activeSession } = useQuery<StudySession | null>({
		queryKey: ["/api/study-sessions/active"],
		refetchInterval: 3000, // Check every 3 seconds
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		refetchIntervalInBackground: true,
		staleTime: 0, // Always consider data stale
		retry: 3,
	});

	// Filter sessions based on selected view
	const filteredSessions = allSessions.filter((session) => {
		const sessionDate = new Date(session.startDate);

		if (selectedView === "today") {
			return isToday(sessionDate);
		} else {
			// Show current week
			const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
			const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
			return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
		}
	});

	// Group sessions by date for better display
	const sessionsByDate = filteredSessions.reduce((acc, session) => {
		const dateKey = format(new Date(session.startDate), "yyyy-MM-dd");
		if (!acc[dateKey]) {
			acc[dateKey] = [];
		}
		acc[dateKey].push(session);
		return acc;
	}, {} as Record<string, StudySession[]>);

	// Check for sessions that should be starting
	useEffect(() => {
		const now = new Date();
		const sessionsAboutToStart = filteredSessions.filter(
			(session: StudySession) => {
				if (session.isActive || session.isCompleted) return false;

				const [hours, minutes] = session.startTime.split(":").map(Number);
				const sessionStartTime = new Date();
				sessionStartTime.setHours(hours, minutes, 0, 0);

				const timeDiff = sessionStartTime.getTime() - now.getTime();
				return timeDiff >= 0 && timeDiff < 120000; // Within 2 minutes of start time
			}
		);

		if (sessionsAboutToStart.length > 0) {
			console.log("Sessions about to start:", sessionsAboutToStart);
			// Force refresh the active session query
			queryClient.invalidateQueries({
				queryKey: ["/api/study-sessions/active"],
			});
		}
	}, [filteredSessions, queryClient]);

	const updateSessionMutation = useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<StudySession>;
		}) => {
			const response = await apiRequest(
				"PATCH",
				`/api/study-sessions/${id}`,
				updates
			);
			return response.json();
		},
		onSuccess: () => {
			// Invalidate both sessions and active session queries
			queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
			queryClient.invalidateQueries({
				queryKey: ["/api/study-sessions/active"],
			});
			// Force refetch immediately
			queryClient.refetchQueries({ queryKey: ["/api/study-sessions/active"] });
		},
	});

	const handleSessionComplete = () => {
		if (!activeSession) return;

		playNotification();
		toast({
			title: "Study Session Complete!",
			description: `Great job completing your ${activeSession.subject} session!`,
		});

		updateSessionMutation.mutate({
			id: activeSession.id,
			updates: {
				isActive: false,
				isCompleted: true,
				completedAt: new Date(),
			},
		});
	};

	const handleSessionPause = () => {
		if (!activeSession) return;

		updateSessionMutation.mutate({
			id: activeSession.id,
			updates: { isActive: false },
		});
	};

	const handleSessionStop = () => {
		if (!activeSession) return;

		updateSessionMutation.mutate({
			id: activeSession.id,
			updates: { isActive: false },
		});
	};

	const handleSessionClick = (session: StudySession) => {
		if (session.isCompleted || session.isActive) return;

		// Start the session
		updateSessionMutation.mutate({
			id: session.id,
			updates: { isActive: true },
		});

		toast({
			title: t("sessionStarted"),
			description: t("startingStudySession", { subject: session.subject }),
		});
	};

	return (
		<div className='mobile-container'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b border-neutral-100 px-4 py-3 sticky top-0 z-50'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-3'>
						<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
							<span className='text-white text-sm font-bold'>Z</span>
						</div>
						<h1 className='text-lg font-semibold text-neutral-900'>Ziloss</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className='pb-20 px-4'>
				{/* Active Session */}
				{activeSession && (
					<ActiveSession
						session={activeSession}
						onSessionComplete={handleSessionComplete}
						onSessionPause={handleSessionPause}
						onSessionStop={handleSessionStop}
					/>
				)}

				{/* Motivational Quote */}
				<MotivationalQuote
					session={activeSession}
					useApiQuote={!!activeSession}
				/>

				{/* Sessions */}
				<section className='mb-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-neutral-900'>
							{selectedView === "today"
								? t("todaySessions")
								: t("thisWeekSessions")}
						</h3>
						<div className='flex space-x-2'>
							<Button
								variant={selectedView === "today" ? "default" : "outline"}
								size='sm'
								onClick={() => setSelectedView("today")}
								className='text-xs'>
								{t("today")}
							</Button>
							<Button
								variant={selectedView === "week" ? "default" : "outline"}
								size='sm'
								onClick={() => setSelectedView("week")}
								className='text-xs'>
								{t("week")}
							</Button>
						</div>
					</div>

					<div className='space-y-4'>
						{Object.keys(sessionsByDate).length > 0 ? (
							Object.entries(sessionsByDate)
								.sort(([a], [b]) => a.localeCompare(b))
								.map(([dateKey, sessions]) => (
									<div key={dateKey} className='space-y-2'>
										<div className='flex items-center space-x-2'>
											<h4 className='text-sm font-medium text-neutral-700'>
												{format(new Date(dateKey), "MMM d, yyyy")}
											</h4>
											{isToday(new Date(dateKey)) && (
												<span className='text-xs bg-primary/10 text-primary px-2 py-1 rounded-full'>
													Today
												</span>
											)}
										</div>
										<div className='space-y-2'>
											{sessions.map((session: StudySession) => (
												<StudySessionCard
													key={session.id}
													session={session}
													onSessionClick={handleSessionClick}
												/>
											))}
										</div>
									</div>
								))
						) : (
							<div className='text-center py-8 text-neutral-500'>
								<p className='text-sm'>
									{t("noSessionsScheduled")}{" "}
									{selectedView === "today" ? t("today") : t("thisWeek")}
								</p>
								<p className='text-xs mt-1'>{t("tapToCreateSession")}</p>
							</div>
						)}
					</div>
				</section>

				{/* Weekly Progress */}
				<WeeklyProgress />

				{/* Music Player */}
				<MusicPlayer />
			</main>

			{/* Floating Action Button */}
			<FloatingActionButton onClick={() => setIsScheduleModalOpen(true)} />

			{/* Schedule Modal */}
			<ScheduleModal
				isOpen={isScheduleModalOpen}
				onClose={() => setIsScheduleModalOpen(false)}
			/>
		</div>
	);
}
