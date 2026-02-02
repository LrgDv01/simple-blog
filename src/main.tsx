import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'

// Render the root of the React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}> {/* Redux Store Provider */}
      <ThemeProvider> {/* Theme Context Provider */}
        <App />
        {/* Toast Notification Container */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)