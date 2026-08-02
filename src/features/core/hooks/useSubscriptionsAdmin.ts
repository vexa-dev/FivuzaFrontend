import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSubscriptions,
  updateSubscription,
  type Subscription,
  type SubscriptionFilters,
} from '../api'

export function useAllSubscriptions(filters: SubscriptionFilters = {}) {
  return useQuery({
    queryKey: ['core', 'subscriptions', 'all', filters],
    queryFn: () => fetchSubscriptions(filters),
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<Pick<Subscription, 'plan' | 'billing_cycle' | 'status' | 'expires_at'>>
    }) => updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core', 'subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['core', 'dashboard-summary'] })
    },
  })
}
