/** @format */

import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import {
	LanguageProvider,
	useLanguage,
	useTranslation,
} from "@/contexts/LanguageContext";
import { BottomNavigation } from "@/components/bottom-navigation";

import Home from "./pages/home";
import Schedule from "./pages/schedule";
import Timer from "./pages/timer";
import Stats from "./pages/stats";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

function AppContent() {
	const { language } = useLanguage();
	const { t } = useTranslation();

	return (
		<div className='min-h-screen bg-neutral-50'>
			<Switch>
				<Route path='/' component={Home} />
				<Route path='/schedule' component={Schedule} />
				<Route path='/timer' component={Timer} />
				<Route path='/stats' component={Stats} />
				<Route path='/settings' component={Settings} />
				<Route component={NotFound} />
			</Switch>
			<BottomNavigation />
			<Toaster />
		</div>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<LanguageProvider>
				<AppContent />
			</LanguageProvider>
		</QueryClientProvider>
	);
}

export default App;
