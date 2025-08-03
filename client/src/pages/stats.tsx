/** @format */

import { useQuery } from "@tanstack/react-query";
import {
	format,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	subDays,
} from "date-fns";
import { TrendingUp, Clock, Target, Calendar } from "lucide-react";
import { StudySession, SessionProgress } from "@shared/schema";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Stats() {
	const { t } = useTranslation();
	const { data: allSessions = [] } = useQuery<StudySession[]>({
		queryKey: ["/api/study-sessions"],
	});

	const now = new Date();
	const weekStart = startOfWeek(now, { weekStartsOn: 1 });
	const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
	const monthStart = startOfMonth(now);
	const monthEnd = endOfMonth(now);

	const startDateStr = format(weekStart, "yyyy-MM-dd");
	const endDateStr = format(weekEnd, "yyyy-MM-dd");
	const monthStartStr = format(monthStart, "yyyy-MM-dd");
	const monthEndStr = format(monthEnd, "yyyy-MM-dd");

	const { data: weeklyProgress = [] } = useQuery<SessionProgress[]>({
		queryKey: ["/api/weekly-progress", startDateStr, endDateStr],
	});

	const { data: monthlyProgress = [] } = useQuery<SessionProgress[]>({
		queryKey: ["/api/weekly-progress", monthStartStr, monthEndStr],
	});

	// Calculate statistics
	const totalSessions = allSessions.length;
	const completedSessions = allSessions.filter(
		(session) => session.isCompleted
	).length;
	const completionRate =
		totalSessions > 0
			? Math.round((completedSessions / totalSessions) * 100)
			: 0;

	const weeklyMinutes = weeklyProgress.reduce(
		(sum, progress) => sum + (progress.studiedMinutes || 0),
		0
	);
	const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;

	const monthlyMinutes = monthlyProgress.reduce(
		(sum, progress) => sum + (progress.studiedMinutes || 0),
		0
	);
	const monthlyHours = Math.round((monthlyMinutes / 60) * 10) / 10;

	// Subject breakdown
	const subjectStats = allSessions.reduce((acc, session) => {
		if (!acc[session.subject]) {
			acc[session.subject] = { total: 0, completed: 0 };
		}
		acc[session.subject].total += session.duration;
		if (session.isCompleted) {
			acc[session.subject].completed += session.duration;
		}
		return acc;
	}, {} as Record<string, { total: number; completed: number }>);

	const topSubjects = Object.entries(subjectStats)
		.sort(([, a], [, b]) => b.completed - a.completed)
		.slice(0, 5);

	// Recent activity (last 7 days)
	const last7Days = Array.from({ length: 7 }, (_, i) => {
		const date = subDays(now, i);
		const dayProgress = weeklyProgress.filter(
			(progress) =>
				format(new Date(progress.date), "yyyy-MM-dd") ===
				format(date, "yyyy-MM-dd")
		);
		const minutes = dayProgress.reduce(
			(sum, progress) => sum + (progress.studiedMinutes || 0),
			0
		);
		return {
			date,
			minutes,
			hours: Math.round((minutes / 60) * 10) / 10,
		};
	}).reverse();

	return (
		<div className='mobile-container'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b border-neutral-100 px-4 py-3 sticky top-0 z-50'>
				<div className='text-center'>
					<h1 className='text-lg font-semibold text-neutral-900'>
						{t("statistics")}
					</h1>
				</div>
			</header>

			{/* Stats Content */}
			<main className='pb-20 px-4 py-6 space-y-6'>
				{/* Overview Cards */}
				<div className='grid grid-cols-2 gap-4'>
					<div className='bg-white border border-neutral-200 rounded-xl p-4 text-center'>
						<Clock className='w-8 h-8 text-primary mx-auto mb-2' />
						<p className='text-2xl font-bold text-neutral-900'>
							{weeklyHours}h
						</p>
						<p className='text-xs text-neutral-500'>{t("thisWeek")}</p>
					</div>

					<div className='bg-white border border-neutral-200 rounded-xl p-4 text-center'>
						<Target className='w-8 h-8 text-secondary mx-auto mb-2' />
						<p className='text-2xl font-bold text-neutral-900'>
							{completionRate}%
						</p>
						<p className='text-xs text-neutral-500'>{t("completionRate")}</p>
					</div>

					<div className='bg-white border border-neutral-200 rounded-xl p-4 text-center'>
						<Calendar className='w-8 h-8 text-accent mx-auto mb-2' />
						<p className='text-2xl font-bold text-neutral-900'>
							{monthlyHours}h
						</p>
						<p className='text-xs text-neutral-500'>{t("thisMonth")}</p>
					</div>

					<div className='bg-white border border-neutral-200 rounded-xl p-4 text-center'>
						<TrendingUp className='w-8 h-8 text-purple-500 mx-auto mb-2' />
						<p className='text-2xl font-bold text-neutral-900'>
							{completedSessions}
						</p>
						<p className='text-xs text-neutral-500'>{t("sessionsDone")}</p>
					</div>
				</div>

				{/* Weekly Activity */}
				<div className='bg-white border border-neutral-200 rounded-xl p-4'>
					<h3 className='font-medium text-neutral-900 mb-4'>
						{t("last7Days")}
					</h3>
					<div className='space-y-3'>
						{last7Days.map((day, index) => (
							<div key={index} className='flex items-center justify-between'>
								<div className='flex items-center space-x-3'>
									<div className='w-2 h-2 rounded-full bg-primary' />
									<span className='text-sm text-neutral-700'>
										{format(day.date, "EEE, MMM d")}
									</span>
								</div>
								<div className='flex items-center space-x-2'>
									<div className='w-20 bg-neutral-100 rounded-full h-2'>
										<div
											className='bg-primary h-2 rounded-full transition-all duration-300'
											style={{
												width: `${Math.min((day.hours / 4) * 100, 100)}%`,
											}}
										/>
									</div>
									<span className='text-sm font-medium text-neutral-900 w-8'>
										{day.hours}h
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Subject Breakdown */}
				<div className='bg-white border border-neutral-200 rounded-xl p-4'>
					<h3 className='font-medium text-neutral-900 mb-4'>
						{t("topSubjects")}
					</h3>
					<div className='space-y-3'>
						{topSubjects.length > 0 ? (
							topSubjects.map(([subject, stats], index) => (
								<div
									key={subject}
									className='flex items-center justify-between'>
									<div className='flex items-center space-x-3'>
										<div
											className={`w-3 h-3 rounded-full ${
												index === 0
													? "bg-primary"
													: index === 1
													? "bg-secondary"
													: index === 2
													? "bg-accent"
													: "bg-neutral-400"
											}`}
										/>
										<span className='text-sm text-neutral-700'>{subject}</span>
									</div>
									<div className='text-right'>
										<p className='text-sm font-medium text-neutral-900'>
											{Math.round((stats.completed / 60) * 10) / 10}h
										</p>
										<p className='text-xs text-neutral-500'>
											{Math.round((stats.completed / stats.total) * 100)}%{" "}
											{t("completedLowercase")}
										</p>
									</div>
								</div>
							))
						) : (
							<p className='text-sm text-neutral-500 text-center py-4'>
								{t("noStudyDataYet")}
							</p>
						)}
					</div>
				</div>

				{/* Monthly Progress */}
				<div className='bg-white border border-neutral-200 rounded-xl p-4'>
					<h3 className='font-medium text-neutral-900 mb-4'>
						{t("monthlyGoal")}
					</h3>
					<div className='text-center mb-4'>
						<p className='text-3xl font-bold text-primary mb-1'>
							{monthlyHours}h
						</p>
						<p className='text-sm text-neutral-500'>{t("of80hGoal")}</p>
					</div>
					<div className='w-full bg-neutral-100 rounded-full h-3 mb-2'>
						<div
							className='bg-primary h-3 rounded-full transition-all duration-500'
							style={{ width: `${Math.min((monthlyHours / 80) * 100, 100)}%` }}
						/>
					</div>
					<p className='text-xs text-neutral-500 text-center'>
						{Math.round((monthlyHours / 80) * 100)}% of monthly goal achieved
					</p>
				</div>

				{/* Motivation Message */}
				<div className='bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4 text-center'>
					<h4 className='font-medium text-neutral-900 mb-2'>
						{completionRate >= 80
							? "🎉 Excellent Progress!"
							: completionRate >= 60
							? "📈 Great Work!"
							: "💪 Keep Going!"}
					</h4>
					<p className='text-sm text-neutral-600'>
						{completionRate >= 80
							? "You're crushing your study goals! Keep up the amazing work."
							: completionRate >= 60
							? "You're making solid progress. Stay consistent!"
							: "Every session counts. You've got this!"}
					</p>
				</div>
			</main>
		</div>
	);
}
