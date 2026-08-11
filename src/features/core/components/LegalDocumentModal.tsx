import { useQuery } from '@tanstack/react-query'
import { Modal } from '../../../shared/components/Modal'
import { fetchLegalDocument } from '../api'

const TITLES = {
  terms: 'Términos y Condiciones',
  privacy: 'Política de Privacidad',
}

interface LegalDocumentModalProps {
  document: 'terms' | 'privacy'
  onClose: () => void
}

/** Sprint 33 (Ley N 29733): muestra el texto vigente de Términos/Privacidad
 * -sin autenticación en el backend, cualquiera puede leerlo antes de
 * aceptarlo (RegisterTenantModal lo abre desde el checkbox de aceptación). */
export function LegalDocumentModal({ document, onClose }: LegalDocumentModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['legal-document', document],
    queryFn: () => fetchLegalDocument(document),
  })

  return (
    <Modal title={TITLES[document]} onClose={onClose}>
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {data && (
        <>
          <p className="core-page-subtitle" style={{ marginTop: 0 }}>
            Versión vigente: {data.version}
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              maxHeight: 400,
              overflowY: 'auto',
              margin: 0,
            }}
          >
            {data.content}
          </pre>
        </>
      )}
    </Modal>
  )
}
