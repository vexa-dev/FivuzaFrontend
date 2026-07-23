import { useState, type FormEvent } from 'react'
import { Logo } from '../../shared/components/Logo'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import { useLogin } from './hooks/useLogin'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { submit, isPending, formError } = useLogin()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <form className="login-card card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <Logo height={32} />
        </div>
        <p className="login-subtitle">Panel interno — acceso exclusivo para el equipo Fivuza</p>

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          placeholder="tu@fivuza.com"
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        {formError && (
          <p className="login-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
