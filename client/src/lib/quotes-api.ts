/** @format */

interface Quote {
	text: string;
	author: string;
}

interface QuotesResponse {
	quotes: Quote[];
}

export async function fetchInspirationalQuote(): Promise<Quote | null> {
	try {
		const response = await fetch(
			"https://api.jsongpt.com/json?prompt=Generate 1 inspiration quote for studies with the author name &quotes=array of quotes",
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: QuotesResponse = await response.json();

		if (data.quotes && data.quotes.length > 0) {
			return data.quotes[0];
		}

		return null;
	} catch (error) {
		console.error("Error fetching inspirational quote:", error);
		// Return a fallback quote if API fails
		return {
			text: "Success is the sum of small efforts, repeated day in and day out.",
			author: "Robert Collier",
		};
	}
}

// Fallback quotes in case API is unavailable
export const fallbackQuotes: Quote[] = [
	{
		text: "The expert in anything was once a beginner.",
		author: "Helen Hayes",
	},
	{
		text: "Success is the sum of small efforts, repeated day in and day out.",
		author: "Robert Collier",
	},
	{
		text: "Education is the most powerful weapon which you can use to change the world.",
		author: "Nelson Mandela",
	},
	{
		text: "The beautiful thing about learning is that no one can take it away from you.",
		author: "B.B. King",
	},
	{
		text: "Study while others are sleeping; work while others are loafing.",
		author: "William A. Ward",
	},
];

export function getRandomFallbackQuote(): Quote {
	const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
	return fallbackQuotes[randomIndex];
}
