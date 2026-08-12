import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  convertQuote,
  createQuote,
  fetchQuoteDocument,
  fetchQuotes,
  markQuoteAccepted,
  markQuoteRejected,
  markQuoteSent,
} from '../api'

export function useQuotes(params?: { customer?: number; status?: string }) {
  return useQuery({
    queryKey: ['quotes', params?.customer ?? '', params?.status ?? ''],
    queryFn: () => fetchQuotes(params),
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useMarkQuoteSent() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: markQuoteSent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo marcar la cotización como enviada.')),
  })
}

export function useMarkQuoteAccepted() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: markQuoteAccepted,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo marcar la cotización como aceptada.')),
  })
}

export function useMarkQuoteRejected() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: markQuoteRejected,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo marcar la cotización como rechazada.')),
  })
}

export function useQuoteDocument(quoteId: number | undefined) {
  return useQuery({
    queryKey: ['quotes', 'document', quoteId],
    queryFn: () => fetchQuoteDocument(quoteId as number),
    enabled: quoteId !== undefined,
  })
}

export function useConvertQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof convertQuote>[1] }) =>
      convertQuote(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  })
}
