/** @format */

import { useState, useEffect, useRef, useCallback } from "react";

interface AudioState {
	isPlaying: boolean;
	volume: number;
	duration: number;
	currentTime: number;
	isLoading: boolean;
	error: string | null;
}

interface UseAudioProps {
	src: string;
	loop?: boolean;
	autoPlay?: boolean;
	initialVolume?: number;
	randomStartTime?: boolean;
}

export function useAudio({
	src,
	loop = false,
	autoPlay = false,
	initialVolume = 0.6,
	randomStartTime = false,
}: UseAudioProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [audioState, setAudioState] = useState<AudioState>({
		isPlaying: false,
		volume: initialVolume,
		duration: 0,
		currentTime: 0,
		isLoading: false,
		error: null,
	});

	// Initialize audio element
	useEffect(() => {
		const audio = new Audio(src);
		audio.loop = loop;
		audio.volume = initialVolume;
		audio.preload = "metadata";

		audioRef.current = audio;

		const handleLoadStart = () => {
			setAudioState((prev) => ({ ...prev, isLoading: true, error: null }));
		};

		const handleLoadedMetadata = () => {
			setAudioState((prev) => ({
				...prev,
				duration: audio.duration,
				isLoading: false,
			}));

			// Set random start time if enabled
			if (randomStartTime && audio.duration > 0) {
				const randomTime = Math.random() * Math.max(0, audio.duration - 30); // Start at least 30s before end
				audio.currentTime = randomTime;
			}
		};

		const handleCanPlay = () => {
			setAudioState((prev) => ({ ...prev, isLoading: false }));
			if (autoPlay) {
				// Add a small delay to ensure the audio is fully ready
				setTimeout(() => {
					audio.play().catch((error) => {
						console.warn("Autoplay failed:", error);
						setAudioState((prev) => ({
							...prev,
							error: null, // Don't show error for autoplay failures
							isPlaying: false,
						}));
					});
				}, 100);
			}
		};

		const handleTimeUpdate = () => {
			setAudioState((prev) => ({
				...prev,
				currentTime: audio.currentTime,
			}));
		};

		const handlePlay = () => {
			setAudioState((prev) => ({ ...prev, isPlaying: true }));
		};

		const handlePause = () => {
			setAudioState((prev) => ({ ...prev, isPlaying: false }));
		};

		const handleEnded = () => {
			setAudioState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
		};

		const handleError = () => {
			setAudioState((prev) => ({
				...prev,
				error: "Failed to load audio",
				isLoading: false,
				isPlaying: false,
			}));
		};

		const handleVolumeChange = () => {
			setAudioState((prev) => ({ ...prev, volume: audio.volume }));
		};

		audio.addEventListener("loadstart", handleLoadStart);
		audio.addEventListener("loadedmetadata", handleLoadedMetadata);
		audio.addEventListener("canplay", handleCanPlay);
		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);
		audio.addEventListener("volumechange", handleVolumeChange);

		return () => {
			audio.removeEventListener("loadstart", handleLoadStart);
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
			audio.removeEventListener("volumechange", handleVolumeChange);
			audio.pause();
		};
	}, [src, loop, autoPlay, randomStartTime]); // Removed initialVolume from dependencies

	const play = useCallback(async () => {
		if (!audioRef.current) return;

		try {
			// Ensure the audio is ready before playing
			if (audioRef.current.readyState >= 2) {
				// HAVE_CURRENT_DATA or higher
				await audioRef.current.play();
			} else {
				// Wait for the audio to be ready
				const playWhenReady = () => {
					audioRef.current?.play().catch((error) => {
						console.warn("Play failed:", error);
						setAudioState((prev) => ({
							...prev,
							error: "Failed to play audio",
							isPlaying: false,
						}));
					});
				};
				audioRef.current.addEventListener("canplay", playWhenReady, {
					once: true,
				});
			}
		} catch (error) {
			console.warn("Play failed:", error);
			setAudioState((prev) => ({
				...prev,
				error: "Failed to play audio",
				isPlaying: false,
			}));
		}
	}, []);

	const pause = useCallback(() => {
		if (!audioRef.current) return;
		audioRef.current.pause();
	}, []);

	const toggle = useCallback(() => {
		if (audioState.isPlaying) {
			pause();
		} else {
			play();
		}
	}, [audioState.isPlaying, play, pause]);

	const setVolume = useCallback((volume: number) => {
		if (!audioRef.current) return;
		const clampedVolume = Math.max(0, Math.min(1, volume));
		audioRef.current.volume = clampedVolume;
	}, []);

	const seek = useCallback(
		(time: number) => {
			if (!audioRef.current) return;
			audioRef.current.currentTime = Math.max(
				0,
				Math.min(audioState.duration, time)
			);
		},
		[audioState.duration]
	);

	const stop = useCallback(() => {
		if (!audioRef.current) return;
		audioRef.current.pause();
		audioRef.current.currentTime = 0;
	}, []);

	return {
		...audioState,
		play,
		pause,
		toggle,
		stop,
		setVolume,
		seek,
	};
}

// Hook for notification sounds
export function useNotificationSound() {
	const playNotification = useCallback(() => {
		// Create a simple beep sound using Web Audio API
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = 800; // 800 Hz
		oscillator.type = "sine";

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.001,
			audioContext.currentTime + 0.5
		);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.5);
	}, []);

	return { playNotification };
}
