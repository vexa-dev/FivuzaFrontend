import { useQuery } from '@tanstack/react-query'
import { fetchTenants } from '../api'

export function useTenants() {
  return useQuery({
    queryKey: ['core', 'tenants'],
    queryFn: fetchTenants,
  })
}
