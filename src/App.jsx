import { useAuth } from './hooks/useAuth'
import AuthScreen from './screens/AuthScreen'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B6B6B' }}>
        Loading...
      </div>
    )
  }

  return (
    <div>
      {!user ? (
        <AuthScreen />
      ) : (
        <div style={{ padding: '2rem', color: '#1A1A1A' }}>
          <p>Logged in as {user.email}</p>
        </div>
      )}
    </div>
  )
}

export default App
