/** @format */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Quote } from "lucide-react";
import { getDailyQuote, getDailyQuoteSync } from "@/lib/quotes";
import { StudySession } from "@shared/schema";

interface MotivationalQuoteProps {
	session?: StudySession | null;
	useApiQuote?: boolean;
}

export function MotivationalQuote({
	session,
	useApiQuote = false,
}: MotivationalQuoteProps) {
	const queryClient = useQueryClient();

	// Auto-refresh quotes every 1 minute
	useEffect(() => {
		const interval = setInterval(() => {
			// Invalidate the quote queries to trigger a refresh
			if (useApiQuote && session) {
				queryClient.invalidateQueries({
					queryKey: ["inspirational-quote", session.id],
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ["daily-quote"] });
			}
		}, 60000); // 1 minute

		return () => clearInterval(interval);
	}, [queryClient, useApiQuote, session]);

	// Fetch inspirational quote from API if session is active and useApiQuote is true
	const { data: apiQuote, isLoading } = useQuery({
		queryKey: ["inspirational-quote", session?.id, Date.now()], // Add timestamp for uniqueness
		queryFn: async () => {
			try {
				const response = await fetch(
					"https://api.jsongpt.com/json?prompt=Generate 1 inspiration quote for studies with the author name &quotes=array of quotes"
				);
				if (response.ok) {
					const data = await response.json();
					if (data.quotes && data.quotes.length > 0) {
						return data.quotes[0];
					}
				}
			} catch (error) {
				console.error("Failed to fetch quote:", error);
			}

			// Fallback quotes if API fails
			const fallbackQuotes = [
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
			return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
		},
		enabled: useApiQuote && !!session, // Only fetch when we want API quote and have an active session
		staleTime: 0, // Always consider data stale to allow frequent updates
		refetchInterval: 60000, // Automatically refetch every 1 minute
	});

	// Fetch daily quote from API for regular display
	const { data: dailyQuote, isLoading: isDailyLoading } = useQuery({
		queryKey: ["daily-quote", Date.now()], // Add timestamp for uniqueness
		queryFn: getDailyQuote,
		enabled: !useApiQuote || !session, // Only fetch when not using session-specific quote
		staleTime: 0, // Always consider data stale to allow frequent updates
		refetchInterval: 60000, // Automatically refetch every 1 minute
	});

	// Use API quote if available and requested, otherwise use daily quote
	const quote =
		useApiQuote && apiQuote ? apiQuote : dailyQuote || getDailyQuoteSync();
	const isActiveSessionQuote = useApiQuote && !!session && !isLoading;
	const loading = useApiQuote ? isLoading : isDailyLoading;

	return (
		<section className='mb-6'>
			<div
				className={`border rounded-xl p-4 ${
					isActiveSessionQuote
						? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
						: "bg-secondary/10 border-secondary/20"
				}`}>
				<div className='flex items-start space-x-3'>
					<Quote
						className={`text-sm mt-1 flex-shrink-0 ${
							isActiveSessionQuote ? "text-blue-500" : "text-secondary"
						}`}
						size={16}
					/>
					<div>
						{loading ? (
							<p className='text-neutral-500 text-sm italic'>
								Loading inspiration...
							</p>
						) : (
							<>
								<p
									className={`text-sm leading-relaxed ${
										isActiveSessionQuote ? "text-blue-800" : "text-neutral-700"
									}`}>
									"{quote.text}"
								</p>
								<p
									className={`text-xs mt-2 ${
										isActiveSessionQuote ? "text-blue-600" : "text-neutral-500"
									}`}>
									— {quote.author}
								</p>
								{isActiveSessionQuote && (
									<p className='text-xs text-blue-500 mt-1 font-medium'>
										✨ Fresh inspiration for your study session • Updates every
										1 min
									</p>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
