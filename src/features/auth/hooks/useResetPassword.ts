import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../../shared/utils/apiClient'
import { confirmPasswordReset } from '../api'

export function useResetPassword(token: string | null) {
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (newPassword: string) => confirmPasswordReset(token ?? '', newPassword),
    onSuccess: () => navigate('/login'),
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 400) {
        setFormError('El enlace es inválido o ya expiró. Solicita uno nuevo.')
      } else {
        setFormError('No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    },
  })

  const submit = (newPassword: string, confirmPassword: string) => {
    setFormError(null)

    if (!token) {
      setFormError('El enlace es inválido. Solicita uno nuevo.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError('Las contraseñas no coinciden.')
      return
    }

    mutation.mutate(newPassword)
  }

  return { submit, isPending: mutation.isPending, formError }
}
