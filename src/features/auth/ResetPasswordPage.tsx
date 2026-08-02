import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '../../shared/components/Logo'
import { PasswordInput } from '../../shared/components/PasswordInput'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import '../../shared/styles/login.css'
import { useResetPassword } from './hooks/useResetPassword'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { submit, isPending, formError } = useResetPassword(token)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(newPassword, confirmPassword)
  }

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <form className="login-card card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <Logo height={96} layout="stacked" />
        </div>
        <p className="login-subtitle">Elige tu nueva contraseña.</p>

        <label htmlFor="new-password">Nueva contraseña</label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="••••••••"
        />

        {formError && (
          <p className="login-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Cambiar contraseña'}
        </button>

        <Link to="/login" className="login-back-link">
          Volver a iniciar sesión
        </Link>
      </form>
    </div>
  )
}
