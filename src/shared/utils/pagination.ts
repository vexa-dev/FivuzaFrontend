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

/**
 * Sigue `next` hasta agotar todas las paginas y devuelve los `results`
 * concatenados -antes vivia duplicado a mano en tenantApiClient.ts (y
 * apiClient.ts ni lo intentaba, truncando a la pagina 1 con
 * unwrapPagination). `fetchPage` recibe la URL absoluta de `next` y debe
 * devolver el body ya parseado (o lanzar si la respuesta no fue exitosa).
 */
export async function collectAllPages<T>(
  initial: PaginatedResponse<T>,
  fetchPage: (url: string) => Promise<unknown>,
): Promise<T[]> {
  const results = [...initial.results]
  let next = initial.next
  while (next) {
    const page = await fetchPage(next)
    if (!isPaginatedResponse<T>(page)) break
    results.push(...page.results)
    next = page.next
  }
  return results
}
