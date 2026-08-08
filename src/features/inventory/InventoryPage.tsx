import { PackageSearch, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import '../core/CorePage.css'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from '../auth/hooks/useAuth'
import { CatalogImportTab } from './components/CatalogImportTab'
import { CategoryFormModal } from './components/CategoryFormModal'
import { KardexTab } from './components/KardexTab'
import { LabelsPrintTab } from './components/LabelsPrintTab'
import { ProductDetailModal } from './components/ProductDetailModal'
import { ProductFormModal } from './components/ProductFormModal'
import { PurchaseOrdersTab } from './components/PurchaseOrdersTab'
import { StockAdjustTab } from './components/StockAdjustTab'
import { StockTransferTab } from './components/StockTransferTab'
import { SupplierFormModal } from './components/SupplierFormModal'
import { TaxRatesTab } from './components/TaxRatesTab'
import { WarehouseFormModal } from './components/WarehouseFormModal'
import type { Category, Supplier, Warehouse } from './api'
import { useCategories, useDeleteCategory } from './hooks/useCategories'
import { useDeleteProduct, useProducts } from './hooks/useProducts'
import { useDeleteSupplier, useSuppliers } from './hooks/useSuppliers'
import { useDeleteWarehouse, useWarehouses } from './hooks/useWarehouses'

type Tab =
  | 'productos'
  | 'categorias'
  | 'proveedores'
  | 'almacenes'
  | 'stock'
  | 'traslados'
  | 'kardex'
  | 'compras'
  | 'impuestos'
  | 'importar'
  | 'etiquetas'

const TABS: [Tab, string][] = [
  ['productos', 'Productos'],
  ['categorias', 'Categorías'],
  ['proveedores', 'Proveedores'],
  ['almacenes', 'Almacenes'],
  ['stock', 'Ajustar stock'],
  ['traslados', 'Traslado de stock'],
  ['kardex', 'Kardex'],
  ['compras', 'Compras'],
  ['impuestos', 'Impuestos'],
  ['importar', 'Importar catálogo'],
  ['etiquetas', 'Imprimir etiquetas'],
]

function LoadingRow() {
  return (
    <div className="loading-row">
      <span className="spinner" />
      Cargando...
    </div>
  )
}

export function InventoryPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('INVENTORY_MANAGE')
  const canManagePurchases = hasPermission('PURCHASES_MANAGE')

  const [tab, setTab] = useState<Tab>('productos')
  const [search, setSearch] = useState('')

  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses()
  const { data: products, isLoading: loadingProducts } = useProducts({ search })
  // Sin filtro de busqueda -Kardex/Ajustar stock necesitan el catalogo
  // completo, independiente de lo que el usuario haya buscado en la tab
  // Productos (son pestañas distintas, no deberian compartir ese estado).
  const { data: allProducts } = useProducts()

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
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Inventario</h1>
          <p className="core-page-subtitle">Catálogo, almacenes y proveedores</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.filter(
          ([value]) =>
            (!['stock', 'importar', 'etiquetas'].includes(value) || canManage) &&
            (value !== 'traslados' || (canManage && (warehouses?.length ?? 0) > 1)) &&
            (!['compras', 'impuestos'].includes(value) || canManagePurchases),
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${tab === value ? 'tab-active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <div className="card core-table-card">
          <div className="table-toolbar">
            <div className="search-input">
              <Search />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>
            {canManage && (
              <button type="button" className="btn btn-primary" onClick={() => setShowProductForm(true)}>
                <Plus size={15} strokeWidth={2.5} />
                Nuevo producto
              </button>
            )}
          </div>

          {loadingProducts && <LoadingRow />}
          {products && products.length === 0 && (
            <EmptyState
              icon={<PackageSearch />}
              title={search ? 'Sin resultados' : 'Todavía no hay productos'}
              subtitle={
                search
                  ? 'Prueba con otro término de búsqueda.'
                  : canManage
                    ? 'Crea el primero con "Nuevo producto".'
                    : 'Cuando se agreguen productos, aparecerán aquí.'
              }
            />
          )}
          {products && products.length > 0 && (
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
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setViewingProductId(product.id)}
                        >
                          Ver variantes
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${product.name}`}
                            onClick={() => {
                              if (confirm(`¿Dar de baja ${product.name}?`)) {
                                deleteProduct.mutate(product.id)
                              }
                            }}
                          >
                            <Trash2 />
                          </button>
                        )}
                      </div>
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
            <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditingCategory(null)}
              >
                <Plus size={15} strokeWidth={2.5} />
                Nueva categoría
              </button>
            </div>
          )}
          {loadingCategories && <LoadingRow />}
          {categories && categories.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay categorías" />
          )}
          {categories && categories.length > 0 && (
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
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${category.name}`}
                            onClick={() => setEditingCategory(category)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${category.name}`}
                            onClick={() => {
                              if (confirm(`¿Eliminar ${category.name}?`)) {
                                deleteCategory.mutate(category.id)
                              }
                            }}
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
        </div>
      )}

      {tab === 'proveedores' && (
        <div className="card core-table-card">
          {canManage && (
            <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditingSupplier(null)}
              >
                <Plus size={15} strokeWidth={2.5} />
                Nuevo proveedor
              </button>
            </div>
          )}
          {loadingSuppliers && <LoadingRow />}
          {suppliers && suppliers.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay proveedores" />
          )}
          {suppliers && suppliers.length > 0 && (
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
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${supplier.company_name}`}
                            onClick={() => setEditingSupplier(supplier)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${supplier.company_name}`}
                            onClick={() => {
                              if (confirm(`¿Eliminar ${supplier.company_name}?`)) {
                                deleteSupplier.mutate(supplier.id)
                              }
                            }}
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
        </div>
      )}

      {tab === 'almacenes' && (
        <div className="card core-table-card">
          {canManage && (
            <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditingWarehouse(null)}
              >
                <Plus size={15} strokeWidth={2.5} />
                Nuevo almacén
              </button>
            </div>
          )}
          {loadingWarehouses && <LoadingRow />}
          {warehouses && warehouses.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay almacenes" />
          )}
          {warehouses && warehouses.length > 0 && (
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
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${warehouse.name}`}
                            onClick={() => setEditingWarehouse(warehouse)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${warehouse.name}`}
                            onClick={() => {
                              if (confirm(`¿Eliminar ${warehouse.name}?`)) {
                                deleteWarehouse.mutate(warehouse.id)
                              }
                            }}
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
        </div>
      )}

      {tab === 'stock' && canManage && (
        <StockAdjustTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'traslados' && canManage && (
        <StockTransferTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'kardex' && (
        <KardexTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'compras' && canManagePurchases && (
        <PurchaseOrdersTab
          canManage={canManagePurchases}
          suppliers={suppliers ?? []}
          warehouses={warehouses ?? []}
          products={allProducts ?? []}
        />
      )}

      {tab === 'impuestos' && canManagePurchases && (
        <TaxRatesTab canManage={canManagePurchases} />
      )}

      {tab === 'importar' && canManage && <CatalogImportTab />}

      {tab === 'etiquetas' && canManage && <LabelsPrintTab products={allProducts ?? []} />}

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
