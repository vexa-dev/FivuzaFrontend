import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/utils/apiClient'
import { loginPlatformStaff } from './api'
import { useAuth } from './useAuth'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => loginPlatformStaff(email, password),
    onSuccess: (tokens) => {
      login(tokens)
      navigate('/admin')
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 400) {
        setFormError('Correo o contraseña incorrectos.')
      } else {
        setFormError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!email || !password) {
      setFormError('Correo y contraseña son requeridos.')
      return
    }

    mutation.mutate()
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Fivuza — Panel interno</h1>
        <p className="login-subtitle">Acceso exclusivo para el equipo Fivuza</p>

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        {formError && (
          <p className="login-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
