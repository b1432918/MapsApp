import { useState, useEffect } from 'react'
import Login from './Login'
import MapView from './components/MapView'
import { getUser } from './auth'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function init() {
      const u = await getUser()
      if (u) setUser(u)
    }
    init()
  }, [])

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return <MapView user={user} />
}