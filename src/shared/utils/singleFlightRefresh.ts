/**
 * Dos 401 casi simultaneos (ej. dos pestañas, o dos fetches en paralelo) no
 * deben disparar dos refresh de token -el segundo se sube al mismo refresh
 * en vuelo del primero. apiClient.ts y tenantApiClient.ts implementaban esto
 * a mano, casi identico; se centraliza aca para no repetir el patron (y para
 * que ambos compartan el mismo comportamiento en el borde de "dos llamadas
 * mientras el refresh todavia no resuelve").
 */
export function createSingleFlightRefresher<T>(refresh: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null

  return () => {
    inFlight ??= refresh().finally(() => {
      inFlight = null
    })
    return inFlight
  }
}
