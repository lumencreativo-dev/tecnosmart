"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit2, Package, Save, X, Filter, ChevronDown, Trash2,
  AlertTriangle, Eye, Lock, Sliders, Percent, HelpCircle, Check,
  RotateCcw, Sparkles, Loader2, ArrowRight, DollarSign, CheckCircle2, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";

// ─────────────────────────────────────────────────────────────
// TIPOS Y CONSTANTES
// ─────────────────────────────────────────────────────────────
export type TipoMargen = "utilidad" | "markup";

export interface MargenConfig {
  tipo: TipoMargen;
  porcentaje: number;           // Default: 28%
  descuentoTecnicoPct: number;  // Default: 15%
}

export function calcularPrecios(
  costo: number,
  tipoMargen: TipoMargen,
  porcentajeMargen: number,
  descuentoTecnicoPct: number = 15
): { precioVenta: number; precioTecnico: number; ganancia: number; margenRealPct: number } {
  if (costo <= 0) {
    return { precioVenta: 0, precioTecnico: 0, ganancia: 0, margenRealPct: 0 };
  }

  let precioVenta = 0;
  if (tipoMargen === "utilidad") {
    // Margen de Utilidad sobre Precio de Venta: P = C / (1 - M)
    const m = Math.min(Math.max(0, porcentajeMargen), 99) / 100;
    precioVenta = costo / (1 - m);
  } else {
    // Markup sobre Costo: P = C * (1 + M)
    const m = Math.max(0, porcentajeMargen) / 100;
    precioVenta = costo * (1 + m);
  }

  precioVenta = Math.round(precioVenta * 100) / 100;

  // Precio Técnico: descuento sobre precio de venta sin bajar del costo + 5%
  let precioTecnico = Math.round(precioVenta * (1 - descuentoTecnicoPct / 100) * 100) / 100;
  if (precioTecnico < costo) {
    precioTecnico = Math.round(costo * 1.05 * 100) / 100;
  }

  const ganancia = Math.round((precioVenta - costo) * 100) / 100;
  const margenRealPct = precioVenta > 0 ? Math.round(((precioVenta - costo) / precioVenta) * 1000) / 10 : 0;

  return { precioVenta, precioTecnico, ganancia, margenRealPct };
}

const MARCAS_PREDETERMINADAS = [
  "Huawei", "Hikvision", "CDP", "EZVIZ", "Cablix", "STC", "LinkedPro",
  "Hiksemi", "Adata", "Acer", "Dahua", "HiLook", "Tapo", "TP-Link",
  "ZKTeco", "Must", "Starlink", "Western Digital", "Seagate", "Grandstream", "Genérico", "Otra"
];

const CATEGORIAS_PREDETERMINADAS = [
  "Fuentes de Poder / UPS",
  "Reguladores de Voltaje / AVR",
  "Inversores y Baterías",
  "Cámaras WiFi / PTZ",
  "Cámaras Analógicas y Domos",
  "Cámaras IP y NVR",
  "Conectividad y Fibra Óptica",
  "Cajas de Empalme y ODF",
  "Carretes de Fibra y Cables",
  "Herrajes y Fijación",
  "Herramientas y Limpiadores",
  "Switches Empresariales",
  "Redes, Routers y OLT/ONT",
  "Discos Duros y SSD",
  "Memorias RAM y MicroSD",
  "Video Porteros y Pantallas",
  "Cerraduras y Control de Acceso",
  "Alarmas y Sensores",
  "Domótica y Smart Home",
  "Accesorios y Varios"
];

type Producto = {
  id: string;
  codigo_sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio_costo: number;
  precio_venta: number;
  precio_tecnico: number;
  stock: number;
  activo?: boolean;
  margen_individual?: number;
};

// Limpia campos internos antes de enviar a Supabase
function sanitizarPayload(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  const validKeys = [
    "codigo_sku", "nombre", "marca", "categoria",
    "precio_costo", "precio_venta", "precio_tecnico", "stock", "activo"
  ];
  for (const k of validKeys) {
    if (data[k] !== undefined) {
      clean[k] = data[k];
    }
  }
  return clean;
}

export default function InventarioManager() {
  const { usuario } = useUsuario();
  const [isTecHost, setIsTecHost] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      setIsTecHost(host.startsWith("tec.") || host.startsWith("tec.localhost"));
    }
  }, []);

  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeGestionarStock = tienePermiso(permisosUsuario, "inventario.gestionar");
  // Ocultar estrictamente costos y márgenes en tec. o si el rol no tiene el permiso explícito
  const puedeVerCostos = !isTecHost && tienePermiso(permisosUsuario, "inventario.costos");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroMarca, setFiltroMarca] = useState("Todas");

  // Motor de Márgenes Centralizado Global
  const [margenConfig, setMargenConfig] = useState<MargenConfig>({
    tipo: "utilidad",
    porcentaje: 28,
    descuentoTecnicoPct: 15,
  });

  // Edición Rápida Inline
  const [editedRows, setEditedRows] = useState<Record<string, Partial<Producto>>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal Aplicar Margen Masivo
  const [modalAplicarMargen, setModalAplicarMargen] = useState(false);
  const [aplicandoMargenMasivo, setAplicandoMargenMasivo] = useState(false);

  // Modal Crear / Editar Completo
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Eliminación con confirmación
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form para modal completo
  const [form, setForm] = useState({
    nombre: "",
    codigo_sku: "",
    marca: "Hikvision",
    categoria: "Cámaras Analógicas y Domos",
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
      .limit(600);

    if (!error && data) setProductos(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Extraer categorías y marcas únicas combinadas para filtros y modal
  const categorias = useMemo(() => {
    const cats = new Set<string>(CATEGORIAS_PREDETERMINADAS);
    productos.forEach(p => { if (p.categoria) cats.add(p.categoria); });
    return ["Todas", ...Array.from(cats).sort()];
  }, [productos]);

  const marcas = useMemo(() => {
    const ms = new Set<string>(MARCAS_PREDETERMINADAS);
    productos.forEach(p => { if (p.marca) ms.add(p.marca); });
    return ["Todas", ...Array.from(ms).sort()];
  }, [productos]);

  const listaMarcasOpciones = useMemo(() => {
    const ms = new Set<string>(MARCAS_PREDETERMINADAS);
    productos.forEach(p => { if (p.marca) ms.add(p.marca); });
    return Array.from(ms).sort();
  }, [productos]);

  const listaCategoriasOpciones = useMemo(() => {
    const cs = new Set<string>(CATEGORIAS_PREDETERMINADAS);
    productos.forEach(p => { if (p.categoria) cs.add(p.categoria); });
    return Array.from(cs).sort();
  }, [productos]);

  // Filtrado combinado
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
  const conStock = productos.filter(p => {
    const stockActual = editedRows[p.id]?.stock !== undefined ? (editedRows[p.id]?.stock || 0) : (p.stock || 0);
    return stockActual > 0;
  }).length;
  const sinStock = totalProductos - conStock;

  const numCambiosPendientes = Object.keys(editedRows).length;

  // ─────────────────────────────────────────────────────────────
  // CONTROLADORES DE EDICIÓN RÁPIDA INLINE
  // ─────────────────────────────────────────────────────────────
  const actualizarCampoInline = (id: string, campo: keyof Producto, valor: any) => {
    setEditedRows(prev => {
      const actual = prev[id] || {};
      return {
        ...prev,
        [id]: {
          ...actual,
          [campo]: valor,
        }
      };
    });
  };

  // Cambio de Costo individual: usa el margen individual del producto si existe, o el margen global
  const handleCostoChange = (prod: Producto, nuevoCostoStr: string) => {
    const val = parseFloat(nuevoCostoStr.replace(",", ".")) || 0;
    const dirty = editedRows[prod.id];
    
    // Margen a utilizar para este producto en específico
    const margenAUsar = dirty?.margen_individual !== undefined
      ? dirty.margen_individual
      : (prod.precio_venta > 0 && prod.precio_costo > 0
          ? Math.round(((prod.precio_venta - prod.precio_costo) / prod.precio_venta) * 100)
          : margenConfig.porcentaje);

    const { precioVenta, precioTecnico } = calcularPrecios(
      val,
      margenConfig.tipo,
      margenAUsar,
      margenConfig.descuentoTecnicoPct
    );

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          precio_costo: val,
          precio_venta: precioVenta,
          precio_tecnico: precioTecnico,
          margen_individual: margenAUsar,
        }
      };
    });
  };

  // Cambio de Margen individual de una sola fila (sin tocar a los demás productos)
  const handleMargenFilaChange = (prod: Producto, nuevoMargenStr: string) => {
    const nuevoMargen = parseFloat(nuevoMargenStr.replace(",", ".")) || 0;
    const costoActual = editedRows[prod.id]?.precio_costo !== undefined
      ? (editedRows[prod.id]?.precio_costo || 0)
      : (prod.precio_costo || 0);

    let nuevoPV = 0;
    let nuevoPT = 0;

    if (costoActual > 0) {
      const { precioVenta, precioTecnico } = calcularPrecios(
        costoActual,
        margenConfig.tipo,
        nuevoMargen,
        margenConfig.descuentoTecnicoPct
      );
      nuevoPV = precioVenta;
      nuevoPT = precioTecnico;
    }

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          margen_individual: nuevoMargen,
          ...(costoActual > 0 ? { precio_venta: nuevoPV, precio_tecnico: nuevoPT } : {}),
        }
      };
    });
  };

  // Cambio directo de Precio de Venta: recalcula el margen individual y el precio técnico
  const handlePrecioVentaChange = (prod: Producto, nuevoPVPStr: string) => {
    const pv = parseFloat(nuevoPVPStr.replace(",", ".")) || 0;
    const costoActual = editedRows[prod.id]?.precio_costo !== undefined
      ? (editedRows[prod.id]?.precio_costo || 0)
      : (prod.precio_costo || 0);

    let pt = Math.round(pv * (1 - margenConfig.descuentoTecnicoPct / 100) * 100) / 100;
    if (costoActual > 0 && pt < costoActual) {
      pt = Math.round(costoActual * 1.05 * 100) / 100;
    }

    const nuevoMargenCalculado = pv > 0 && costoActual > 0
      ? Math.round(((pv - costoActual) / pv) * 100)
      : 0;

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          precio_venta: pv,
          precio_tecnico: pt,
          margen_individual: nuevoMargenCalculado,
        }
      };
    });
  };

  const handlePrecioTecnicoChange = (prod: Producto, nuevoPTStr: string) => {
    const pt = parseFloat(nuevoPTStr.replace(",", ".")) || 0;
    actualizarCampoInline(prod.id, "precio_tecnico", pt);
  };

  const handleStockChange = (prod: Producto, nuevoStockStr: string) => {
    const st = parseInt(nuevoStockStr) || 0;
    actualizarCampoInline(prod.id, "stock", Math.max(0, st));
  };

  // Guardar cambio de una sola fila
  const guardarFilaIndividual = async (prod: Producto) => {
    if (!puedeGestionarStock) return;
    const cambios = editedRows[prod.id];
    if (!cambios) return;

    setSavingRowId(prod.id);
    const payload = sanitizarPayload(cambios);
    const { error } = await supabase
      .from("productos")
      .update(payload)
      .eq("id", prod.id);

    if (!error) {
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, ...payload } : p));
      setEditedRows(prev => {
        const next = { ...prev };
        delete next[prod.id];
        return next;
      });
      mostrarAvisoExito(`SKU ${prod.codigo_sku} actualizado correctamente.`);
    } else {
      alert("Error al guardar: " + error.message);
    }
    setSavingRowId(null);
  };

  // Descartar cambios de una fila individual
  const descartarFilaIndividual = (id: string) => {
    setEditedRows(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Descartar todos los cambios pendientes
  const descartarTodosLosCambios = () => {
    setEditedRows({});
  };

  // Guardar todos los cambios pendientes en Supabase
  const guardarTodosLosCambios = async () => {
    if (!puedeGestionarStock) return;
    const ids = Object.keys(editedRows);
    if (ids.length === 0) return;

    setGuardandoLote(true);
    try {
      const updates = ids.map(id =>
        supabase.from("productos").update(sanitizarPayload(editedRows[id])).eq("id", id)
      );
      await Promise.all(updates);

      setProductos(prev =>
        prev.map(p => editedRows[p.id] ? { ...p, ...sanitizarPayload(editedRows[p.id]) } : p)
      );
      setEditedRows({});
      mostrarAvisoExito(`Se guardaron exitosamente los cambios de ${ids.length} productos.`);
    } catch (err: any) {
      alert("Ocurrió un error al guardar cambios en lote: " + (err?.message || ""));
    } finally {
      setGuardandoLote(false);
    }
  };

  const mostrarAvisoExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // RECALCULACIÓN BASADA EN MOTOR DE MÁRGENES (GLOBAL)
  // ─────────────────────────────────────────────────────────────
  const recalcularPreciosEnVista = (nuevoTipo?: TipoMargen, nuevoPct?: number, nuevoDesc?: number) => {
    const tipo = nuevoTipo ?? margenConfig.tipo;
    const pct = nuevoPct ?? margenConfig.porcentaje;
    const desc = nuevoDesc ?? margenConfig.descuentoTecnicoPct;

    const nuevosCambios: Record<string, Partial<Producto>> = { ...editedRows };

    productosFiltrados.forEach(p => {
      const costo = nuevosCambios[p.id]?.precio_costo !== undefined
        ? (nuevosCambios[p.id]?.precio_costo || 0)
        : (p.precio_costo || 0);

      if (costo > 0) {
        const { precioVenta, precioTecnico } = calcularPrecios(costo, tipo, pct, desc);
        nuevosCambios[p.id] = {
          ...nuevosCambios[p.id],
          precio_venta: precioVenta,
          precio_tecnico: precioTecnico,
          margen_individual: pct,
        };
      }
    });

    setEditedRows(nuevosCambios);
  };

  const aplicarNuevoMargen = (tipo: TipoMargen, porcentaje: number, descuentoTecnicoPct: number) => {
    setMargenConfig({ tipo, porcentaje, descuentoTecnicoPct });
    recalcularPreciosEnVista(tipo, porcentaje, descuentoTecnicoPct);
  };

  // Aplicar margen masivo directamente a la BD
  const ejecutarAplicacionMargenEnBD = async () => {
    if (!puedeGestionarStock) return;
    setAplicandoMargenMasivo(true);

    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, precio_costo")
        .gt("precio_costo", 0);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No hay productos con costo registrado para recalcular.");
        setModalAplicarMargen(false);
        return;
      }

      const updates = data.map(item => {
        const { precioVenta, precioTecnico } = calcularPrecios(
          item.precio_costo,
          margenConfig.tipo,
          margenConfig.porcentaje,
          margenConfig.descuentoTecnicoPct
        );
        return supabase
          .from("productos")
          .update({
            precio_venta: precioVenta,
            precio_tecnico: precioTecnico,
          })
          .eq("id", item.id);
      });

      await Promise.all(updates);

      setModalAplicarMargen(false);
      setEditedRows({});
      await cargarProductos();
      mostrarAvisoExito(`Se recalcularon y guardaron los precios de ${data.length} productos con éxito.`);
    } catch (err: any) {
      alert("Error al aplicar margen en BD: " + err.message);
    } finally {
      setAplicandoMargenMasivo(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL CREAR / EDITAR PRODUCTO (AQUÍ SÍ SE EDITA MARCA Y CATEGORÍA)
  // ─────────────────────────────────────────────────────────────
  const openModal = (prod?: Producto) => {
    setSaveError(null);
    if (prod) {
      const fila = editedRows[prod.id] ? { ...prod, ...editedRows[prod.id] } : prod;
      setEditingProd(prod);
      setForm({
        nombre: fila.nombre || "",
        codigo_sku: fila.codigo_sku || "",
        marca: fila.marca || "Hikvision",
        categoria: fila.categoria || "Cámaras Analógicas y Domos",
        precio_venta: fila.precio_venta || 0,
        precio_costo: fila.precio_costo || 0,
        precio_tecnico: fila.precio_tecnico || 0,
        stock: fila.stock || 0,
      });
    } else {
      setEditingProd(null);
      setForm({
        nombre: "",
        codigo_sku: "",
        marca: "Hikvision",
        categoria: "Cámaras Analógicas y Domos",
        precio_venta: 0,
        precio_costo: 0,
        precio_tecnico: 0,
        stock: 0
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProd(null);
    setSaveError(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionarStock) {
      setSaveError("No tienes facultades para modificar o crear productos en el inventario.");
      return;
    }
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
      if (editedRows[editingProd.id]) {
        setEditedRows(prev => {
          const next = { ...prev };
          delete next[editingProd.id];
          return next;
        });
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
    mostrarAvisoExito(editingProd ? "Producto actualizado correctamente." : "Nuevo producto creado con éxito.");
  };

  const eliminarProducto = async () => {
    if (!confirmDelete || !puedeGestionarStock) return;
    setDeleting(true);
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
    if (!error) {
      if (editedRows[confirmDelete.id]) {
        setEditedRows(prev => {
          const next = { ...prev };
          delete next[confirmDelete.id];
          return next;
        });
      }
      cargarProductos();
      mostrarAvisoExito("Producto eliminado del inventario.");
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Aviso Toast de Éxito ── */}
      {mensajeExito && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span className="text-sm font-semibold">{mensajeExito}</span>
        </div>
      )}

      {/* ── Estadísticas Rápidas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--ts-text-primary)]">{totalProductos}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium">Total Productos Registrados</p>
        </div>
        <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-400">{conStock}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium">Con Stock Disponible</p>
        </div>
        <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--ts-red)]">{sinStock}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium">Sin Stock (Agotados)</p>
        </div>
      </div>

      {/* ── MOTOR DE MÁRGENES Y FIJACIÓN DE PRECIOS CENTRALIZADO ── */}
      {puedeVerCostos && (
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--ts-border)]">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--ts-red)]" />
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] tracking-wide">
                Motor de Márgenes y Fijación de Precios de Venta
              </h2>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
              Control general para el lote. Recuerda que abajo puedes ajustar el margen individual de cada producto de forma independiente.
            </p>
          </div>

          {/* Switch Utilidad vs Markup */}
          <div className="flex items-center bg-[var(--ts-surface-2)] p-1 rounded-2xl border border-[var(--ts-border)] self-start md:self-center">
            <button
              type="button"
              onClick={() => aplicarNuevoMargen("utilidad", margenConfig.porcentaje, margenConfig.descuentoTecnicoPct)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                margenConfig.tipo === "utilidad"
                  ? "bg-[var(--ts-red)] text-white shadow-sm"
                  : "text-[var(--ts-text-muted)] hover:text-white"
              }`}
            >
              Margen de Utilidad (Sobre Venta)
            </button>
            <button
              type="button"
              onClick={() => aplicarNuevoMargen("markup", margenConfig.porcentaje, margenConfig.descuentoTecnicoPct)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                margenConfig.tipo === "markup"
                  ? "bg-[var(--ts-red)] text-white shadow-sm"
                  : "text-[var(--ts-text-muted)] hover:text-white"
              }`}
            >
              Markup (Sobre Costo)
            </button>
          </div>
        </div>

        {/* Controles de Porcentaje, Presets y Descuento Técnico */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Input de Porcentaje */}
          <div className="md:col-span-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-[var(--ts-text-primary)] flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                Porcentaje General Deseado:
              </label>
              <span className="font-mono text-sm font-black text-[var(--ts-red)]">
                {margenConfig.porcentaje}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={70}
                step={1}
                value={margenConfig.porcentaje}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, parseFloat(e.target.value) || 28, margenConfig.descuentoTecnicoPct)}
                className="w-full accent-[var(--ts-red)] cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={99}
                step={0.5}
                value={margenConfig.porcentaje}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, parseFloat(e.target.value) || 0, margenConfig.descuentoTecnicoPct)}
                className="w-16 px-2 py-1.5 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-center text-white"
              />
            </div>
          </div>

          {/* Presets Rápidos */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
              Presets Frecuentes
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[20, 25, 28, 30, 35, 40].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => aplicarNuevoMargen(margenConfig.tipo, pct, margenConfig.descuentoTecnicoPct)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    margenConfig.porcentaje === pct
                      ? "bg-red-500/20 text-red-300 border-red-500"
                      : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-white hover:bg-[var(--ts-border)]/40"
                  }`}
                >
                  {pct}% {pct === 28 ? "★ Habitual" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Descuento Técnico */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
              Descuento Técnico (P. Técnico)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={margenConfig.descuentoTecnicoPct}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, margenConfig.porcentaje, parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-center text-white"
              />
              <span className="text-xs text-[var(--ts-text-muted)]">% s/ venta</span>
            </div>
          </div>
        </div>

        {/* Explicación de la Fórmula en Tiempo Real */}
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              {margenConfig.tipo === "utilidad" ? (
                <>
                  <strong>Fórmula de Margen de Utilidad:</strong> <code>PVP = Costo / (1 - {margenConfig.porcentaje}%)</code>.
                  Para un ítem de <strong>$100.00</strong> de costo &rarr; <strong>PVP: ${(100 / (1 - margenConfig.porcentaje / 100)).toFixed(2)}</strong> (Ganancia neta: ${((100 / (1 - margenConfig.porcentaje / 100)) - 100).toFixed(2)}, margen exacto del {margenConfig.porcentaje}% del total).
                </>
              ) : (
                <>
                  <strong>Fórmula de Markup sobre Costo:</strong> <code>PVP = Costo × (1 + {margenConfig.porcentaje}%)</code>.
                  Para un ítem de <strong>$100.00</strong> de costo &rarr; <strong>PVP: ${(100 * (1 + margenConfig.porcentaje / 100)).toFixed(2)}</strong> (Margen sobre costo: {margenConfig.porcentaje}%).
                </>
              )}
            </span>
          </div>

          {puedeGestionarStock && (
            <button
              type="button"
              onClick={() => setModalAplicarMargen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ Aplicar a Todo el Inventario en BD
            </button>
          )}
        </div>
      </div>
      )}

      {/* ── Barra de Herramientas y Filtros ── */}
      <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ts-red)] text-white placeholder-[var(--ts-text-muted)]"
            />
          </div>

          {puedeGestionarStock && (
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ts-text-muted)] font-semibold">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </div>

          {/* Categoría */}
          <div className="relative">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="appearance-none bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl px-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[var(--ts-red)] cursor-pointer"
            >
              {categorias.map(c => (
                <option key={c} value={c} className="bg-[#1c1c20] text-white">
                  {c === "Todas" ? "📁 Todas las categorías" : c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--ts-text-muted)] pointer-events-none" />
          </div>

          {/* Marca */}
          <div className="relative">
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="appearance-none bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl px-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[var(--ts-red)] cursor-pointer"
            >
              {marcas.map(m => (
                <option key={m} value={m} className="bg-[#1c1c20] text-white">
                  {m === "Todas" ? "🏷️ Todas las marcas" : m}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--ts-text-muted)] pointer-events-none" />
          </div>

          <span className="text-[11px] text-[var(--ts-text-muted)] ml-auto font-medium">
            Mostrando {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── TABLA DE PRODUCTOS CON EDICIÓN RÁPIDA INLINE Y MARGEN INDIVIDUAL ── */}
      <div className="bg-[var(--ts-surface)] rounded-2xl shadow-sm border border-[var(--ts-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[10px] font-bold uppercase tracking-wider border-b border-[var(--ts-border)]">
                <th className="px-4 py-3.5">SKU / Modelo</th>
                <th className="px-4 py-3.5">Marca & Categoría</th>
                <th className="px-4 py-3.5">Nombre & Descripción</th>
                {puedeVerCostos && <th className="px-4 py-3.5 text-center">Costo Prov.</th>}
                <th className="px-4 py-3.5 text-center">P. Venta (Sugerido)</th>
                <th className="px-4 py-3.5 text-center">P. Técnico</th>
                {puedeVerCostos && <th className="px-4 py-3.5 text-center">Margen (%)</th>}
                <th className="px-4 py-3.5 text-center">Estatus</th>
                <th className="px-4 py-3.5 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ts-border)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: puedeVerCostos ? 9 : 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-[var(--ts-surface-2)] rounded animate-pulse w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={puedeVerCostos ? 9 : 7} className="px-6 py-12 text-center text-[var(--ts-text-muted)]">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-white">No se encontraron productos en el inventario</p>
                    <p className="text-xs mt-1">Ajusta los filtros o crea un nuevo producto.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => {
                  const dirty = editedRows[p.id];
                  const skuVal = dirty?.codigo_sku !== undefined ? dirty.codigo_sku : p.codigo_sku;
                  const nombreVal = dirty?.nombre !== undefined ? dirty.nombre : p.nombre;
                  const marcaVal = dirty?.marca !== undefined ? dirty.marca : (p.marca || "Otra");
                  const catVal = dirty?.categoria !== undefined ? dirty.categoria : (p.categoria || "Accesorios y Varios");
                  const costoVal = dirty?.precio_costo !== undefined ? dirty.precio_costo : (p.precio_costo || 0);
                  const pVentaVal = dirty?.precio_venta !== undefined ? dirty.precio_venta : (p.precio_venta || 0);
                  const pTecVal = dirty?.precio_tecnico !== undefined ? dirty.precio_tecnico : (p.precio_tecnico || 0);
                  const stockVal = dirty?.stock !== undefined ? dirty.stock : (p.stock || 0);

                  // Margen individual específico de la fila
                  let margenFilaValor: number | string = "";
                  if (dirty?.margen_individual !== undefined) {
                    margenFilaValor = dirty.margen_individual;
                  } else if (pVentaVal > 0 && costoVal > 0) {
                    margenFilaValor = Math.round(((pVentaVal - costoVal) / pVentaVal) * 100);
                  } else {
                    margenFilaValor = margenConfig.porcentaje;
                  }

                  const isSavingThis = savingRowId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[var(--ts-surface-2)]/60 transition-colors group ${
                        dirty ? "bg-amber-500/5 border-l-4 border-l-amber-500" : ""
                      }`}
                    >
                      {/* SKU / MODELO */}
                      <td className="px-4 py-3 align-middle">
                        <span className="font-mono font-bold text-xs text-[var(--ts-red)] tracking-wider">
                          {skuVal || "—"}
                        </span>
                      </td>

                      {/* MARCA & CATEGORÍA (SOLO LECTURA DESDE AFUERA, SE EDITA CON EL LÁPIZ) */}
                      <td className="px-4 py-3 align-middle space-y-1">
                        <div>
                          <span className="inline-block text-xs font-semibold text-white bg-[var(--ts-surface-2)] px-2.5 py-0.5 rounded-lg border border-[var(--ts-border)] shadow-xs">
                            {marcaVal}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ts-text-muted)] truncate max-w-[170px]" title={catVal}>
                          {catVal}
                        </p>
                      </td>

                      {/* NOMBRE & DESCRIPCIÓN */}
                      <td className="px-4 py-3 align-middle min-w-[200px]">
                        <input
                          type="text"
                          disabled={!puedeGestionarStock}
                          value={nombreVal}
                          onChange={(e) => actualizarCampoInline(p.id, "nombre", e.target.value)}
                          className="w-full text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-[var(--ts-border)] focus:border-[var(--ts-red)] focus:bg-[var(--ts-surface-2)] px-1.5 py-1 rounded transition-colors focus:outline-none"
                          title={nombreVal}
                        />
                      </td>

                      {/* COSTO PROV. (Solo visible si tiene permiso explícito y no está en tec.) */}
                      {puedeVerCostos && (
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={!puedeGestionarStock}
                            value={costoVal === 0 ? "" : costoVal}
                            placeholder="0.00"
                            onChange={(e) => handleCostoChange(p, e.target.value)}
                            className="w-20 px-2 py-1.5 bg-[#18181b] border border-[var(--ts-border)] rounded-xl text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-[var(--ts-red)]"
                          />
                        </td>
                      )}

                      {/* P. VENTA (SUGERIDO) */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!puedeGestionarStock}
                          value={pVentaVal === 0 ? "" : pVentaVal}
                          placeholder="0.00"
                          onChange={(e) => handlePrecioVentaChange(p, e.target.value)}
                          className="w-24 px-2 py-1.5 bg-[#18181b] border border-emerald-500/30 rounded-xl text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                        />
                      </td>

                      {/* P. TÉCNICO */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!puedeGestionarStock}
                          value={pTecVal === 0 ? "" : pTecVal}
                          placeholder="0.00"
                          onChange={(e) => handlePrecioTecnicoChange(p, e.target.value)}
                          className="w-20 px-2 py-1.5 bg-[#18181b] border border-[var(--ts-border)] rounded-xl text-xs font-mono font-semibold text-center text-gray-300 focus:outline-none focus:border-[var(--ts-red)]"
                        />
                      </td>

                      {/* MARGEN INDIVIDUAL (Solo visible si puede ver costos) */}
                      {puedeVerCostos && (
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-0.5 bg-[#18181b] border border-emerald-500/30 rounded-xl px-2 py-1 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="99"
                              disabled={!puedeGestionarStock}
                              value={margenFilaValor}
                              placeholder="0"
                              onChange={(e) => handleMargenFilaChange(p, e.target.value)}
                              className="w-11 bg-transparent text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none"
                              title="Modificar margen individual para este producto (%)"
                            />
                            <span className="text-xs font-mono font-bold text-emerald-400/80">%</span>
                          </div>
                        </td>
                      )}

                      {/* ESTATUS Y STOCK */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            stockVal > 0
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}>
                            {stockVal > 0 ? "DISPONIBLE" : "AGOTADO"}
                          </span>
                          <input
                            type="number"
                            min="0"
                            disabled={!puedeGestionarStock}
                            value={stockVal}
                            onChange={(e) => handleStockChange(p, e.target.value)}
                            className="w-12 px-1.5 py-0.5 bg-[#18181b] border border-[var(--ts-border)] rounded-lg text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-[var(--ts-red)]"
                            title="Cantidad en Stock"
                          />
                        </div>
                      </td>

                      {/* ACCIONES */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {dirty && puedeGestionarStock ? (
                            <>
                              <button
                                type="button"
                                disabled={isSavingThis}
                                onClick={() => guardarFilaIndividual(p)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                title="Guardar cambios de este producto"
                              >
                                {isSavingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => descartarFilaIndividual(p.id)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                                title="Descartar cambios de esta fila"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {puedeGestionarStock ? (
                                <>
                                  <button
                                    onClick={() => openModal(p)}
                                    className="p-1 text-[var(--ts-text-muted)] hover:text-white transition-colors"
                                    title="Editar detalles completos (Marca, Categoría, etc.)"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(p)}
                                    className="p-1 text-[var(--ts-text-muted)] hover:text-red-500 transition-colors"
                                    title="Eliminar producto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[var(--ts-text-muted)] opacity-50 mx-auto" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BARRA FLOTANTE DE CAMBIOS PENDIENTES ── */}
      {numCambiosPendientes > 0 && (
        <div className="sticky bottom-6 z-40 bg-[#141417]/95 backdrop-blur-md border border-amber-500/40 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Tienes {numCambiosPendientes} producto{numCambiosPendientes !== 1 ? "s" : ""} con cambios pendientes
              </p>
              <p className="text-xs text-[var(--ts-text-muted)]">
                Puedes guardar todas las modificaciones o descartarlas para volver a los valores originales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={descartarTodosLosCambios}
              disabled={guardandoLote}
              className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              Descartar Todo
            </button>
            <button
              type="button"
              onClick={guardarTodosLosCambios}
              disabled={guardandoLote}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all"
            >
              {guardandoLote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando en BD...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Todos los Cambios ({numCambiosPendientes})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL RECALCULAR Y APLICAR MARGEN A TODO EL INVENTARIO ── */}
      {modalAplicarMargen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">¿Aplicar Margen a Todo el Inventario?</h3>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1">
                  Se recalcularán el <strong>Precio de Venta</strong> y el <strong>Precio Técnico</strong> de todos los productos que tengan un costo registrado en la base de datos.
                </p>
              </div>

              <div className="p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span>Estrategia:</span>
                  <span className="font-bold text-white">
                    {margenConfig.tipo === "utilidad" ? "Margen de Utilidad (Sobre Venta)" : "Markup (Sobre Costo)"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Porcentaje Margen:</span>
                  <span className="font-bold text-[var(--ts-red)]">{margenConfig.porcentaje}%</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Descuento Técnico:</span>
                  <span className="font-bold text-white">{margenConfig.descuentoTecnicoPct}%</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAplicarMargen(false)}
                  disabled={aplicandoMargenMasivo}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarAplicacionMargenEnBD}
                  disabled={aplicandoMargenMasivo}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/30"
                >
                  {aplicandoMargenMasivo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Confirmar y Aplicar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--ts-red)]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">¿Eliminar producto?</h2>
              <p className="text-xs text-[var(--ts-text-muted)] mb-1">
                SKU: <span className="font-mono font-bold text-[var(--ts-red)]">{confirmDelete.codigo_sku}</span>
              </p>
              <p className="text-xs text-white font-medium mb-4">{confirmDelete.nombre}</p>
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl mb-5">
                ⚠️ Esta acción es permanente y eliminará el producto del catálogo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors border border-[var(--ts-border)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarProducto}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
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

      {/* ── MODAL AGREGAR / EDITAR COMPLETO (EDICIÓN DE MARCA Y CATEGORÍA AQUÍ) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[var(--ts-border)]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--ts-red)]" />
                {editingProd ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={closeModal} className="text-[var(--ts-text-muted)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Código SKU
                  </label>
                  <input
                    required
                    type="text"
                    value={form.codigo_sku}
                    onChange={(e) => setForm({ ...form, codigo_sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[var(--ts-red)]"
                    placeholder="DS-2CD..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Marca
                  </label>
                  <select
                    required
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    {listaMarcasOpciones.map(m => (
                      <option key={m} value={m} className="bg-[#1c1c20] text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                  Nombre del Producto
                </label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs focus:outline-none focus:border-[var(--ts-red)]"
                  placeholder="Ej: Cámara Bullet 2MP ColorVu"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                  Categoría
                </label>
                <select
                  required
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs focus:outline-none focus:border-[var(--ts-red)]"
                >
                  {listaCategoriasOpciones.map(c => (
                    <option key={c} value={c} className="bg-[#1c1c20] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {puedeVerCostos ? (
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                      Costo Prov. (Compra)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precio_costo}
                        onChange={(e) => {
                          const c = parseFloat(e.target.value) || 0;
                          const { precioVenta, precioTecnico } = calcularPrecios(
                            c,
                            margenConfig.tipo,
                            margenConfig.porcentaje,
                            margenConfig.descuentoTecnicoPct
                          );
                          setForm({
                            ...form,
                            precio_costo: c,
                            precio_venta: precioVenta,
                            precio_tecnico: precioTecnico,
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[var(--ts-red)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                      Costo Confidencial
                    </p>
                    <div className="px-3 py-2 border border-[var(--ts-border)] bg-[var(--ts-surface-2)] rounded-xl text-xs text-[var(--ts-text-muted)] font-mono">
                      🔒 Restringido
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Precio Público (Venta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.precio_venta}
                      onChange={(e) => {
                        const pv = parseFloat(e.target.value) || 0;
                        let pt = Math.round(pv * (1 - margenConfig.descuentoTecnicoPct / 100) * 100) / 100;
                        if (form.precio_costo > 0 && pt < form.precio_costo) {
                          pt = Math.round(form.precio_costo * 1.05 * 100) / 100;
                        }
                        setForm({ ...form, precio_venta: pv, precio_tecnico: pt });
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Precio Técnico ({margenConfig.descuentoTecnicoPct}% off)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.precio_tecnico}
                      onChange={(e) => setForm({ ...form, precio_tecnico: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Stock Disponible
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-white rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-2.5 rounded-xl">
                  {saveError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingProd ? "Actualizar Producto" : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
