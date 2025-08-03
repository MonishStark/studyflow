/** @format */

export interface MusicTrack {
	id: string;
	title: string;
	artist: string;
	audioUrl: string;
	imageUrl: string;
	description: string;
}

// Always use local music files (both dev and production)
export const musicTracks: MusicTrack[] = [
	{
		id: "chill-lofi-study",
		title: "Chill Lofi Study Music",
		artist: "Focus Sounds",
		audioUrl: "/music/chill-lofi-study-music-381035.mp3",
		imageUrl:
			"https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
		description: "Chill lofi beats perfect for studying sessions",
	},
	{
		id: "lofi-slow-days",
		title: "Lofi Songs for Slow Days",
		artist: "Relaxed Beats",
		audioUrl: "/music/lofi songs for slow days.mp3",
		imageUrl:
			"https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
		description: "Gentle lofi songs perfect for slow, peaceful study days",
	},
];

export function getMusicTrackById(id: string): MusicTrack | undefined {
	return musicTracks.find((track) => track.id === id);
}

export function getDefaultMusicTrack(): MusicTrack {
	return musicTracks[0]; // chill-lofi-study as default
}

export function getRandomMusicTrack(): MusicTrack {
	const randomIndex = Math.floor(Math.random() * musicTracks.length);
	return musicTracks[randomIndex];
}
