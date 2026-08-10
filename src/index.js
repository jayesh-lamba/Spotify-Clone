import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { LikedSongsProvider } from './context/LikedSongsContext';
import { ToastProvider } from './context/ToastContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <BrowserRouter>
        <AuthProvider>
            <PlayerProvider>
                <LikedSongsProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </LikedSongsProvider>
            </PlayerProvider>
        </AuthProvider>
    </BrowserRouter>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.log('SW registration failed:', err);
        });
    });
}