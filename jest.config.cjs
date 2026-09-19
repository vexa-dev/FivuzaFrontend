/** Jest + React Testing Library (Convenciones §5.4, TRD §7.1). */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg)$': '<rootDir>/src/test/fileMock.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Cobertura solo del codigo de la app (reporte en CI, sin umbral por ahora).
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test/**', '!src/main.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
}
