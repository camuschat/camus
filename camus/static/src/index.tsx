import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import App from './components/App';
import { manager, sagaMiddleware, store } from './store';
import rootSaga from './sagas';
import { defaultLocale, setLanguage } from './i18n';

window.addEventListener('unhandledrejection', (event) => {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);
});

// Start Redux Saga
sagaMiddleware.run(rootSaga);

const I18nApp = () => {
    useEffect(() => {
        setLanguage(defaultLocale);
    }, []);

    return (
        <I18nProvider i18n={i18n} forceRenderOnLocaleChange={false}>
            <App manager={manager} />
        </I18nProvider>
    );
};

// Render our React app, passing it the Redux store
ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <I18nApp />
        </Provider>
    </React.StrictMode>,
    document.getElementById('react-root')
);
