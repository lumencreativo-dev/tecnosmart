"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit2, Package, Save, X, Filter, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";

type Producto = any;

export default function InventarioManager() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroMarca, setFiltroMarca] = useState("Todas");
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Eliminación con confirmación
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form
  const [form, setForm] = useState({
    nombre: "",
    codigo_sku: "",
    marca: "Hikvision",
    categoria: "Cámaras Analógicas",
    precio_venta: 0,
    precio_costo: 0,
    precio_tecnico: 0,
    stock: 0,
  });

  const cargarProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("nombre")
      .limit(500);

    if (!error && data) setProductos(data);
    setLoading(false);
  };

  useEffect(() => { cargarProductos(); }, []);

  // Extraer categorías y marcas únicas para los filtros
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach(p => { if (p.categoria) cats.add(p.categoria); });
    return ["Todas", ...Array.from(cats).sort()];
  }, [productos]);

  const marcas = useMemo(() => {
    const ms = new Set<string>();
    productos.forEach(p => { if (p.marca) ms.add(p.marca); });
    return ["Todas", ...Array.from(ms).sort()];
  }, [productos]);

  // Filtrado combinado (búsqueda + categoría + marca)
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchQuery = !query ||
        p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo_sku?.toLowerCase().includes(query.toLowerCase());
      const matchCat = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
      const matchMarca = filtroMarca === "Todas" || p.marca === filtroMarca;
      return matchQuery && matchCat && matchMarca;
    });
  }, [productos, query, filtroCategoria, filtroMarca]);

  // Estadísticas rápidas
  const totalProductos = productos.length;
  const conStock = productos.filter(p => (p.stock || 0) > 0).length;
  const sinStock = totalProductos - conStock;

  const openModal = (prod?: Producto) => {
    setSaveError(null);
    if (prod) {
      setEditingProd(prod);
      setForm({
        nombre: prod.nombre || "",
        codigo_sku: prod.codigo_sku || "",
        marca: prod.marca || "",
        categoria: prod.categoria || "",
        precio_venta: prod.precio_venta || 0,
        precio_costo: prod.precio_costo || 0,
        precio_tecnico: prod.precio_tecnico || 0,
        stock: prod.stock || 0,
      });
    } else {
      setEditingProd(null);
      setForm({ nombre: "", codigo_sku: "", marca: "Hikvision", categoria: "Cámaras Analógicas", precio_venta: 0, precio_costo: 0, precio_tecnico: 0, stock: 0 });
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingProd(null); setSaveError(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const payload = {
      nombre: form.nombre,
      codigo_sku: form.codigo_sku,
      marca: form.marca,
      categoria: form.categoria,
      precio_venta: form.precio_venta,
      precio_costo: form.precio_costo || 0,
      precio_tecnico: form.precio_tecnico || null,
      stock: form.stock,
      activo: true,
    };

    if (editingProd) {
      const { error } = await supabase.from("productos").update(payload).eq("id", editingProd.id);
      if (error) {
        setSaveError("Error al actualizar: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("productos").insert([payload]);
      if (error) {
        setSaveError("Error al crear: " + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeModal();
    cargarProductos();
  };

  const eliminarProducto = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
    if (!error) cargarProductos();
  };

  return (
    <div className="space-y-6">

      {/* ── Estadísticas rápidas ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 text-center">
          <p className="text-2xl font-bold text-[#111]">{totalProductos}</p>
          <p className="text-xs text-[#6e6e6e] font-medium">Total Productos</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{conStock}</p>
          <p className="text-xs text-[#6e6e6e] font-medium">Con Stock</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 text-center">
          <p className="text-2xl font-bold text-[#c9242b]">{sinStock}</p>
          <p className="text-xs text-[#6e6e6e] font-medium">Sin Stock</p>
        </div>
      </div>

      {/* ── Barra de herramientas ── */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
            />
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#6e6e6e] font-medium">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </div>
          
          {/* Categoría */}
          <div className="relative">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="appearance-none bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[#c9242b] cursor-pointer"
            >
              {categorias.map(c => <option key={c} value={c}>{c === "Todas" ? "📁 Todas las categorías" : c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6e6e6e] pointer-events-none" />
          </div>

          {/* Marca */}
          <div className="relative">
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="appearance-none bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[#c9242b] cursor-pointer"
            >
              {marcas.map(m => <option key={m} value={m}>{m === "Todas" ? "🏷️ Todas las marcas" : m}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6e6e6e] pointer-events-none" />
          </div>

          <span className="text-[10px] text-[#a0a0a0] ml-auto">
            {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Tabla de Productos ── */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-[#6e6e6e] text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5]">SKU</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5]">Producto</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5] hidden md:table-cell">Marca</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5] hidden lg:table-cell">Categoría</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5] text-right">Precio</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5] text-center">Stock</th>
                <th className="px-5 py-3 font-semibold border-b border-[#e5e5e5] text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {loading ? (
                // Skeleton loader
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[#f0f0f0] rounded animate-pulse w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6e6e6e]">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No se encontraron productos</p>
                    <p className="text-xs mt-1">Intenta cambiar los filtros o añade uno nuevo.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafafa] transition-colors group cursor-pointer" onClick={() => openModal(p)}>
                    <td className="px-5 py-3 text-xs font-mono text-[#6e6e6e] whitespace-nowrap">
                      {p.codigo_sku}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#111] leading-tight">{p.nombre}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#6e6e6e] whitespace-nowrap hidden md:table-cell">
                      {p.marca || "—"}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-[10px] font-medium text-[#6e6e6e] bg-[#f5f5f5] px-2 py-0.5 rounded">
                        {p.categoria || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-[#c9242b] text-right whitespace-nowrap">
                      {formatUSD(p.precio_venta)}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (p.stock || 0) > 5 ? "bg-green-100 text-green-800" :
                        (p.stock || 0) > 0 ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {p.stock || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(p); }}
                          className="text-[#d9d9d9] group-hover:text-[#c9242b] transition-colors p-1"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                          className="text-[#d9d9d9] hover:text-red-600 transition-colors p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Confirmar Eliminación ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-[#111] mb-1">¿Eliminar producto?</h2>
              <p className="text-sm text-[#6e6e6e] mb-1">
                <span className="font-mono font-bold text-[#c9242b]">{confirmDelete.codigo_sku}</span>
              </p>
              <p className="text-sm text-[#6e6e6e] mb-5">{confirmDelete.nombre}</p>
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-5">
                ⚠️ Esta acción es permanente y no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[#6e6e6e] hover:bg-[#f5f5f5] rounded-lg transition-colors border border-[#e5e5e5]"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarProducto}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Add/Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-[#e5e5e5]">
              <h2 className="text-lg font-bold text-[#111]">
                {editingProd ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={closeModal} className="text-[#6e6e6e] hover:text-[#c9242b] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Código SKU</label>
                  <input required type="text" value={form.codigo_sku}
                    onChange={(e) => setForm({ ...form, codigo_sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
                    placeholder="DS-2CD..." />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Marca</label>
                  <select required value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] bg-white appearance-none"
                  >
                    <option value="Hikvision">Hikvision</option>
                    <option value="HiLook">HiLook</option>
                    <option value="Ezviz">Ezviz</option>
                    <option value="Dahua">Dahua</option>
                    <option value="Tapo">Tapo</option>
                    <option value="TP-Link">TP-Link</option>
                    <option value="Marsiva">Marsiva</option>
                    <option value="ZKTeco">ZKTeco</option>
                    <option value="CDP">CDP</option>
                    <option value="Must">Must</option>
                    <option value="Starlink">Starlink</option>
                    <option value="Western Digital">Western Digital</option>
                    <option value="Seagate">Seagate</option>
                    <option value="Genérico">Genérico</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Nombre del Producto</label>
                <input required type="text" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
                  placeholder="Cámara Bullet 2MP ColorVu" />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Categoría</label>
                <select required value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] bg-white appearance-none"
                >
                  <option value="Cámaras Analógicas">Cámaras Analógicas</option>
                  <option value="Cámaras IP">Cámaras IP</option>
                  <option value="Cámaras WiFi / PTZ">Cámaras WiFi / PTZ</option>
                  <option value="DVR / NVR">DVR / NVR</option>
                  <option value="Discos Duros">Discos Duros</option>
                  <option value="Cables y Bobinas">Cables y Bobinas</option>
                  <option value="Conectores y Baluns">Conectores y Baluns</option>
                  <option value="Fuentes de Poder / UPS">Fuentes de Poder / UPS</option>
                  <option value="Control de Acceso">Control de Acceso</option>
                  <option value="Redes y Routers">Redes y Routers</option>
                  <option value="Alarmas">Alarmas</option>
                  <option value="Domótica">Domótica</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Precio Público (Venta)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6e6e6e]">$</span>
                    <input required type="number" step="0.01" min="0" value={form.precio_venta}
                      onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-[#d9d9d9] rounded-lg text-sm font-bold text-[#c9242b] focus:outline-none focus:border-[#c9242b]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Costo (Precio de compra)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6e6e6e]">$</span>
                    <input type="number" step="0.01" min="0" value={form.precio_costo}
                      onChange={(e) => setForm({ ...form, precio_costo: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-[#d9d9d9] rounded-lg text-sm font-bold text-amber-700 focus:outline-none focus:border-[#c9242b]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Precio Técnico (15% menos)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6e6e6e]">$</span>
                    <input type="number" step="0.01" min="0" value={form.precio_tecnico}
                      onChange={(e) => setForm({ ...form, precio_tecnico: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-[#d9d9d9] rounded-lg text-sm font-bold focus:outline-none focus:border-[#c9242b]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">Stock</label>
                  <input required type="number" min="0" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] text-center font-bold" />
                </div>
              </div>
              
              {/* Error */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-lg">
                  {saveError}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-2 border-t border-[#e5e5e5]">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2 text-sm font-medium text-[#6e6e6e] hover:bg-[#f5f5f5] rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingProd ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
