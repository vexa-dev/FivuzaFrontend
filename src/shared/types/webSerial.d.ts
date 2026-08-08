// Tipos mínimos de la Web Serial API (Sprint 27, integración con balanza
// electrónica) -no viene en lib.dom.d.ts de TypeScript todavía, y no se
// instala el paquete @types/w3c-web-serial completo para no arrastrar
// definiciones que no se usan.
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface Serial {
  requestPort(): Promise<SerialPort>
}

interface Navigator {
  serial?: Serial
}
