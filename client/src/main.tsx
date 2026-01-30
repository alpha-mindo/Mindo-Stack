import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Override global fetch to add ngrok bypass header
const originalFetch = window.fetch
window.fetch = function(...args) {
  const [url, config = {}] = args
  const headers = new Headers(config.headers)
  headers.set('ngrok-skip-browser-warning', 'true')
  
  return originalFetch(url, {
    ...config,
    headers
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)
