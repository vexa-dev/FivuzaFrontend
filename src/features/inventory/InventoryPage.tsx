import { useState } from 'react'
import '../core/CorePage.css'
import { useAuth } from '../auth/hooks/useAuth'
import { CategoryFormModal } from './components/CategoryFormModal'
import { ProductDetailModal } from './components/ProductDetailModal'
import { ProductFormModal } from './components/ProductFormModal'
import { SupplierFormModal } from './components/SupplierFormModal'
import { WarehouseFormModal } from './components/WarehouseFormModal'
import type { Category, Supplier, Warehouse } from './api'
import { useCategories, useDeleteCategory } from './hooks/useCategories'
import { useDeleteProduct, useProducts } from './hooks/useProducts'
import { useDeleteSupplier, useSuppliers } from './hooks/useSuppliers'
import { useDeleteWarehouse, useWarehouses } from './hooks/useWarehouses'

type Tab = 'productos' | 'categorias' | 'proveedores' | 'almacenes'

export function InventoryPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('INVENTORY_MANAGE')

  const [tab, setTab] = useState<Tab>('productos')
  const [search, setSearch] = useState('')

  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses()
  const { data: products, isLoading: loadingProducts } = useProducts({ search })

  const deleteCategory = useDeleteCategory()
  const deleteSupplier = useDeleteSupplier()
  const deleteWarehouse = useDeleteWarehouse()
  const deleteProduct = useDeleteProduct()

  const [showProductForm, setShowProductForm] = useState(false)
  const [viewingProductId, setViewingProductId] = useState<number | null>(null)
  // Se deriva del listado en vivo (no se guarda el objeto Product completo
  // en el estado) para que el modal refleje de inmediato una variante
  // recien editada, sin depender de que el usuario cierre y reabra.
  const viewingProduct = products?.find((product) => product.id === viewingProductId) ?? null
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | undefined>(undefined)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null | undefined>(undefined)

  const categoryName = (id: number) => categories?.find((c) => c.id === id)?.name ?? '—'

  return (
    <div>
      <h1 className="core-page-title">Inventario</h1>
      <p className="core-page-subtitle">Catálogo, almacenes y proveedores</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(
          [
            ['productos', 'Productos'],
            ['categorias', 'Categorías'],
            ['proveedores', 'Proveedores'],
            ['almacenes', 'Almacenes'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tab === value ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <div className="card core-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre..."
              style={{ maxWidth: 280 }}
            />
            {canManage && (
              <button type="button" className="btn btn-primary" onClick={() => setShowProductForm(true)}>
                + Nuevo producto
              </button>
            )}
          </div>

          {loadingProducts && <p className="core-state-message">Cargando...</p>}
          {products && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Variantes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="core-table-strong">{product.name}</td>
                    <td>{categoryName(product.category)}</td>
                    <td>{product.variants.length}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setViewingProductId(product.id)}
                      >
                        Ver variantes
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm(`¿Dar de baja ${product.name}?`)) {
                              deleteProduct.mutate(product.id)
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'categorias' && (
        <div className="card core-table-card">
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginBottom: 12 }}
              onClick={() => setEditingCategory(null)}
            >
              + Nueva categoría
            </button>
          )}
          {loadingCategories && <p className="core-state-message">Cargando...</p>}
          {categories && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="core-table-strong">{category.name}</td>
                    {canManage && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setEditingCategory(category)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${category.name}?`)) {
                              deleteCategory.mutate(category.id)
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'proveedores' && (
        <div className="card core-table-card">
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginBottom: 12 }}
              onClick={() => setEditingSupplier(null)}
            >
              + Nuevo proveedor
            </button>
          )}
          {loadingSuppliers && <p className="core-state-message">Cargando...</p>}
          {suppliers && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>RUC/DNI</th>
                  <th>Razón social</th>
                  <th>Teléfono</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.ruc_or_dni}</td>
                    <td className="core-table-strong">{supplier.company_name}</td>
                    <td>{supplier.phone}</td>
                    {canManage && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setEditingSupplier(supplier)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${supplier.company_name}?`)) {
                              deleteSupplier.mutate(supplier.id)
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'almacenes' && (
        <div className="card core-table-card">
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginBottom: 12 }}
              onClick={() => setEditingWarehouse(null)}
            >
              + Nuevo almacén
            </button>
          )}
          {loadingWarehouses && <p className="core-state-message">Cargando...</p>}
          {warehouses && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="core-table-strong">{warehouse.name}</td>
                    <td>{warehouse.address}</td>
                    {canManage && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setEditingWarehouse(warehouse)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${warehouse.name}?`)) {
                              deleteWarehouse.mutate(warehouse.id)
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showProductForm && (
        <ProductFormModal
          categories={categories ?? []}
          suppliers={suppliers ?? []}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          canManage={canManage}
          onClose={() => setViewingProductId(null)}
        />
      )}

      {editingCategory !== undefined && (
        <CategoryFormModal
          editingCategory={editingCategory}
          onClose={() => setEditingCategory(undefined)}
        />
      )}

      {editingSupplier !== undefined && (
        <SupplierFormModal
          editingSupplier={editingSupplier}
          onClose={() => setEditingSupplier(undefined)}
        />
      )}

      {editingWarehouse !== undefined && (
        <WarehouseFormModal
          editingWarehouse={editingWarehouse}
          onClose={() => setEditingWarehouse(undefined)}
        />
      )}
    </div>
  )
}
