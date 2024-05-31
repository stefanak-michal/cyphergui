import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import mixpanel from 'mixpanel-browser';

mixpanel.init('b79f8e7c618e117cb8648076ffde5154', {
    api_host: 'https://api-eu.mixpanel.com',
    track_pageview: true,
    persistence: 'localStorage',
    secure_cookie: true,
});

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
