import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
  type Warehouse,
} from '../api'

export function useWarehouses(search?: string) {
  return useQuery({
    queryKey: ['warehouses', search ?? ''],
    queryFn: () => fetchWarehouses(search),
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Warehouse> }) =>
      updateWarehouse(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}
