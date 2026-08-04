import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeCashSession,
  createCashMovement,
  fetchCashMovements,
  fetchCashRegisters,
  fetchCashSessions,
  openCashSession,
  type CashMovementConcept,
  type CashMovementType,
} from '../api'

export function useCashRegisters() {
  return useQuery({ queryKey: ['sales', 'cash-registers'], queryFn: fetchCashRegisters })
}

export function useOpenCashSessions() {
  return useQuery({
    queryKey: ['sales', 'cash-sessions', 'open'],
    queryFn: () => fetchCashSessions({ status: 'OPEN' }),
  })
}

export function useOpenCashSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      cashRegisterId,
      openingAmount,
    }: {
      cashRegisterId: number
      openingAmount: string
    }) => openCashSession(cashRegisterId, openingAmount),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] }),
  })
}

export function useCloseCashSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      countedClosingAmount,
      notes,
    }: {
      sessionId: number
      countedClosingAmount: string
      notes?: string
    }) => closeCashSession(sessionId, countedClosingAmount, notes),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] }),
  })
}

export function useCashMovements(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'cash-movements', sessionId],
    queryFn: () => fetchCashMovements(sessionId as number),
    enabled: sessionId !== undefined,
  })
}

export function useCreateCashMovement(sessionId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      type,
      concept,
      amount,
    }: {
      type: CashMovementType
      concept: CashMovementConcept
      amount: string
    }) =>
      createCashMovement({
        cash_session: sessionId as number,
        type,
        concept,
        amount,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-movements', sessionId] }),
  })
}
