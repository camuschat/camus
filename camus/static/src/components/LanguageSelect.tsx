import React from 'react';
import { t, Trans } from '@lingui/macro';
import { locales } from '../i18n';

interface LanguageSelectorProps {
    onSelectLanguage: (locale: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    onSelectLanguage,
}) => {
    const handleChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ): void => {
        event.preventDefault();
        onSelectLanguage(event.target.value);
    };

    return (
        <label>
            <Trans>Language</Trans>
            <select name={t`Language`} onChange={handleChange}>
                {Object.entries(locales).map(([key, value]) => (
                    <option key={key} value={key}>
                        {value}
                    </option>
                ))}
            </select>
        </label>
    );
};

export default LanguageSelector;
