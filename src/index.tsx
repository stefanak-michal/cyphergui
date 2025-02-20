import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import mixpanel from 'mixpanel-browser';

if (typeof process === 'undefined') {
    mixpanel.init('b79f8e7c618e117cb8648076ffde5154', {
        api_host: 'https://api-eu.mixpanel.com',
        track_pageview: true,
        persistence: 'localStorage',
        secure_cookie: true,
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
