import { useCallback, useEffect, useRef, useState } from 'react'

interface SerialScaleState {
  isSupported: boolean
  isConnected: boolean
  weight: string | null
  error: string | null
}

const BAUD_RATE = 9600
// Balanzas comerciales envían el peso como texto plano por línea, con
// formato variable segun el fabricante (ej. "ST,GS,  0.150kg\r\n" o
// simplemente "0.150\r\n") -se extrae el primer numero decimal de cada
// línea en vez de parsear un protocolo especifico, para no acoplarse a
// una marca (Sprint 27, Ficha de Producto §5.2).
const WEIGHT_PATTERN = /(\d+\.\d+)/

/** Integración con balanza electrónica vía Web Serial API (Sprint 27,
 * Ficha de Producto §5.2): lee el peso en tiempo real desde una balanza
 * conectada por USB/serial. Sin soporte del navegador (Web Serial solo
 * existe en Chrome/Edge de escritorio) o sin balanza conectada, el
 * llamador debe degradar a que el cajero tipee el peso a mano. */
export function useSerialScale() {
  const [state, setState] = useState<SerialScaleState>({
    isSupported: typeof navigator !== 'undefined' && 'serial' in navigator,
    isConnected: false,
    weight: null,
    error: null,
  })

  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null)
  const cancelledRef = useRef(false)

  const readLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) return
    const textDecoder = new TextDecoderStream()
    const readableClosed = port.readable.pipeTo(
      textDecoder.writable as unknown as WritableStream<Uint8Array>,
    )
    const reader = textDecoder.readable.getReader()
    readerRef.current = reader

    let buffer = ''
    try {
      while (!cancelledRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const match = line.match(WEIGHT_PATTERN)
          if (match) {
            setState((prev) => ({ ...prev, weight: match[1] }))
          }
        }
      }
    } catch {
      // Desconexion fisica del cable -se refleja como "no conectado"
      // abajo, sin loguear un error tecnico que el cajero no puede accionar.
    } finally {
      reader.releaseLock()
      await readableClosed.catch(() => undefined)
    }
  }, [])

  const disconnect = useCallback(async () => {
    cancelledRef.current = true
    readerRef.current?.cancel().catch(() => undefined)
    await portRef.current?.close().catch(() => undefined)
    portRef.current = null
    setState((prev) => ({ ...prev, isConnected: false }))
  }, [])

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      setState((prev) => ({
        ...prev,
        error: 'Este navegador no soporta la Web Serial API (usa Chrome o Edge de escritorio).',
      }))
      return
    }
    try {
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: BAUD_RATE })
      portRef.current = port
      cancelledRef.current = false
      setState((prev) => ({ ...prev, isConnected: true, error: null }))
      readLoop(port)
    } catch {
      setState((prev) => ({ ...prev, error: 'No se pudo conectar con la balanza.' }))
    }
  }, [readLoop])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      readerRef.current?.cancel().catch(() => undefined)
      portRef.current?.close().catch(() => undefined)
    }
  }, [])

  return { ...state, connect, disconnect }
}
