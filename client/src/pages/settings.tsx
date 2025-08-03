/** @format */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { UserSettings } from "@shared/schema";

export default function Settings() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { language, setLanguage } = useLanguage();
	const { t } = useTranslation();

	const [settings, setSettings] = useState<Partial<UserSettings>>({
		musicVolume: 60,
		selectedMusicTrack: "nature-sounds",
		notificationsEnabled: true,
		language: "en",
	});

	// Fetch user settings
	const { data: userSettings, isLoading } = useQuery({
		queryKey: ["user-settings"],
		queryFn: async () => {
			const response = await fetch("/api/user-settings");
			if (!response.ok) {
				throw new Error("Failed to fetch user settings");
			}
			return response.json() as Promise<UserSettings>;
		},
	});

	// Update settings mutation
	const updateSettingsMutation = useMutation({
		mutationFn: async (newSettings: Partial<UserSettings>) => {
			const response = await fetch("/api/user-settings", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newSettings),
			});
			if (!response.ok) {
				throw new Error("Failed to update settings");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user-settings"] });
			toast({
				title: t("success"),
				description: "Settings updated successfully",
			});
		},
		onError: () => {
			toast({
				title: t("error"),
				description: "Failed to update settings",
				variant: "destructive",
			});
		},
	});

	// Update local state when data is fetched
	useEffect(() => {
		if (userSettings) {
			setSettings(userSettings);
			if (userSettings.language && userSettings.language !== language) {
				setLanguage(userSettings.language as Language);
			}
		}
	}, [userSettings, language, setLanguage]);

	const handleSettingChange = (key: keyof UserSettings, value: any) => {
		console.log("=== Settings Change ===");
		console.log("Key:", key, "Value:", value);
		console.log("Current language in context:", language);

		const newSettings = { ...settings, [key]: value };
		setSettings(newSettings);

		// Special handling for language change
		if (key === "language") {
			console.log("Language change detected, calling setLanguage with:", value);
			setLanguage(value as Language);
			console.log("setLanguage called");
		}

		console.log("Calling API to update settings...");
		updateSettingsMutation.mutate(newSettings);
	};

	if (isLoading) {
		return (
			<div className='mobile-container'>
				<div className='flex items-center justify-center h-64'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
						<p className='text-neutral-600'>{t("loading")}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
			<div className='mobile-container'>
				<div className='space-y-8 py-8'>
					{/* Modern Header */}
					<div className='text-center space-y-3'>
						<div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-4'>
							<Globe className='w-8 h-8 text-white' />
						</div>
						<h1 className='text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
							{t("settings")}
						</h1>
						<p className='text-gray-500 text-sm'>
							Customize your study experience
						</p>
					</div>

					{/* Language Settings */}
					<Card className='border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center space-x-3 text-lg'>
								<div className='w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center justify-center'>
									<Globe className='w-5 h-5 text-white' />
								</div>
								<span className='text-gray-800'>{t("language")}</span>
							</CardTitle>
							<CardDescription className='text-gray-500 ml-13'>
								Choose your preferred language for the interface
							</CardDescription>
						</CardHeader>
						<CardContent className='pt-2'>
							<div className='space-y-3'>
								<Select
									value={settings.language || "en"}
									onValueChange={(value) =>
										handleSettingChange("language", value)
									}>
									<SelectTrigger className='h-12 border-2 border-gray-100 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 bg-gray-50/50'>
										<SelectValue placeholder={t("language")} />
									</SelectTrigger>
									<SelectContent className='border-0 shadow-xl'>
										<SelectItem
											value='en'
											className='h-12 cursor-pointer hover:bg-blue-50'>
											<div className='flex items-center space-x-3'>
												<span className='text-lg'>🇺🇸</span>
												<span>{t("english")}</span>
											</div>
										</SelectItem>
										<SelectItem
											value='tr'
											className='h-12 cursor-pointer hover:bg-blue-50'>
											<div className='flex items-center space-x-3'>
												<span className='text-lg'>🇹🇷</span>
												<span>{t("turkish")}</span>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Notification Settings */}
					<Card className='border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center space-x-3 text-lg'>
								<div className='w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-red-500 flex items-center justify-center'>
									<Bell className='w-5 h-5 text-white' />
								</div>
								<span className='text-gray-800'>{t("notifications")}</span>
							</CardTitle>
							<CardDescription className='text-gray-500 ml-13'>
								Control when and how you receive notifications
							</CardDescription>
						</CardHeader>
						<CardContent className='pt-2'>
							<div className='flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100'>
								<div className='flex-1'>
									<Label
										htmlFor='notifications'
										className='text-base font-medium text-gray-800 cursor-pointer'>
										{t("enableNotifications")}
									</Label>
									<p className='text-sm text-gray-500 mt-1'>
										Get notified about study sessions and reminders
									</p>
								</div>
								<Switch
									id='notifications'
									checked={settings.notificationsEnabled || false}
									onCheckedChange={(checked) =>
										handleSettingChange("notificationsEnabled", checked)
									}
									className='data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600'
								/>
							</div>
						</CardContent>
					</Card>

					{/* Footer */}
					<div className='text-center pt-8 pb-4'>
						<p className='text-gray-400 text-sm'>
							StudyFlow • Made with ❤️ for productive learning
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
