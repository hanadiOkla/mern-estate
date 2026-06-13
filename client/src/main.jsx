import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { persistor, store } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import '../i18n.js' // <--- أضيفي هذا السطر هنا ليتم تفعيل الإعدادات فوراً

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <PersistGate loading = {null} persistor={persistor}>
        <App/>
      </PersistGate>
    </Provider>
)
