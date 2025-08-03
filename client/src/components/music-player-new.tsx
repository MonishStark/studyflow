/** @format */

import { Play, Pause, VolumeX, Volume2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/use-audio";
import { getRandomMusicTrack } from "@/lib/music-tracks";
import { useQuery } from "@tanstack/react-query";
import { UserSettings } from "@shared/schema";
import { useState, useEffect, useCallback } from "react";

// Debounce function for volume changes
const useDebounce = (value: number, delay: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

// Internal music player component that gets remounted when track changes
function MusicPlayerInternal({
	track,
	initialVolume,
	onVolumeChange,
	onTrackChange,
	shouldAutoPlay,
}: {
	track: any;
	initialVolume: number;
	onVolumeChange: (volume: number) => void;
	onTrackChange: () => void;
	shouldAutoPlay: boolean;
}) {
	const { isPlaying, volume, isLoading, error, toggle, setVolume } = useAudio({
		src: track.audioUrl,
		loop: true,
		randomStartTime: true,
		initialVolume: initialVolume / 100,
		autoPlay: shouldAutoPlay,
	});

	// Handle volume changes
	const handleVolumeChange = useCallback(
		(value: number[]) => {
			const newVolume = value[0];
			setVolume(newVolume / 100);
			onVolumeChange(newVolume);
		},
		[setVolume, onVolumeChange]
	);

	if (error) {
		return (
			<div className='bg-white border border-neutral-200 rounded-xl p-4 shadow-sm'>
				<p className='text-sm text-red-500'>Failed to load music player</p>
			</div>
		);
	}

	return (
		<div className='bg-white border border-neutral-200 rounded-xl p-4 shadow-sm'>
			<div className='flex items-center space-x-4'>
				<img
					src={track.imageUrl}
					alt={track.title}
					className='w-12 h-12 rounded-lg object-cover'
				/>
				<div className='flex-1'>
					<h4 className='font-medium text-neutral-900'>{track.title}</h4>
					<p className='text-sm text-neutral-500'>{track.artist}</p>
					<p className='text-xs text-neutral-400 mt-1'>{track.description}</p>
					<p className='text-xs text-primary mt-1 font-medium'>
						🎵 Random Track • Random Start Time
					</p>
				</div>
				<div className='flex items-center space-x-2'>
					<Button
						onClick={onTrackChange}
						variant='outline'
						size='icon'
						className='w-8 h-8 rounded-full'
						title='Next random track'>
						<SkipForward size={12} />
					</Button>
					<Button
						onClick={toggle}
						className='w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-white'
						size='icon'
						disabled={isLoading}>
						{isLoading ? (
							<div className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
						) : isPlaying ? (
							<Pause className='text-white' size={12} />
						) : (
							<Play className='text-white' size={12} />
						)}
					</Button>
				</div>
			</div>

			{/* Volume Control */}
			<div className='mt-4 flex items-center space-x-3'>
				<VolumeX className='text-neutral-400' size={16} />
				<div className='flex-1'>
					<Slider
						value={[Math.round(volume * 100)]}
						onValueChange={handleVolumeChange}
						max={100}
						step={1}
						className='w-full'
					/>
				</div>
				<Volume2 className='text-neutral-400' size={16} />
			</div>
		</div>
	);
}

export function MusicPlayer() {
	const [currentTrack, setCurrentTrack] = useState(() => getRandomMusicTrack());
	const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
	const [currentVolume, setCurrentVolume] = useState(60);

	const { data: settings } = useQuery<UserSettings>({
		queryKey: ["/api/user-settings"],
	});

	// Set initial volume from settings
	useEffect(() => {
		if (settings?.musicVolume !== undefined && settings.musicVolume !== null) {
			setCurrentVolume(settings.musicVolume);
		}
	}, [settings?.musicVolume]);

	const debouncedVolume = useDebounce(currentVolume, 500);

	// Update backend when debounced volume changes
	useEffect(() => {
		if (settings?.musicVolume !== debouncedVolume) {
			fetch("/api/user-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ musicVolume: debouncedVolume }),
			});
		}
	}, [debouncedVolume, settings?.musicVolume]);

	const handleVolumeChange = useCallback((volume: number) => {
		setCurrentVolume(volume);
	}, []);

	const handleTrackChange = useCallback(() => {
		setShouldAutoPlay(true); // Auto-play the new track

		const newTrack = getRandomMusicTrack();
		// Make sure we don't get the same track
		if (newTrack.id !== currentTrack.id) {
			setCurrentTrack(newTrack);
		} else {
			// If we got the same track, try again
			setCurrentTrack(getRandomMusicTrack());
		}
	}, [currentTrack.id]);

	// Reset auto-play after track changes
	useEffect(() => {
		if (shouldAutoPlay) {
			const timer = setTimeout(() => setShouldAutoPlay(false), 1000);
			return () => clearTimeout(timer);
		}
	}, [currentTrack.id, shouldAutoPlay]);

	return (
		<section className='mb-6'>
			<h3 className='text-lg font-semibold text-neutral-900 mb-4'>
				Study Music
			</h3>
			<MusicPlayerInternal
				key={currentTrack.id} // Force remount when track changes
				track={currentTrack}
				initialVolume={currentVolume}
				onVolumeChange={handleVolumeChange}
				onTrackChange={handleTrackChange}
				shouldAutoPlay={shouldAutoPlay}
			/>
		</section>
	);
}
