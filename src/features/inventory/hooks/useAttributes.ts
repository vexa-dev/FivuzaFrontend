import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  createAttribute,
  createAttributeValue,
  deleteAttribute,
  deleteAttributeValue,
  fetchAttributes,
  updateAttribute,
  type Attribute,
  type Category,
} from '../api'

export function useAttributes() {
  return useQuery({
    queryKey: ['attributes'],
    queryFn: fetchAttributes,
  })
}

// Mapa attribute_value id -> "Talla: M" -el backend solo manda el id
// (ver VariantAttributeValue en api.ts); esto es lo unico que necesita
// cualquier pantalla que quiera mostrar el texto legible de una variante.
export function attributeValueLabels(attributes: Attribute[] | undefined) {
  const labels = new Map<number, string>()
  attributes?.forEach((attribute) => {
    attribute.values.forEach((value) => {
      labels.set(value.id, `${attribute.name}: ${value.value}`)
    })
  })
  return labels
}

// Mapa attribute_value id -> solo "M" (sin el nombre del atributo delante)
// -para chips/columnas angostas donde "Presentación: 500ml" se ve
// demasiado largo y envuelve a 2 lineas; el nombre completo sigue
// disponible via attributeValueLabels() para usarlo como title/tooltip.
export function attributeValueOnly(attributes: Attribute[] | undefined) {
  const labels = new Map<number, string>()
  attributes?.forEach((attribute) => {
    attribute.values.forEach((value) => {
      labels.set(value.id, value.value)
    })
  })
  return labels
}

// Que atributo agrupa filas en la tabla de Productos PARA LA CATEGORIA de
// este producto -por categoria y no uno solo global para todo el
// negocio: una categoria "Ropa" puede agrupar por Talla, "Calzado" por su
// propia Talla numerica, y "Abarrotes" no agrupar nada (ver
// Category.primary_attribute en api.ts, configurable desde la pestaña
// Categorías). ProductsTab.tsx llama esto por producto, no una vez global.
export function primaryAttributeForCategory(
  categoryId: number,
  categories: Category[],
  attributes: Attribute[],
): Attribute | null {
  const category = categories.find((c) => c.id === categoryId)
  if (!category?.primary_attribute) return null
  return attributes.find((attribute) => attribute.id === category.primary_attribute) ?? null
}

export function useCreateAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAttribute,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
  })
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Attribute, 'name'>> }) =>
      updateAttribute(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
  })
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteAttribute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
    onError: (error) =>
      showToast(
        'error',
        getErrorMessage(error, 'No se pudo eliminar el atributo -quita sus valores primero.'),
      ),
  })
}

export function useCreateAttributeValue() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: createAttributeValue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
    onError: (error) => showToast('error', getErrorMessage(error, 'No se pudo agregar el valor.')),
  })
}

export function useDeleteAttributeValue() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteAttributeValue(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
    onError: (error) =>
      showToast(
        'error',
        getErrorMessage(error, 'No se pudo eliminar el valor -esta en uso por alguna variante.'),
      ),
  })
}
