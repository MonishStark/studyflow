/** @format */

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

interface LanguageProviderProps {
	children: ReactNode;
	initialLanguage?: Language;
}

export function LanguageProvider({
	children,
	initialLanguage = "en",
}: LanguageProviderProps) {
	const [language, setLanguage] = useState<Language>(initialLanguage);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load language from backend on mount
	useEffect(() => {
		const loadLanguage = async () => {
			try {
				const response = await fetch("/api/user-settings");
				if (response.ok) {
					const settings = await response.json();
					console.log("Loaded settings from backend:", settings);
					if (settings.language && settings.language !== language) {
						console.log("Setting language to:", settings.language);
						setLanguage(settings.language as Language);
					}
				}
			} catch (error) {
				console.log("Could not load language from backend:", error);
			} finally {
				setIsLoaded(true);
			}
		};

		loadLanguage();
	}, []);

	// Enhanced setLanguage with logging
	const handleSetLanguage = (lang: Language) => {
		console.log("Language change requested:", lang);
		setLanguage(lang);
		console.log("Language state updated to:", lang);
	};

	const t = (key: TranslationKey, params?: Record<string, string>): string => {
		let translation =
			translations[language][key] || translations.en[key] || key;

		// Replace template parameters if provided
		if (params) {
			Object.entries(params).forEach(([paramKey, paramValue]) => {
				translation = translation.replace(`{{${paramKey}}}`, paramValue);
			});
		}

		return translation;
	};

	const contextValue: LanguageContextType = {
		language,
		setLanguage: handleSetLanguage,
		t,
	};

	return (
		<LanguageContext.Provider value={contextValue}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage(): LanguageContextType {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}

export function useTranslation() {
	const { t } = useLanguage();
	return { t };
}
