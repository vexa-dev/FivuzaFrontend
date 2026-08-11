import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Plan } from '../api'
import { useRegisterTenant } from '../hooks/useTenantLifecycle'
import { LegalDocumentModal } from './LegalDocumentModal'

interface RegisterTenantModalProps {
  plans: Plan[]
  onClose: () => void
}

export function RegisterTenantModal({ plans, onClose }: RegisterTenantModalProps) {
  const [companyName, setCompanyName] = useState('')
  const [ruc, setRuc] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [domain, setDomain] = useState('')
  const [planCode, setPlanCode] = useState('')
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL'>('MONTHLY')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showLegalDocument, setShowLegalDocument] = useState<'terms' | 'privacy' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const registerTenant = useRegisterTenant()

  // plans llega de una query que puede resolver despues de que este modal ya
  // este montado -sin este efecto, un planCode inicializado a partir de un
  // array de plans todavia vacio (plans[0]?.code) se queda vacio para
  // siempre, aunque el <select> ya muestre las opciones reales.
  useEffect(() => {
    if (!planCode && plans.length > 0) {
      setPlanCode(plans[0].code)
    }
  }, [plans, planCode])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!companyName || !schemaName || !domain || !planCode) {
      setError('Negocio, schema, dominio y plan son requeridos.')
      return
    }
    if (!acceptTerms) {
      setError('Debes confirmar que el negocio acepta los Términos y la Política de Privacidad.')
      return
    }

    registerTenant
      .mutateAsync({
        company_name: companyName,
        ruc: ruc || undefined,
        schema_name: schemaName,
        domain,
        plan_code: planCode,
        billing_cycle: billingCycle,
        accept_terms: acceptTerms,
      })
      .then(onClose)
      .catch(() => setError('No se pudo registrar el tenant. Revisa que el schema/dominio no estén en uso.'))
  }

  return (
    <Modal title="Registrar tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="tenant-company-name">Nombre del negocio</label>
          <input
            id="tenant-company-name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tenant-ruc">RUC (opcional)</label>
          <input id="tenant-ruc" value={ruc} onChange={(event) => setRuc(event.target.value)} />
        </div>

        <div>
          <label htmlFor="tenant-schema">Schema</label>
          <input
            id="tenant-schema"
            value={schemaName}
            onChange={(event) => setSchemaName(event.target.value)}
            placeholder="emp_lucho"
          />
        </div>

        <div>
          <label htmlFor="tenant-domain">Dominio</label>
          <input
            id="tenant-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="lucho.fivuza.com"
          />
        </div>

        <div>
          <label htmlFor="tenant-plan">Plan</label>
          <select
            id="tenant-plan"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tenant-billing-cycle">Ciclo de facturación</label>
          <select
            id="tenant-billing-cycle"
            value={billingCycle}
            onChange={(event) =>
              setBillingCycle(event.target.value as 'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL')
            }
          >
            <option value="MONTHLY">Mensual</option>
            <option value="SEMIANNUAL">Semestral</option>
            <option value="ANNUAL">Anual</option>
          </select>
        </div>

        <label
          htmlFor="tenant-accept-terms"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontWeight: 400 }}
        >
          <input
            id="tenant-accept-terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            El negocio acepta los{' '}
            <button
              type="button"
              onClick={() => setShowLegalDocument('terms')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              Términos y Condiciones
            </button>{' '}
            y la{' '}
            <button
              type="button"
              onClick={() => setShowLegalDocument('privacy')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              Política de Privacidad
            </button>{' '}
            vigentes.
          </span>
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={registerTenant.isPending}>
          {registerTenant.isPending ? 'Registrando...' : 'Registrar tenant'}
        </button>
      </form>

      {showLegalDocument && (
        <LegalDocumentModal
          document={showLegalDocument}
          onClose={() => setShowLegalDocument(null)}
        />
      )}
    </Modal>
  )
}
