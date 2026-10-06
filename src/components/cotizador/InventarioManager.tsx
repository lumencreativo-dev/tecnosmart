"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Package, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";

type Producto = any; // Tipo simplificado

export default function InventarioManager() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  
  // Estado Modal Edit/Add
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  
  // Formulario
  const [form, setForm] = useState({
    nombre: "",
    codigo_sku: "",
    marca: "Hikvision",
    categoria: "Cámaras",
    precio_venta: 0,
    precio_tecnico: 0,
    stock: 0,
  });

  const cargarProductos = async (searchQuery = "") => {
    setLoading(true);
    let q = supabase.from("productos").select("*").order("nombre");
    
    if (searchQuery) {
      q = q.or(`nombre.ilike.%${searchQuery}%,codigo_sku.ilike.%${searchQuery}%`);
    }

    const { data, error } = await q.limit(100); // Límite para rendimiento UI
    if (!error && data) {
      setProductos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    cargarProductos(query);
  };

  const openModal = (prod?: Producto) => {
    if (prod) {
      setEditingProd(prod);
      setForm({
        nombre: prod.nombre,
        codigo_sku: prod.codigo_sku,
        marca: prod.marca || "Hikvision",
        categoria: prod.categoria || "Cámaras",
        precio_venta: prod.precio_venta || 0,
        precio_tecnico: prod.precio_tecnico || 0,
        stock: prod.stock || 0,
      });
    } else {
      setEditingProd(null);
      setForm({
        nombre: "",
        codigo_sku: "",
        marca: "Hikvision",
        categoria: "Cámaras",
        precio_venta: 0,
        precio_tecnico: 0,
        stock: 0,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProd(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...form,
      activo: true,
    };

    if (editingProd) {
      // Update
      await supabase.from("productos").update(payload).eq("id", editingProd.id);
    } else {
      // Insert
      await supabase.from("productos").insert([payload]);
    }
    
    closeModal();
    cargarProductos(query); // Refrescar lista
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#d9d9d9] overflow-hidden">
      
      {/* ── Toolbar ── */}
      <div className="p-6 border-b border-[#e5e5e5] flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
          />
        </form>
        
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir Producto
        </button>
      </div>

      {/* ── Tabla de Productos ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[#6e6e6e] text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5]">Código SKU</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5]">Producto</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5]">Marca</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5] text-right">Precio Público</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5] text-right">Precio Técnico</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5] text-center">Stock</th>
              <th className="px-6 py-4 font-semibold border-b border-[#e5e5e5] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[#6e6e6e]">Cargando inventario...</td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[#6e6e6e]">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-[#111111] whitespace-nowrap">
                    {p.codigo_sku}
                  </td>
                  <td className="px-6 py-3 text-sm text-[#111111]">
                    {p.nombre}
                  </td>
                  <td className="px-6 py-3 text-sm text-[#6e6e6e] whitespace-nowrap">
                    {p.marca || "—"}
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-[#c9242b] text-right whitespace-nowrap">
                    {formatUSD(p.precio_venta)}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-[#111] text-right whitespace-nowrap">
                    {p.precio_tecnico != null ? formatUSD(p.precio_tecnico) : "—"}
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      (p.stock || 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {p.stock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => openModal(p)}
                      className="text-[#6e6e6e] hover:text-[#c9242b] transition-colors p-1"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Add/Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#e5e5e5] bg-[#f8fafc]">
              <h2 className="text-lg font-bold text-[#111111]">
                {editingProd ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={closeModal} className="text-[#6e6e6e] hover:text-[#c9242b]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Código SKU
                  </label>
                  <input
                    required
                    type="text"
                    value={form.codigo_sku}
                    onChange={(e) => setForm({ ...form, codigo_sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm"
                    placeholder="Ej: DS-2CD..."
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Marca
                  </label>
                  <input
                    required
                    type="text"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm"
                  />
                </div>

                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    required
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm"
                    placeholder="Ej: Cámara Bullet 2MP ColorVu"
                  />
                </div>

                {/* Categoría */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Categoría
                  </label>
                  <input
                    required
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm"
                    placeholder="Ej: Cámaras Analógicas"
                  />
                </div>

                {/* Precio Venta */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Precio Público (USD)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio_venta}
                    onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm font-bold text-[#c9242b]"
                  />
                </div>

                {/* Precio Técnico */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Precio Técnico (USD)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio_tecnico}
                    onChange={(e) => setForm({ ...form, precio_tecnico: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm font-bold"
                  />
                </div>
                
                {/* Stock */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
                    Stock Disponible
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#c9242b] text-sm"
                  />
                </div>

              </div>
              
              <div className="pt-4 border-t border-[#e5e5e5] flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-semibold text-[#6e6e6e] hover:bg-[#f5f5f5] rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-bold transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
