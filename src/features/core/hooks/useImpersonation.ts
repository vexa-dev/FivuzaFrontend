import { useMutation } from '@tanstack/react-query'
import { startImpersonation } from '../api'

export function useStartImpersonation() {
  return useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: number; reason: string }) =>
      startImpersonation(tenantId, reason),
  })
}
