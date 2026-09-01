// The one place this whole app keeps the backend's address, instead of it
// being typed out separately in every page that talks to the server.
//
// import.meta.env is Vite's (the tool that builds this React app) way of
// reading environment variables INTO frontend code. Any variable whose name
// starts with VITE_ gets baked into the built site at build time -- Vite
// deliberately ignores anything that doesn't start with VITE_, as a safety
// rule so a frontend build can never accidentally leak a backend-only
// secret (like JWT_SECRET) into code that ships to every visitor's browser.
//
// Locally, VITE_API_URL is never set, so the "|| 'http://localhost:3000'"
// fallback kicks in -- meaning local development keeps working exactly as
// it always has, no .env changes required on your own machine. Once this
// site is deployed to Vercel, VITE_API_URL gets set in Vercel's dashboard
// to point at the real, live backend address instead.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
