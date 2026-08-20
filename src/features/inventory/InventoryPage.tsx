import { Pencil, PackageSearch, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import '../core/CorePage.css'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from '../auth/hooks/useAuth'
import { AttributesTab } from './components/AttributesTab'
import { BrandFormModal } from './components/BrandFormModal'
import { CatalogImportTab } from './components/CatalogImportTab'
import { CategoryFormModal } from './components/CategoryFormModal'
import { KardexTab } from './components/KardexTab'
import { LabelsPrintTab } from './components/LabelsPrintTab'
import { ProductDetailModal } from './components/ProductDetailModal'
import { ProductFormModal } from './components/ProductFormModal'
import { ProductsTab } from './components/ProductsTab'
import { PurchaseOrdersTab } from './components/PurchaseOrdersTab'
import { StockAdjustTab } from './components/StockAdjustTab'
import { StockTransferTab } from './components/StockTransferTab'
import { SupplierFormModal } from './components/SupplierFormModal'
import { TaxRatesTab } from './components/TaxRatesTab'
import { WarehouseFormModal } from './components/WarehouseFormModal'
import type { Brand, Category, Product, Supplier, Warehouse } from './api'
import { useAttributes } from './hooks/useAttributes'
import { useBrands, useDeleteBrand } from './hooks/useBrands'
import { useCategories, useDeleteCategory, useUpdateCategory } from './hooks/useCategories'
import { useDeleteProduct, useProducts } from './hooks/useProducts'
import { useDeleteSupplier, useSuppliers } from './hooks/useSuppliers'
import { useAllStock } from './hooks/useStock'
import { useDeleteWarehouse, useWarehouses } from './hooks/useWarehouses'

type Tab =
  | 'productos'
  | 'categorias'
  | 'marcas'
  | 'proveedores'
  | 'atributos'
  | 'almacenes'
  | 'stock'
  | 'traslados'
  | 'kardex'
  | 'compras'
  | 'impuestos'
  | 'importar'
  | 'etiquetas'

// 11 pestañas en una sola barra se desbordaban (texto partido en varias
// lineas, scroll horizontal para llegar a las ultimas). Agrupadas en 3
// categorias con sentido de negocio: cada una cabe sin desbordar y el
// usuario ve de entrada solo las ~4-5 pestañas de la seccion que le
// interesa, no las 11 juntas.
const TAB_GROUPS: { id: string; label: string; tabs: [Tab, string][] }[] = [
  {
    id: 'catalogo',
    label: 'Catálogo',
    tabs: [
      ['productos', 'Productos'],
      ['categorias', 'Categorías'],
      ['marcas', 'Marcas'],
      ['proveedores', 'Proveedores'],
      ['atributos', 'Atributos'],
      ['importar', 'Importar catálogo'],
      ['etiquetas', 'Imprimir etiquetas'],
    ],
  },
  {
    id: 'almacenes',
    label: 'Almacenes y stock',
    tabs: [
      ['almacenes', 'Almacenes'],
      ['stock', 'Ajustar stock'],
      ['traslados', 'Traslado de stock'],
      ['kardex', 'Kardex'],
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    tabs: [
      ['compras', 'Compras'],
      ['impuestos', 'Impuestos'],
    ],
  },
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

  const {
    data: categories,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useCategories()
  const { data: brands, isLoading: loadingBrands } = useBrands()
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses()
  const { data: attributes } = useAttributes()
  const { data: products, isLoading: loadingProducts } = useProducts({ search })
  // Sin filtro de busqueda -Kardex/Ajustar stock necesitan el catalogo
  // completo, independiente de lo que el usuario haya buscado en la tab
  // Productos (son pestañas distintas, no deberian compartir ese estado).
  const { data: allProducts } = useProducts()
  const { data: allStock } = useAllStock()

  const deleteCategory = useDeleteCategory()
  const updateCategory = useUpdateCategory()
  const deleteBrand = useDeleteBrand()
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
  const [editingBrand, setEditingBrand] = useState<Brand | null | undefined>(undefined)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | undefined>(undefined)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null | undefined>(undefined)
  const [showAttributeForm, setShowAttributeForm] = useState(false)
  const [showTaxRateForm, setShowTaxRateForm] = useState(false)
  const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false)

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null)

  const visibleGroups = TAB_GROUPS.map((group) => ({
    ...group,
    tabs: group.tabs.filter(
      ([value]) =>
        (!['stock', 'importar', 'etiquetas'].includes(value) || canManage) &&
        (value !== 'traslados' || (canManage && (warehouses?.length ?? 0) > 1)) &&
        (!['compras', 'impuestos'].includes(value) || canManagePurchases),
    ),
  })).filter((group) => group.tabs.length > 0)

  const activeGroup =
    visibleGroups.find((group) => group.tabs.some(([value]) => value === tab)) ?? visibleGroups[0]

  // La accion "Nuevo X" vivia adentro de la tarjeta de cada tabla, como si
  // fuera un control mas de esa tabla -pasa a la misma fila que las
  // sub-pestañas (nivel de pagina, no de tabla), un botón distinto segun
  // la pestaña activa.
  let primaryAction: ReactNode = null
  if (tab === 'productos' && canManage) {
    primaryAction = (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setShowProductForm(true)
          void refetchCategories()
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Nuevo producto
      </button>
    )
  } else if (tab === 'categorias' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingCategory(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nueva categoría
      </button>
    )
  } else if (tab === 'marcas' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingBrand(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nueva marca
      </button>
    )
  } else if (tab === 'proveedores' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingSupplier(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo proveedor
      </button>
    )
  } else if (tab === 'almacenes' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingWarehouse(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo almacén
      </button>
    )
  } else if (tab === 'atributos' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setShowAttributeForm(true)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo atributo
      </button>
    )
  } else if (tab === 'compras' && canManagePurchases) {
    primaryAction = (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowPurchaseOrderForm(true)}
      >
        <Plus size={15} strokeWidth={2.5} />
        Nueva orden de compra
      </button>
    )
  } else if (tab === 'impuestos' && canManagePurchases) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setShowTaxRateForm(true)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo impuesto
      </button>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Inventario</h1>
          <p className="core-page-subtitle">Catálogo, almacenes y proveedores</p>
        </div>
      </div>

      {visibleGroups.length > 1 && (
        <div className="tab-groups">
          {visibleGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`tab-group ${activeGroup.id === group.id ? 'tab-group-active' : ''}`}
              onClick={() => setTab(group.tabs[0][0])}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}

      <div className="tabs-toolbar-row">
        <div className="tabs">
          {activeGroup.tabs.map(([value, label]) => (
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
        {primaryAction}
      </div>

      {tab === 'productos' && (
        <ProductsTab
          products={products}
          loading={loadingProducts}
          search={search}
          onSearchChange={setSearch}
          categories={categories ?? []}
          brands={brands ?? []}
          suppliers={suppliers ?? []}
          warehouses={warehouses ?? []}
          attributes={attributes ?? []}
          allStock={allStock}
          canManage={canManage}
          onViewProduct={setViewingProductId}
          onDeleteProduct={setDeletingProduct}
        />
      )}

      {tab === 'categorias' && (
        <div className="card core-table-card">
          {loadingCategories && <LoadingRow />}
          {categories && categories.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay categorías" />
          )}
          {categories && categories.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th
                    title="Los productos de esta categoría se agrupan en la tabla de Productos por el valor de este atributo (ej. Talla). Cada categoría puede usar uno distinto, o ninguno."
                  >
                    Atributo de agrupación
                  </th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="core-table-strong">{category.name}</td>
                    <td>
                      {canManage ? (
                        <select
                          value={category.primary_attribute ?? ''}
                          onChange={(event) =>
                            updateCategory.mutate({
                              id: category.id,
                              data: {
                                primary_attribute: event.target.value
                                  ? Number(event.target.value)
                                  : null,
                              },
                            })
                          }
                          aria-label={`Atributo de agrupación de ${category.name}`}
                          style={{ maxWidth: 180 }}
                        >
                          <option value="">Sin agrupar</option>
                          {attributes?.map((attribute) => (
                            <option key={attribute.id} value={attribute.id}>
                              {attribute.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        (attributes?.find((a) => a.id === category.primary_attribute)?.name ?? '—')
                      )}
                    </td>
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
                            onClick={() => setDeletingCategory(category)}
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

      {tab === 'marcas' && (
        <div className="card core-table-card">
          {loadingBrands && <LoadingRow />}
          {brands && brands.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay marcas" />
          )}
          {brands && brands.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="core-table-strong">{brand.name}</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${brand.name}`}
                            onClick={() => setEditingBrand(brand)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${brand.name}`}
                            onClick={() => setDeletingBrand(brand)}
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
                            onClick={() => setDeletingSupplier(supplier)}
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

      {tab === 'atributos' && (
        <AttributesTab
          canManage={canManage}
          showCreateForm={showAttributeForm}
          onCloseCreateForm={() => setShowAttributeForm(false)}
        />
      )}

      {tab === 'almacenes' && (
        <div className="card core-table-card">
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
                            onClick={() => setDeletingWarehouse(warehouse)}
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
          showCreateForm={showPurchaseOrderForm}
          onCloseCreateForm={() => setShowPurchaseOrderForm(false)}
        />
      )}

      {tab === 'impuestos' && canManagePurchases && (
        <TaxRatesTab
          canManage={canManagePurchases}
          showCreateForm={showTaxRateForm}
          onCloseCreateForm={() => setShowTaxRateForm(false)}
        />
      )}

      {tab === 'importar' && canManage && <CatalogImportTab />}

      {tab === 'etiquetas' && canManage && <LabelsPrintTab products={allProducts ?? []} />}

      {showProductForm && (
        <ProductFormModal
          categories={categories ?? []}
          brands={brands ?? []}
          suppliers={suppliers ?? []}
          attributes={attributes ?? []}
          onConfigureCategory={setEditingCategory}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          canManage={canManage}
          attributes={attributes ?? []}
          onClose={() => setViewingProductId(null)}
        />
      )}

      {editingCategory !== undefined && (
        <CategoryFormModal
          editingCategory={editingCategory}
          attributes={attributes ?? []}
          onClose={() => setEditingCategory(undefined)}
        />
      )}

      {editingBrand !== undefined && (
        <BrandFormModal editingBrand={editingBrand} onClose={() => setEditingBrand(undefined)} />
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

      {deletingProduct && (
        <ConfirmDialog
          title="Dar de baja producto"
          message={`¿Dar de baja "${deletingProduct.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Dar de baja"
          onConfirm={() => deleteProduct.mutate(deletingProduct.id)}
          onClose={() => setDeletingProduct(null)}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar "${deletingCategory.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteCategory.mutate(deletingCategory.id)}
          onClose={() => setDeletingCategory(null)}
        />
      )}

      {deletingBrand && (
        <ConfirmDialog
          title="Eliminar marca"
          message={`¿Eliminar "${deletingBrand.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteBrand.mutate(deletingBrand.id)}
          onClose={() => setDeletingBrand(null)}
        />
      )}

      {deletingSupplier && (
        <ConfirmDialog
          title="Eliminar proveedor"
          message={`¿Eliminar "${deletingSupplier.company_name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteSupplier.mutate(deletingSupplier.id)}
          onClose={() => setDeletingSupplier(null)}
        />
      )}

      {deletingWarehouse && (
        <ConfirmDialog
          title="Eliminar almacén"
          message={`¿Eliminar "${deletingWarehouse.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteWarehouse.mutate(deletingWarehouse.id)}
          onClose={() => setDeletingWarehouse(null)}
        />
      )}
    </div>
  )
}
