import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './components/App';
import { manager, sagaMiddleware, store } from './store';
import rootSaga from './sagas';

window.addEventListener('unhandledrejection', (event) => {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);
});

// Start Redux Saga
sagaMiddleware.run(rootSaga);

// Render our React app, passing it the Redux store
ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <App manager={manager} />
        </Provider>
    </React.StrictMode>,
    document.getElementById('react-root')
);
