/** @format */

import { useState } from "react";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTimer } from "@/hooks/use-timer";
import { useNotificationSound } from "@/hooks/use-audio";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";

const timerPresets = [
	{ label: "Pomodoro", value: 25 },
	{ label: "Short Break", value: 5 },
	{ label: "Long Break", value: 15 },
	{ label: "30 Minutes", value: 30 },
	{ label: "45 Minutes", value: 45 },
	{ label: "1 Hour", value: 60 },
	{ label: "90 Minutes", value: 90 },
	{ label: "2 Hours", value: 120 },
];

export default function Timer() {
	const [selectedDuration, setSelectedDuration] = useState(25);
	const { toast } = useToast();
	const { playNotification } = useNotificationSound();
	const { t } = useTranslation();

	const {
		formattedTime,
		progress,
		isRunning,
		isPaused,
		isCompleted,
		start,
		pause,
		resume,
		stop,
		reset,
	} = useTimer({
		initialDuration: selectedDuration,
		onComplete: () => {
			playNotification();
			toast({
				title: t("timerComplete"),
				description: t("timeForBreak"),
			});
		},
	});

	const handleDurationChange = (value: string) => {
		const duration = parseInt(value);
		setSelectedDuration(duration);
		reset(duration);
	};

	const handleStartPause = () => {
		if (isRunning) {
			pause();
		} else if (isPaused) {
			resume();
		} else {
			start();
		}
	};

	const handleReset = () => {
		reset(selectedDuration);
	};

	// Calculate stroke-dashoffset for progress circle
	const circumference = 2 * Math.PI * 120; // radius = 120
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	return (
		<div className='mobile-container'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b border-neutral-100 px-4 py-3 sticky top-0 z-50'>
				<div className='text-center'>
					<h1 className='text-lg font-semibold text-neutral-900'>
						{t("focusTimer")}
					</h1>
				</div>
			</header>

			{/* Timer Interface */}
			<main className='pb-20 px-4 py-8'>
				<div className='text-center'>
					{/* Duration Selector */}
					<div className='mb-8'>
						<label className='block text-sm font-medium text-neutral-700 mb-2'>
							{t("timerDuration")}
						</label>
						<Select
							value={selectedDuration.toString()}
							onValueChange={handleDurationChange}
							disabled={isRunning || isPaused}>
							<SelectTrigger className='w-full max-w-xs mx-auto'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{timerPresets.map((preset) => (
									<SelectItem
										key={preset.value}
										value={preset.value.toString()}>
										{preset.label} ({preset.value}m)
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Timer Display */}
					<div className='relative w-64 h-64 mx-auto mb-8'>
						<svg
							className='w-64 h-64 transform -rotate-90'
							viewBox='0 0 256 256'>
							<circle
								cx='128'
								cy='128'
								r='120'
								stroke='hsl(214, 32%, 91%)'
								strokeWidth='8'
								fill='none'
							/>
							<circle
								cx='128'
								cy='128'
								r='120'
								stroke='hsl(245, 85%, 63%)'
								strokeWidth='8'
								fill='none'
								strokeDasharray={circumference}
								strokeDashoffset={strokeDashoffset}
								strokeLinecap='round'
								className='timer-circle transition-all duration-1000'
							/>
						</svg>
						<div className='absolute inset-0 flex flex-col items-center justify-center'>
							<span className='text-4xl font-bold text-neutral-900 mb-2'>
								{formattedTime}
							</span>
							<span className='text-sm text-neutral-500'>
								{isCompleted
									? "Complete!"
									: isRunning
									? "Focus Time"
									: isPaused
									? "Paused"
									: "Ready to Start"}
							</span>
						</div>
					</div>

					{/* Timer Controls */}
					<div className='flex justify-center space-x-4 mb-8'>
						<Button
							onClick={handleStartPause}
							className='w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg'
							size='icon'
							disabled={isCompleted}>
							{isRunning ? <Pause size={24} /> : <Play size={24} />}
						</Button>

						<Button
							onClick={stop}
							variant='outline'
							className='w-16 h-16 rounded-full border-2'
							size='icon'
							disabled={!isRunning && !isPaused && !isCompleted}>
							<Square size={20} />
						</Button>

						<Button
							onClick={handleReset}
							variant='outline'
							className='w-16 h-16 rounded-full border-2'
							size='icon'>
							<RotateCcw size={20} />
						</Button>
					</div>

					{/* Timer Status */}
					<div className='bg-white border border-neutral-200 rounded-xl p-6 shadow-sm'>
						<h3 className='font-medium text-neutral-900 mb-4'>
							{t("sessionInfo")}
						</h3>
						<div className='grid grid-cols-2 gap-4 text-center'>
							<div>
								<p className='text-2xl font-bold text-primary'>
									{Math.round(progress)}%
								</p>
								<p className='text-xs text-neutral-500'>{t("progress")}</p>
							</div>
							<div>
								<p className='text-2xl font-bold text-secondary'>
									{selectedDuration}m
								</p>
								<p className='text-xs text-neutral-500'>{t("duration")}</p>
							</div>
						</div>
					</div>

					{/* Quick Tips */}
					<div className='mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4'>
						<h4 className='font-medium text-blue-900 mb-2'>
							💡 {t("focusTips")}
						</h4>
						<ul className='text-sm text-blue-700 space-y-1 text-left'>
							<li>• {t("removeDistractions")}</li>
							<li>• {t("usePomodoro")}</li>
							<li>• {t("stayHydrated")}</li>
							<li>• {t("takeBreaks")}</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);
}
