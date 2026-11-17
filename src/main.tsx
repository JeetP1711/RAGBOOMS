import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './app/App'
import { ContentProvider } from './app/ContentProvider'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* reducedMotion="user" disables transform animations for visitors who ask for less motion */}
      <MotionConfig reducedMotion="user">
        <ContentProvider>
          <App />
        </ContentProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
