import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { requestPasswordReset } from '../api'

export function useForgotPassword() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: () => setSent(true),
    onError: () => setFormError('No se pudo conectar con el servidor. Intenta de nuevo.'),
  })

  const submit = (email: string) => {
    setFormError(null)
    if (!email) {
      setFormError('Ingresa tu correo.')
      return
    }
    mutation.mutate(email)
  }

  return { submit, isPending: mutation.isPending, formError, sent }
}
