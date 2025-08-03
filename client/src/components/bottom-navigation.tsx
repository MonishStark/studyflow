/** @format */

import { Link, useLocation } from "wouter";
import { Home, Calendar, Clock, BarChart3, Settings } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export function BottomNavigation() {
	const [location] = useLocation();
	const { t } = useTranslation();

	const navItems = [
		{ path: "/", icon: Home, labelKey: "home" },
		{ path: "/schedule", icon: Calendar, labelKey: "schedule" },
		{ path: "/timer", icon: Clock, labelKey: "timer" },
		{ path: "/stats", icon: BarChart3, labelKey: "stats" },
		{ path: "/settings", icon: Settings, labelKey: "settings" },
	];

	return (
		<nav className='fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 max-w-sm mx-auto'>
			<div className='flex justify-around items-center px-2 py-2'>
				{navItems.map(({ path, icon: Icon, labelKey }) => {
					const isActive = location === path;
					return (
						<Link key={path} href={path}>
							<a className='flex flex-col items-center space-y-1 p-1'>
								<Icon
									className={`text-lg ${
										isActive ? "text-primary" : "text-neutral-400"
									}`}
									size={18}
								/>
								<span
									className={`text-xs font-medium ${
										isActive ? "text-primary" : "text-neutral-400"
									}`}>
									{t(labelKey as any)}
								</span>
							</a>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
