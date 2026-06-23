import { useState } from 'react'
import { login } from './auth'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await login(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data?.user) {
      onLogin(data.user)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Log In</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Please wait…' : 'Log In'}
        </button>
      </form>

      <div style={styles.note}>
        Signup is disabled. Contact the admin to get an account.
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 320,
    margin: '80px auto',
    padding: 24,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    fontFamily: 'sans-serif'
  },
  title: {
    marginBottom: 20,
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #ccc'
  },
  button: {
    padding: 12,
    fontSize: 16,
    borderRadius: 6,
    border: 'none',
    background: '#007bff',
    color: '#fff',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center'
  },
  note: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    color: '#666'
  }
}