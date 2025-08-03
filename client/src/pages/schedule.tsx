/** @format */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudySession } from "@shared/schema";
import { StudySessionCard } from "@/components/study-session-card";
import { FloatingActionButton } from "@/components/floating-action-button";
import { ScheduleModal } from "@/components/schedule-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Schedule() {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const { data: allSessions = [] } = useQuery<StudySession[]>({
		queryKey: ["/api/study-sessions"],
	});

	const selectedDateSessions = allSessions.filter((session) =>
		isSameDay(new Date(session.startDate), selectedDate)
	);

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
			queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
		},
	});

	const deleteSessionMutation = useMutation({
		mutationFn: async (id: string) => {
			await apiRequest("DELETE", `/api/study-sessions/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
			toast({
				title: t("sessionDeleted"),
				description: t("sessionRemovedFromSchedule"),
			});
		},
	});

	const cancelSessionMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await apiRequest(
				"PATCH",
				`/api/study-sessions/${id}/cancel`
			);
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
			toast({
				title: t("sessionCanceled"),
				description: t("sessionHasBeenCanceled"),
			});
		},
	});

	const handleSessionClick = (session: StudySession) => {
		// For now, just show session details
		toast({
			title: session.subject,
			description: `${session.duration} ${t("minutes")} • ${session.startTime}`,
		});
	};

	const handleCancelSession = (session: StudySession) => {
		cancelSessionMutation.mutate(session.id);
	};

	const navigateDate = (direction: "prev" | "next") => {
		if (direction === "prev") {
			setSelectedDate((prev) => subDays(prev, 1));
		} else {
			setSelectedDate((prev) => addDays(prev, 1));
		}
	};

	const isToday = isSameDay(selectedDate, new Date());

	return (
		<div className='mobile-container'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b border-neutral-100 px-4 py-3 sticky top-0 z-50'>
				<div className='flex items-center justify-between'>
					<h1 className='text-lg font-semibold text-neutral-900'>
						{t("schedule")}
					</h1>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setSelectedDate(new Date())}
						className='text-primary'>
						{t("today")}
					</Button>
				</div>
			</header>

			{/* Date Navigator */}
			<div className='px-4 py-4 bg-white border-b border-neutral-100'>
				<div className='flex items-center justify-between'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => navigateDate("prev")}
						className='h-10 w-10'>
						<ChevronLeft size={20} />
					</Button>

					<div className='text-center'>
						<h2 className='text-xl font-semibold text-neutral-900'>
							{format(selectedDate, "EEEE")}
						</h2>
						<p className='text-sm text-neutral-500'>
							{format(selectedDate, "MMMM d, yyyy")}
							{isToday && " • Today"}
						</p>
					</div>

					<Button
						variant='ghost'
						size='icon'
						onClick={() => navigateDate("next")}
						className='h-10 w-10'>
						<ChevronRight size={20} />
					</Button>
				</div>
			</div>

			{/* Sessions List */}
			<main className='pb-20 px-4 py-6'>
				<div className='space-y-3'>
					{selectedDateSessions.length > 0 ? (
						selectedDateSessions
							.sort((a, b) => a.startTime.localeCompare(b.startTime))
							.map((session) => (
								<StudySessionCard
									key={session.id}
									session={session}
									onSessionClick={handleSessionClick}
									onCancelSession={handleCancelSession}
								/>
							))
					) : (
						<div className='text-center py-12'>
							<div className='w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<Plus className='text-neutral-400' size={24} />
							</div>
							<h3 className='text-lg font-medium text-neutral-900 mb-2'>
								{t("noSessionsScheduled")}
							</h3>
							<p className='text-sm text-neutral-500 mb-6'>
								{isToday
									? t("noSessionsToday")
									: t("noSessionsForDate", {
											date: format(selectedDate, "MMMM d"),
									  })}
							</p>
							<Button
								onClick={() => setIsScheduleModalOpen(true)}
								className='bg-primary hover:bg-primary/90 text-white'>
								<Plus size={16} className='mr-2' />
								{t("addSession")}
							</Button>
						</div>
					)}
				</div>

				{/* Session Statistics */}
				{selectedDateSessions.length > 0 && (
					<div className='mt-8 bg-white border border-neutral-200 rounded-xl p-4'>
						<h3 className='font-medium text-neutral-900 mb-3'>
							{isToday ? "Today's" : format(selectedDate, "MMMM d")} Summary
						</h3>
						<div className='grid grid-cols-3 gap-4 text-center'>
							<div>
								<p className='text-2xl font-bold text-primary'>
									{
										selectedDateSessions.filter(
											(session) => session.status !== "canceled"
										).length
									}
								</p>
								<p className='text-xs text-neutral-500'>Active</p>
							</div>
							<div>
								<p className='text-2xl font-bold text-secondary'>
									{selectedDateSessions
										.filter((session) => session.status !== "canceled")
										.reduce((sum, session) => sum + session.duration, 0)}
								</p>
								<p className='text-xs text-neutral-500'>Minutes</p>
							</div>
							<div>
								<p className='text-2xl font-bold text-accent'>
									{
										selectedDateSessions.filter(
											(session) => session.isCompleted
										).length
									}
								</p>
								<p className='text-xs text-neutral-500'>Completed</p>
							</div>
						</div>
					</div>
				)}
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
