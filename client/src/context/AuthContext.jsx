import { createContext, useContext, useState } from 'react'

// This is the "bulletin board" itself -- an empty box for now. It gets
// filled in by AuthProvider below.
const AuthContext = createContext(null)

// AuthProvider wraps around our whole app (we'll do that in main.jsx).
// Anything rendered INSIDE it can read from or write to the board.
export function AuthProvider({ children }) {
  // We start by checking localStorage -- if the browser already has a
  // saved token/user from a previous login (like the one we stored in
  // Login.jsx), we pick it back up immediately instead of forgetting
  // the person is logged in every time the page refreshes.
  const [token, setToken] = useState(() => localStorage.getItem('civicfix_token'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('civicfix_user')
    return stored ? JSON.parse(stored) : null
  })

  function login(newToken, newUser) {
    localStorage.setItem('civicfix_token', newToken)
    localStorage.setItem('civicfix_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('civicfix_token')
    localStorage.removeItem('civicfix_user')
    setToken(null)
    setUser(null)
  }

  // Whatever we put in "value" here is what any component can read.
  const value = {
    token,
    user,
    isLoggedIn: Boolean(token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// A small helper so other components can just write `useAuth()` instead
// of importing AuthContext and useContext separately every time.
export function useAuth() {
  return useContext(AuthContext)
}
