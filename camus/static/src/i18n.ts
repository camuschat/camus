import { i18n } from '@lingui/core';
import { en, de } from 'make-plural/plurals';

export const locales = {
    en: 'English',
    de: 'Deutsch',
};

export const defaultLocale = 'en';

i18n.loadLocaleData({
    en: { plurals: en },
    de: { plurals: de },
});

export const setLanguage = async (locale: string): Promise<void> => {
    const { messages } = await import(
        `@lingui/loader!./locales/${locale}/messages.po`
    );
    i18n.load(locale, messages);
    i18n.activate(locale);
    console.log('! ACTIVATED LANGUAGE');
};
