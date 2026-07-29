import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../../shared/utils/apiClient'
import { loginTenantUser } from '../api'
import { useAuth } from './useAuth'

export function useLogin() {
  const [formError, setFormError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginTenantUser(email, password),
    onSuccess: (session) => {
      login(session)
      navigate('/dashboard')
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 400) {
        setFormError('Correo o contraseña incorrectos.')
      } else {
        setFormError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    },
  })

  const submit = (email: string, password: string) => {
    setFormError(null)

    if (!email || !password) {
      setFormError('Correo y contraseña son requeridos.')
      return
    }

    mutation.mutate({ email, password })
  }

  return { submit, isPending: mutation.isPending, formError }
}
