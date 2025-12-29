'use client';

import { useSettingsStore } from '@/stores/settings-store';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

type Translations = typeof en;
type NestedKeyOf<T> = T extends object
    ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
    : never;

const translations: Record<'en' | 'ar', Translations> = { en, ar };

export function useTranslation() {
    const { language } = useSettingsStore();

    const t = (key: string, defaultValue?: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found (but English might also miss it)
                value = translations['en'];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        // Return default value if provided, else key
                        return defaultValue || key;
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : (defaultValue || key);
    };

    return { t, language };
}
