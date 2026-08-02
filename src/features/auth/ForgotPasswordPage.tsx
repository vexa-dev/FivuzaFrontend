import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../shared/components/Logo'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import '../../shared/styles/login.css'
import { useForgotPassword } from './hooks/useForgotPassword'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const { submit, isPending, formError, sent } = useForgotPassword()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(email)
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

        {sent ? (
          <>
            <MailCheck
              size={32}
              strokeWidth={1.6}
              color="var(--success)"
              style={{ margin: '0 auto 12px' }}
            />
            <p className="login-subtitle" style={{ marginBottom: 0 }}>
              Si <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> está
              registrado, te enviamos un enlace para recuperar tu contraseña. Revisa tu bandeja
              de entrada.
            </p>
          </>
        ) : (
          <>
            <p className="login-subtitle">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              placeholder="tucorreo@negocio.com"
            />

            {formError && (
              <p className="login-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </>
        )}

        <Link to="/login" className="login-back-link">
          Volver a iniciar sesión
        </Link>
      </form>
    </div>
  )
}
