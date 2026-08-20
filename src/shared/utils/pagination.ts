export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PaginatedResponse<T>>
  return typeof candidate.count === 'number' && Array.isArray(candidate.results)
}
