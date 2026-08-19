import { Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { Attribute, AttributeValue } from '../api'
import {
  useAttributes,
  useCreateAttributeValue,
  useDeleteAttribute,
  useDeleteAttributeValue,
} from '../hooks/useAttributes'
import { AttributeFormModal } from './AttributeFormModal'
import './AttributesTab.css'

interface AttributesTabProps {
  canManage: boolean
  showCreateForm: boolean
  onCloseCreateForm: () => void
}

/** Talla, Color... -el tipo de dato ya existia en el backend (Attribute/
 * AttributeValue/VariantAttributeValue) pero no tenia ninguna pantalla en
 * el frontend; sin esto, la unica forma de distinguir variantes era meter
 * "M"/"L" a mano dentro del SKU. Valores por atributo se agregan/quitan
 * inline (chips) en vez de un modal aparte -son strings cortos, no
 * ameritan el viaje completo de abrir/cerrar un formulario. */
export function AttributesTab({ canManage, showCreateForm, onCloseCreateForm }: AttributesTabProps) {
  const { data: attributes, isLoading } = useAttributes()
  const deleteAttribute = useDeleteAttribute()
  const deleteAttributeValue = useDeleteAttributeValue()
  const createAttributeValue = useCreateAttributeValue()

  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)
  const [deletingAttribute, setDeletingAttribute] = useState<Attribute | null>(null)
  const [deletingValue, setDeletingValue] = useState<AttributeValue | null>(null)
  const [addingValueFor, setAddingValueFor] = useState<number | null>(null)
  const [newValueText, setNewValueText] = useState('')

  const submitNewValue = (event: FormEvent, attributeId: number) => {
    event.preventDefault()
    if (!newValueText.trim()) return
    createAttributeValue
      .mutateAsync({ attribute: attributeId, value: newValueText.trim() })
      .then(() => {
        setNewValueText('')
        setAddingValueFor(null)
      })
  }

  return (
    <div className="card core-table-card">
      {attributes && attributes.length > 0 && (
        <p className="core-page-subtitle" style={{ padding: '16px 16px 0' }}>
          Para que un atributo agrupe filas en la tabla de Productos (ej. Talla), asígnalo como
          "Atributo de agrupación" en la pestaña Categorías -cada categoría elige el suyo.
        </p>
      )}
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {attributes && attributes.length === 0 && (
        <EmptyState
          icon={<Tags />}
          title="Todavía no hay atributos"
          subtitle={
            canManage
              ? 'Crea uno (ej. "Talla") con "Nuevo atributo" para poder asignar valores a tus variantes.'
              : 'Cuando se configuren atributos, aparecerán aquí.'
          }
        />
      )}
      {attributes && attributes.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Valores</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute) => (
              <tr key={attribute.id}>
                <td className="core-table-strong">{attribute.name}</td>
                <td>
                  <div className="attribute-values-row">
                    {attribute.values.map((value) => (
                      <span className="attribute-value-chip" key={value.id}>
                        {value.value}
                        {canManage && (
                          <button
                            type="button"
                            aria-label={`Quitar valor ${value.value}`}
                            onClick={() => setDeletingValue(value)}
                          >
                            <X size={11} strokeWidth={2.5} />
                          </button>
                        )}
                      </span>
                    ))}

                    {canManage && addingValueFor === attribute.id ? (
                      <form
                        className="attribute-value-add-form"
                        onSubmit={(event) => submitNewValue(event, attribute.id)}
                      >
                        <input
                          autoFocus
                          value={newValueText}
                          onChange={(event) => setNewValueText(event.target.value)}
                          onBlur={() => {
                            if (!newValueText.trim()) setAddingValueFor(null)
                          }}
                          placeholder="Ej. M"
                        />
                      </form>
                    ) : (
                      canManage && (
                        <button
                          type="button"
                          className="attribute-value-add-btn"
                          onClick={() => {
                            setAddingValueFor(attribute.id)
                            setNewValueText('')
                          }}
                        >
                          <Plus size={11} strokeWidth={2.5} />
                          Agregar valor
                        </button>
                      )
                    )}
                  </div>
                </td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Editar ${attribute.name}`}
                        onClick={() => setEditingAttribute(attribute)}
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        aria-label={`Eliminar ${attribute.name}`}
                        onClick={() => setDeletingAttribute(attribute)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(showCreateForm || editingAttribute) && (
        <AttributeFormModal
          editingAttribute={editingAttribute}
          onClose={() => {
            onCloseCreateForm()
            setEditingAttribute(null)
          }}
        />
      )}

      {deletingAttribute && (
        <ConfirmDialog
          title="Eliminar atributo"
          message={`¿Eliminar "${deletingAttribute.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteAttribute.mutate(deletingAttribute.id)}
          onClose={() => setDeletingAttribute(null)}
        />
      )}

      {deletingValue && (
        <ConfirmDialog
          title="Quitar valor"
          message={`¿Quitar "${deletingValue.value}"? No se podrá si alguna variante ya lo tiene asignado.`}
          confirmLabel="Quitar"
          onConfirm={() => deleteAttributeValue.mutate(deletingValue.id)}
          onClose={() => setDeletingValue(null)}
        />
      )}
    </div>
  )
}
