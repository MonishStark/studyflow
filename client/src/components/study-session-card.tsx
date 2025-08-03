/** @format */

import { CheckCircle, PlayCircle, Clock, X } from "lucide-react";
import { StudySession } from "@shared/schema";
import { format } from "date-fns";

interface StudySessionCardProps {
	session: StudySession;
	onSessionClick?: (session: StudySession) => void;
	onCancelSession?: (session: StudySession) => void;
}

export function StudySessionCard({
	session,
	onSessionClick,
	onCancelSession,
}: StudySessionCardProps) {
	const getStatusInfo = () => {
		if (session.status === "canceled") {
			return {
				icon: X,
				label: "Canceled",
				color: "text-red-500",
				bgColor: "bg-red-50",
			};
		} else if (session.isCompleted) {
			return {
				icon: CheckCircle,
				label: "Completed",
				color: "text-secondary",
				bgColor: "bg-secondary/10",
			};
		} else if (session.isActive) {
			return {
				icon: PlayCircle,
				label: "In Progress",
				color: "text-accent",
				bgColor: "bg-accent/10",
			};
		} else {
			return {
				icon: Clock,
				label: "Upcoming",
				color: "text-neutral-400",
				bgColor: "bg-neutral-100",
			};
		}
	};

	const getSubjectColor = () => {
		if (session.status === "canceled") return "bg-red-300";
		if (session.isCompleted) return "bg-secondary";
		if (session.isActive) return "bg-accent";
		return "bg-neutral-300";
	};

	const status = getStatusInfo();
	const StatusIcon = status.icon;

	const formatTime = (startTime: string, duration: number) => {
		const [hours, minutes] = startTime.split(":").map(Number);
		const start = new Date();
		start.setHours(hours, minutes, 0, 0);

		const end = new Date(start.getTime() + duration * 60000);

		return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
	};

	return (
		<div
			className={`bg-white border border-neutral-200 rounded-xl p-4 shadow-sm transition-shadow relative ${
				session.status === "canceled"
					? "opacity-75"
					: "cursor-pointer hover:shadow-md"
			}`}
			onClick={() =>
				session.status !== "canceled" && onSessionClick?.(session)
			}>
			<div
				className={`flex items-center justify-between ${
					session.status === "canceled"
						? "line-through decoration-red-400 decoration-2"
						: ""
				}`}>
				<div className='flex items-center space-x-3'>
					<div className={`w-3 h-3 rounded-full ${getSubjectColor()}`} />
					<div>
						<h4 className='font-medium text-neutral-900'>{session.subject}</h4>
						<p className='text-sm text-neutral-500'>
							{formatTime(session.startTime, session.duration)}
						</p>
					</div>
				</div>
				<div className='flex items-center space-x-2'>
					<span
						className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
						{status.label}
					</span>
					<StatusIcon className={`${status.color} text-sm`} size={16} />
				</div>
			</div>

			{/* Cancel button for non-canceled and non-completed sessions */}
			{session.status !== "canceled" &&
				!session.isCompleted &&
				!session.isActive &&
				onCancelSession && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onCancelSession(session);
						}}
						className='absolute top-2 right-2 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors'
						title='Cancel session'>
						<X size={14} />
					</button>
				)}
		</div>
	);
}
