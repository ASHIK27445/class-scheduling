import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router'
import { router } from './routes/Routes.jsx'
import AuthProvider from './authentication/AuthProvider.jsx'
import SlotProvider from './components/task/SlotProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SlotProvider>
        <RouterProvider router={router}>
        </RouterProvider>
      </SlotProvider>
    </AuthProvider>
  </StrictMode>,
)
