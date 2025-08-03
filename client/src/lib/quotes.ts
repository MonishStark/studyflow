/** @format */

export interface MotivationalQuote {
	text: string;
	author: string;
}

// Fallback quotes in case API is unavailable
export const fallbackQuotes: MotivationalQuote[] = [
	{
		text: "Success is the sum of small efforts repeated day in and day out.",
		author: "Robert Collier",
	},
	{
		text: "The future belongs to those who believe in the beauty of their dreams.",
		author: "Eleanor Roosevelt",
	},
	{
		text: "Don't watch the clock; do what it does. Keep going.",
		author: "Sam Levenson",
	},
	{
		text: "The only way to do great work is to love what you do.",
		author: "Steve Jobs",
	},
	{
		text: "Believe you can and you're halfway there.",
		author: "Theodore Roosevelt",
	},
	{
		text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
		author: "Winston Churchill",
	},
	{
		text: "The only impossible journey is the one you never begin.",
		author: "Tony Robbins",
	},
	{
		text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
		author: "Ralph Waldo Emerson",
	},
	{
		text: "The way to get started is to quit talking and begin doing.",
		author: "Walt Disney",
	},
	{
		text: "Your limitation—it's only your imagination.",
		author: "Unknown",
	},
];

// Cache for API quotes to avoid excessive API calls
let cachedQuote: MotivationalQuote | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

async function fetchQuoteFromAPI(): Promise<MotivationalQuote | null> {
	try {
		// Use JSON GPT API (working API as shown in Postman)
		const response = await fetch(
			"https://api.jsongpt.com/json?prompt=Generate 1 inspiration quote for studies with the author name &quotes=array of quotes",
			{
				headers: {
					accept: "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// Parse the quote format: "quote text" - Author Name
		if (data.quotes && data.quotes.length > 0) {
			const quoteString = data.quotes[0];
			const match = quoteString.match(/^"(.+?)"\s*-\s*(.+)$/);

			if (match) {
				return {
					text: match[1],
					author: match[2],
				};
			} else {
				// Fallback parsing if format is different
				return {
					text: quoteString.replace(/^"|"$/g, ""), // Remove quotes
					author: "Unknown",
				};
			}
		}

		return null;
	} catch (error) {
		console.error("Error fetching quote from JSON GPT API:", error);

		// Try quotable.io as fallback
		try {
			const fallbackResponse = await fetch(
				"https://api.quotable.io/random?tags=motivational,inspirational,success",
				{
					headers: {
						accept: "application/json",
					},
				}
			);

			if (fallbackResponse.ok) {
				const fallbackData = await fallbackResponse.json();
				return {
					text: fallbackData.content,
					author: fallbackData.author,
				};
			}
		} catch (fallbackError) {
			console.error("Fallback API also failed:", fallbackError);
		}

		return null;
	}
}

export async function getRandomQuote(): Promise<MotivationalQuote> {
	// Try to get quote from API
	const apiQuote = await fetchQuoteFromAPI();

	if (apiQuote) {
		return apiQuote;
	}

	// Fallback to local quotes if API fails
	const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
	return fallbackQuotes[randomIndex];
}

export async function getDailyQuote(): Promise<MotivationalQuote> {
	// Check if we have a cached quote that's still valid
	const now = Date.now();
	if (cachedQuote && now - cacheTimestamp < CACHE_DURATION) {
		return cachedQuote;
	}

	// Try to get fresh quote from API
	const apiQuote = await fetchQuoteFromAPI();

	if (apiQuote) {
		cachedQuote = apiQuote;
		cacheTimestamp = now;
		return apiQuote;
	}

	// Fallback to deterministic daily quote from local quotes
	const today = new Date();
	const dayOfYear = Math.floor(
		(today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
	);
	const index = dayOfYear % fallbackQuotes.length;
	return fallbackQuotes[index];
}

// Synchronous fallback for backward compatibility
export function getDailyQuoteSync(): MotivationalQuote {
	// If we have a cached quote, return it
	if (cachedQuote && Date.now() - cacheTimestamp < CACHE_DURATION) {
		return cachedQuote;
	}

	// Otherwise return deterministic daily quote from fallback quotes
	const today = new Date();
	const dayOfYear = Math.floor(
		(today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
	);
	const index = dayOfYear % fallbackQuotes.length;
	return fallbackQuotes[index];
}
