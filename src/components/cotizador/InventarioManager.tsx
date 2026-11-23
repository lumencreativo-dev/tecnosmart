"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit2, Package, Save, X, Filter, ChevronDown, Trash2,
  AlertTriangle, Eye, Lock, Unlock, Sliders, Percent, HelpCircle, Check,
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
  porcentaje: number;           // Margen Divisas (Default: 28%)
  porcentajeBcv: number;        // Margen BCV / Bolívares (Default: 38%)
  descuentoTecnicoPct: number;  // Default: 15%
}

export function calcularPrecios(
  costo: number,
  tipoMargen: TipoMargen,
  porcentajeMargen: number,
  descuentoTecnicoPct: number = 15,
  porcentajeMargenBcv: number = 38
): {
  precioVenta: number;
  precioBcv: number;
  precioTecnico: number;
  ganancia: number;
  margenRealPct: number;
  margenRealBcvPct: number;
} {
  if (costo <= 0) {
    return {
      precioVenta: 0,
      precioBcv: 0,
      precioTecnico: 0,
      ganancia: 0,
      margenRealPct: 0,
      margenRealBcvPct: 0,
    };
  }

  let precioVenta = 0;
  let precioBcv = 0;

  if (tipoMargen === "utilidad") {
    // Margen de Utilidad sobre Precio de Venta: P = C / (1 - M)
    const mDivisa = Math.min(Math.max(0, porcentajeMargen), 99) / 100;
    precioVenta = costo / (1 - mDivisa);

    const mBcv = Math.min(Math.max(0, porcentajeMargenBcv), 99) / 100;
    precioBcv = costo / (1 - mBcv);
  } else {
    // Markup sobre Costo: P = C * (1 + M)
    const mDivisa = Math.max(0, porcentajeMargen) / 100;
    precioVenta = costo * (1 + mDivisa);

    const mBcv = Math.max(0, porcentajeMargenBcv) / 100;
    precioBcv = costo * (1 + mBcv);
  }

  precioVenta = Math.round(precioVenta * 100) / 100;
  precioBcv = Math.round(precioBcv * 100) / 100;

  // Garantizar que precioBcv mantenga cobertura respecto a precioVenta
  if (precioBcv < precioVenta) {
    precioBcv = Math.round(precioVenta * 1.10 * 100) / 100;
  }

  // Precio Técnico: descuento sobre precio de venta sin bajar del costo + 5%
  let precioTecnico = Math.round(precioVenta * (1 - descuentoTecnicoPct / 100) * 100) / 100;
  if (precioTecnico < costo) {
    precioTecnico = Math.round(costo * 1.05 * 100) / 100;
  }

  const ganancia = Math.round((precioVenta - costo) * 100) / 100;
  const margenRealPct = precioVenta > 0 ? Math.round(((precioVenta - costo) / precioVenta) * 1000) / 10 : 0;
  const margenRealBcvPct = precioBcv > 0 ? Math.round(((precioBcv - costo) / precioBcv) * 1000) / 10 : 0;

  return { precioVenta, precioBcv, precioTecnico, ganancia, margenRealPct, margenRealBcvPct };
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
  precio_bcv?: number;
  precio_tecnico: number;
  stock: number;
  activo?: boolean;
  margen_individual?: number;
  margen_bloqueado?: boolean;
};

// Limpia campos internos antes de enviar a Supabase
function sanitizarPayload(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  const validKeys = [
    "codigo_sku", "nombre", "marca", "categoria",
    "precio_costo", "precio_venta", "precio_bcv", "precio_tecnico", "stock", "activo",
    "margen_bloqueado", "margen_individual"
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
  const esTecnicoAliado = usuario?.rol_id === "tecnico_aliado" || isTecHost;
  const esTecnico = usuario?.rol_id === "tecnico" || usuario?.rol_id === "tecnico_aliado" || usuario?.rol_id === "lider_tecnico";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Tasa BCV en vivo para cálculo de precios en Bolívares
  const [tasaBcv, setTasaBcv] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(false);

  useEffect(() => {
    const obtenerTasaBcv = async () => {
      setCargandoTasa(true);
      try {
        const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        const data = await res.json();
        if (data?.promedio) setTasaBcv(data.promedio);
      } catch (e) {
        console.warn("No se pudo obtener tasa BCV en tiempo real:", e);
      } finally {
        setCargandoTasa(false);
      }
    };
    obtenerTasaBcv();
  }, []);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroMarca, setFiltroMarca] = useState("Todas");

  // Motor de Márgenes Centralizado Global Bimoneda
  const [margenConfig, setMargenConfig] = useState<MargenConfig>({
    tipo: "utilidad",
    porcentaje: 28,     // Margen Divisas Efectivo (Default: 28%)
    porcentajeBcv: 38,  // Margen Facturado formal en Bs / Tasa BCV (Default: 38%)
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
    precio_bcv: 0,
    precio_costo: 0,
    precio_tecnico: 0,
    stock: 0,
    margen_bloqueado: false,
    margen_individual: 28,
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

  // Estadísticas de bloqueo de margen
  const statsBloqueo = useMemo(() => {
    let bloqueados = 0;
    productos.forEach(p => {
      const isBlocked = editedRows[p.id]?.margen_bloqueado !== undefined
        ? editedRows[p.id]?.margen_bloqueado
        : p.margen_bloqueado;
      if (isBlocked) bloqueados++;
    });
    return {
      bloqueados,
      flotantes: productos.length - bloqueados,
    };
  }, [productos, editedRows]);

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

    const { precioVenta, precioBcv, precioTecnico } = calcularPrecios(
      val,
      margenConfig.tipo,
      margenAUsar,
      margenConfig.descuentoTecnicoPct,
      margenConfig.porcentajeBcv
    );

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          precio_costo: val,
          precio_venta: precioVenta,
          precio_bcv: precioBcv,
          precio_tecnico: precioTecnico,
          margen_individual: margenAUsar,
        }
      };
    });
  };

  // Cambio de Margen individual de una sola fila (bloquea automáticamente el producto para protegerlo)
  const handleMargenFilaChange = (prod: Producto, nuevoMargenStr: string) => {
    const nuevoMargen = parseFloat(nuevoMargenStr.replace(",", ".")) || 0;
    const costoActual = editedRows[prod.id]?.precio_costo !== undefined
      ? (editedRows[prod.id]?.precio_costo || 0)
      : (prod.precio_costo || 0);

    let nuevoPV = 0;
    let nuevoPBCV = 0;
    let nuevoPT = 0;

    if (costoActual > 0) {
      const { precioVenta, precioBcv, precioTecnico } = calcularPrecios(
        costoActual,
        margenConfig.tipo,
        nuevoMargen,
        margenConfig.descuentoTecnicoPct,
        margenConfig.porcentajeBcv
      );
      nuevoPV = precioVenta;
      nuevoPBCV = precioBcv;
      nuevoPT = precioTecnico;
    }

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          margen_individual: nuevoMargen,
          margen_bloqueado: true, // Auto-bloquear para proteger el margen individual fijado a mano
          ...(costoActual > 0 ? { precio_venta: nuevoPV, precio_bcv: nuevoPBCV, precio_tecnico: nuevoPT } : {}),
        }
      };
    });
  };

  // Cambio directo de Precio de Venta (Divisas): recalcula el margen individual y el precio técnico
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

    // Si aún no tenía precio BCV establecido o necesita valor sugerido
    const pbcvActual = editedRows[prod.id]?.precio_bcv !== undefined
      ? editedRows[prod.id]?.precio_bcv
      : (prod.precio_bcv && prod.precio_bcv > 0 ? prod.precio_bcv : Math.round(pv * 1.10 * 100) / 100);

    setEditedRows(prev => {
      const actual = prev[prod.id] || {};
      return {
        ...prev,
        [prod.id]: {
          ...actual,
          precio_venta: pv,
          precio_bcv: pbcvActual,
          precio_tecnico: pt,
          margen_individual: nuevoMargenCalculado,
          margen_bloqueado: true, // Proteger para que la barra global no sobrescriba el precio manual
        }
      };
    });
  };

  // Cambio directo de Precio BCV ($ / Ref Bolívares)
  const handlePrecioBcvChange = (prod: Producto, nuevoPBcvStr: string) => {
    const pb = parseFloat(nuevoPBcvStr.replace(",", ".")) || 0;
    actualizarCampoInline(prod.id, "precio_bcv", pb);
  };

  // Alternar bloqueo/desbloqueo de margen (Candado 🔒 / 🔓)
  const toggleBloqueoMargen = (prod: Producto) => {
    const dirty = editedRows[prod.id];
    const isCurrentlyLocked = dirty?.margen_bloqueado !== undefined
      ? dirty.margen_bloqueado
      : (prod.margen_bloqueado || false);

    const nuevoEstado = !isCurrentlyLocked;

    const costoActual = dirty?.precio_costo !== undefined ? dirty.precio_costo : prod.precio_costo;
    const pvActual = dirty?.precio_venta !== undefined ? dirty.precio_venta : prod.precio_venta;
    const margenActual = dirty?.margen_individual !== undefined
      ? dirty.margen_individual
      : (pvActual > 0 && costoActual > 0
          ? Math.round(((pvActual - costoActual) / pvActual) * 100)
          : margenConfig.porcentaje);

    setEditedRows(prev => ({
      ...prev,
      [prod.id]: {
        ...(prev[prod.id] || {}),
        margen_bloqueado: nuevoEstado,
        margen_individual: margenActual,
      }
    }));
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
  const recalcularPreciosEnVista = (
    nuevoTipo?: TipoMargen,
    nuevoPctDivisas?: number,
    nuevoPctBcv?: number,
    nuevoDesc?: number
  ) => {
    const tipo = nuevoTipo ?? margenConfig.tipo;
    const pctDivisas = nuevoPctDivisas ?? margenConfig.porcentaje;
    const pctBcv = nuevoPctBcv ?? margenConfig.porcentajeBcv;
    const desc = nuevoDesc ?? margenConfig.descuentoTecnicoPct;

    const nuevosCambios: Record<string, Partial<Producto>> = { ...editedRows };

    productosFiltrados.forEach(p => {
      // SI EL PRODUCTO ESTÁ BLOQUEADO (🔒), SE PROTEGE Y SE OMITE
      const isBloqueado = nuevosCambios[p.id]?.margen_bloqueado !== undefined
        ? nuevosCambios[p.id]?.margen_bloqueado
        : p.margen_bloqueado;

      if (isBloqueado) return;

      const costo = nuevosCambios[p.id]?.precio_costo !== undefined
        ? (nuevosCambios[p.id]?.precio_costo || 0)
        : (p.precio_costo || 0);

      if (costo > 0) {
        const { precioVenta, precioBcv, precioTecnico } = calcularPrecios(
          costo,
          tipo,
          pctDivisas,
          desc,
          pctBcv
        );
        nuevosCambios[p.id] = {
          ...nuevosCambios[p.id],
          precio_venta: precioVenta,
          precio_bcv: precioBcv,
          precio_tecnico: precioTecnico,
          margen_individual: pctDivisas,
        };
      }
    });

    setEditedRows(nuevosCambios);
  };

  const aplicarNuevoMargen = (
    tipo: TipoMargen,
    porcentaje: number,
    descuentoTecnicoPct: number,
    porcentajeBcv: number = margenConfig.porcentajeBcv
  ) => {
    setMargenConfig({ tipo, porcentaje, porcentajeBcv, descuentoTecnicoPct });
    recalcularPreciosEnVista(tipo, porcentaje, porcentajeBcv, descuentoTecnicoPct);
  };

  // Aplicar margen masivo directamente a la BD (respetando los productos con candado 🔒)
  const ejecutarAplicacionMargenEnBD = async () => {
    if (!puedeGestionarStock) return;
    setAplicandoMargenMasivo(true);

    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, precio_costo, margen_bloqueado, precio_venta, precio_bcv")
        .gt("precio_costo", 0);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No hay productos con costo registrado para recalcular.");
        setModalAplicarMargen(false);
        return;
      }

      // Solo productos que NO tengan margen_bloqueado
      const desbloqueados = data.filter(item => !item.margen_bloqueado);

      if (desbloqueados.length === 0) {
        alert("Todos los productos tienen el margen bloqueado (🔒). No hay productos flotantes para actualizar.");
        setModalAplicarMargen(false);
        return;
      }

      const updates = desbloqueados.map(item => {
        const { precioVenta, precioBcv, precioTecnico } = calcularPrecios(
          item.precio_costo,
          margenConfig.tipo,
          margenConfig.porcentaje,
          margenConfig.descuentoTecnicoPct,
          margenConfig.porcentajeBcv
        );
        return supabase
          .from("productos")
          .update({
            precio_venta: precioVenta,
            precio_bcv: precioBcv,
            precio_tecnico: precioTecnico,
            margen_individual: margenConfig.porcentaje,
          })
          .eq("id", item.id);
      });

      await Promise.all(updates);

      setModalAplicarMargen(false);
      setEditedRows({});
      await cargarProductos();
      const protegidosCount = data.length - desbloqueados.length;
      mostrarAvisoExito(`Se recalcularon ${desbloqueados.length} productos desbloqueados. ${protegidosCount > 0 ? `(${protegidosCount} con candado 🔒 protegidos)` : ""}`);
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
        precio_bcv: fila.precio_bcv !== undefined ? fila.precio_bcv : (fila.precio_venta > 0 ? Math.round(fila.precio_venta * 1.10 * 100) / 100 : 0),
        precio_costo: fila.precio_costo || 0,
        precio_tecnico: fila.precio_tecnico || 0,
        stock: fila.stock || 0,
        margen_bloqueado: fila.margen_bloqueado || false,
        margen_individual: fila.margen_individual !== undefined ? fila.margen_individual : 28,
      });
    } else {
      setEditingProd(null);
      setForm({
        nombre: "",
        codigo_sku: "",
        marca: "Hikvision",
        categoria: "Cámaras Analógicas y Domos",
        precio_venta: 0,
        precio_bcv: 0,
        precio_costo: 0,
        precio_tecnico: 0,
        stock: 0,
        margen_bloqueado: false,
        margen_individual: 28,
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
      precio_bcv: form.precio_bcv || 0,
      precio_costo: form.precio_costo || 0,
      precio_tecnico: form.precio_tecnico || null,
      margen_bloqueado: form.margen_bloqueado || false,
      margen_individual: form.margen_individual !== undefined ? form.margen_individual : null,
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

      {/* ── BANNER PARA TÉCNICOS ALIADOS (CATÁLOGO MAYORISTA) ── */}
      {esTecnicoAliado && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-[var(--ts-surface)] to-[var(--ts-surface)] border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                Catálogo Mayorista de Equipos & Materiales
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  15% Descuento Aliado
                </span>
              </p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                Precios con descuento especial para tus proyectos e instalaciones. Garantía oficial TecnoSmart y soporte de ingeniería disponible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MOTOR DE MÁRGENES Y FIJACIÓN DE PRECIOS CENTRALIZADO ── */}
      {puedeVerCostos && (
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--ts-border)]">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--ts-red)]" />
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] tracking-wide">
                Motor de Márgenes Dual & Estrategia Bimoneda
              </h2>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
              Control general para precios en Divisas y liquidación formal a Tasa BCV. Los productos con candado (🔒) están protegidos y no serán modificados por este panel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tasa BCV Oficial */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-gray-300">BCV Oficial:</span>
              <span className="font-mono font-bold text-cyan-300">
                {tasaBcv > 0 ? `Bs. ${tasaBcv.toFixed(2)}` : (cargandoTasa ? "Consultando..." : "Bs. —")}
              </span>
            </div>

            {/* Contador de Candados */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs">
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                <Lock className="w-3 h-3" /> {statsBloqueo.bloqueados}
              </span>
              <span className="text-[var(--ts-text-muted)]">protegidos /</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <Unlock className="w-3 h-3" /> {statsBloqueo.flotantes}
              </span>
              <span className="text-[var(--ts-text-muted)]">flotantes</span>
            </div>

            {/* Switch Utilidad vs Markup */}
            <div className="flex items-center bg-[var(--ts-surface-2)] p-1 rounded-2xl border border-[var(--ts-border)]">
              <button
                type="button"
                onClick={() => aplicarNuevoMargen("utilidad", margenConfig.porcentaje, margenConfig.descuentoTecnicoPct, margenConfig.porcentajeBcv)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  margenConfig.tipo === "utilidad"
                    ? "bg-[var(--ts-red)] text-white shadow-sm"
                    : "text-[var(--ts-text-muted)] hover:text-white"
                }`}
              >
                Margen Utilidad (Venta)
              </button>
              <button
                type="button"
                onClick={() => aplicarNuevoMargen("markup", margenConfig.porcentaje, margenConfig.descuentoTecnicoPct, margenConfig.porcentajeBcv)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  margenConfig.tipo === "markup"
                    ? "bg-[var(--ts-red)] text-white shadow-sm"
                    : "text-[var(--ts-text-muted)] hover:text-white"
                }`}
              >
                Markup (Costo)
              </button>
            </div>
          </div>
        </div>

        {/* Controles de Porcentaje Doble (Divisas vs BCV) y Descuento Técnico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* 1. Margen Divisas */}
          <div className="lg:col-span-5 p-3.5 bg-[var(--ts-surface-2)]/60 border border-emerald-500/20 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                💵 Margen Divisas (Efectivo / Zelle):
              </label>
              <span className="font-mono text-sm font-black text-emerald-400">
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
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, parseFloat(e.target.value) || 28, margenConfig.descuentoTecnicoPct, margenConfig.porcentajeBcv)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={99}
                step={0.5}
                value={margenConfig.porcentaje}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, parseFloat(e.target.value) || 0, margenConfig.descuentoTecnicoPct, margenConfig.porcentajeBcv)}
                className="w-16 px-2 py-1 bg-[#18181b] border border-emerald-500/30 rounded-xl text-xs font-bold text-center text-emerald-300"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Presets:</span>
              {[20, 25, 28, 30, 35].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => aplicarNuevoMargen(margenConfig.tipo, pct, margenConfig.descuentoTecnicoPct, margenConfig.porcentajeBcv)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                    margenConfig.porcentaje === pct
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-[#18181b] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-white"
                  }`}
                >
                  {pct}% {pct === 28 ? "★" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Margen BCV / Bolívares */}
          <div className="lg:col-span-5 p-3.5 bg-[var(--ts-surface-2)]/60 border border-cyan-500/20 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                🏛️ Margen BCV (Liquidación formal en Bs):
              </label>
              <span className="font-mono text-sm font-black text-cyan-300">
                {margenConfig.porcentajeBcv}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={80}
                step={1}
                value={margenConfig.porcentajeBcv}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, margenConfig.porcentaje, margenConfig.descuentoTecnicoPct, parseFloat(e.target.value) || 38)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={99}
                step={0.5}
                value={margenConfig.porcentajeBcv}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, margenConfig.porcentaje, margenConfig.descuentoTecnicoPct, parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-[#18181b] border border-cyan-500/30 rounded-xl text-xs font-bold text-center text-cyan-300"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Presets:</span>
              {[30, 35, 38, 40, 45].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => aplicarNuevoMargen(margenConfig.tipo, margenConfig.porcentaje, margenConfig.descuentoTecnicoPct, pct)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                    margenConfig.porcentajeBcv === pct
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                      : "bg-[#18181b] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-white"
                  }`}
                >
                  {pct}% {pct === 38 ? "★" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Descuento Técnico */}
          <div className="lg:col-span-2 p-3.5 bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl space-y-2">
            <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
              Desc. Técnico
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={margenConfig.descuentoTecnicoPct}
                onChange={(e) => aplicarNuevoMargen(margenConfig.tipo, margenConfig.porcentaje, parseFloat(e.target.value) || 0, margenConfig.porcentajeBcv)}
                className="w-16 px-2 py-1 bg-[#18181b] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-center text-white"
              />
              <span className="text-xs text-[var(--ts-text-muted)]">% s/ divisa</span>
            </div>
          </div>
        </div>

        {/* Explicación de la Fórmula y Botón de Aplicar */}
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Esquema Comercial:</strong> Para un costo de $100.00 &rarr; 
              <span className="text-emerald-400 font-bold ml-1">P. Divisas: ${(100 / (1 - margenConfig.porcentaje / 100)).toFixed(2)}</span> | 
              <span className="text-cyan-300 font-bold ml-1">P. BCV: ${(100 / (1 - margenConfig.porcentajeBcv / 100)).toFixed(2)}</span>
              {tasaBcv > 0 && (
                <span className="text-cyan-400 font-semibold ml-1">
                  (≈ Bs. {((100 / (1 - margenConfig.porcentajeBcv / 100)) * tasaBcv).toFixed(2)})
                </span>
              )}.
            </span>
          </div>

          {puedeGestionarStock && (
            <button
              type="button"
              onClick={() => setModalAplicarMargen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ Aplicar a Productos Desbloqueados ({statsBloqueo.flotantes})
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
                <th className="px-4 py-3.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 font-bold">P. Divisas ($)</span>
                    <span className="text-[9px] text-[var(--ts-text-muted)] font-normal">Efectivo / Zelle</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-cyan-400 font-bold">P. BCV ($ / Bs)</span>
                    <span className="text-[9px] text-[var(--ts-text-muted)] font-normal">Factura / Oficial</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">{esTecnicoAliado ? "P. Aliado (-15%)" : "P. Técnico"}</th>
                {puedeVerCostos && <th className="px-4 py-3.5 text-center">Margen & Candado</th>}
                <th className="px-4 py-3.5 text-center">Estatus & Stock</th>
                <th className="px-4 py-3.5 text-center w-24">{puedeGestionarStock ? "Acciones" : "Acceso"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ts-border)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: puedeVerCostos ? 10 : 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-[var(--ts-surface-2)] rounded animate-pulse w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={puedeVerCostos ? 10 : 8} className="px-6 py-12 text-center text-[var(--ts-text-muted)]">
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
                  const pBcvVal = dirty?.precio_bcv !== undefined ? dirty.precio_bcv : (p.precio_bcv || 0);
                  const pTecVal = dirty?.precio_tecnico !== undefined ? dirty.precio_tecnico : (p.precio_tecnico || 0);
                  const stockVal = dirty?.stock !== undefined ? dirty.stock : (p.stock || 0);
                  const estaBloqueado = dirty?.margen_bloqueado !== undefined ? dirty.margen_bloqueado : Boolean(p.margen_bloqueado);

                  // Margen individual específico de la fila
                  let margenFilaValor: number | string = "";
                  if (dirty?.margen_individual !== undefined) {
                    margenFilaValor = dirty.margen_individual;
                  } else if (p.margen_individual !== undefined && p.margen_individual !== null) {
                    margenFilaValor = p.margen_individual;
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
                        {puedeGestionarStock ? (
                          <input
                            type="text"
                            value={nombreVal}
                            onChange={(e) => actualizarCampoInline(p.id, "nombre", e.target.value)}
                            className="w-full text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-[var(--ts-border)] focus:border-[var(--ts-red)] focus:bg-[var(--ts-surface-2)] px-1.5 py-1 rounded transition-colors focus:outline-none"
                            title={nombreVal}
                          />
                        ) : (
                          <p className="text-xs font-bold text-white px-1.5 py-1" title={nombreVal}>
                            {nombreVal}
                          </p>
                        )}
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

                      {/* P. DIVISAS ($ EFECTIVO / ZELLE) */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        {puedeGestionarStock ? (
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pVentaVal === 0 ? "" : pVentaVal}
                              placeholder="0.00"
                              onChange={(e) => handlePrecioVentaChange(p, e.target.value)}
                              className="w-24 px-2 py-1.5 bg-[#18181b] border border-emerald-500/30 rounded-xl text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                            />
                            <span className="text-[10px] text-emerald-500/70 font-semibold mt-0.5">Efectivo / Zelle</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className={`font-mono text-xs ${esTecnicoAliado ? "text-[var(--ts-text-muted)] line-through" : "text-emerald-400 font-bold"}`}>
                              {formatUSD(pVentaVal)}
                            </span>
                            <span className="text-[10px] text-emerald-500/70 font-semibold">Efectivo</span>
                          </div>
                        )}
                      </td>

                      {/* P. BCV ($ / FACTURA OFICIAL BS) */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        {puedeGestionarStock ? (
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pBcvVal === 0 ? "" : pBcvVal}
                              placeholder="0.00"
                              onChange={(e) => handlePrecioBcvChange(p, e.target.value)}
                              className="w-24 px-2 py-1.5 bg-[#18181b] border border-cyan-500/30 rounded-xl text-xs font-mono font-bold text-center text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                            />
                            {tasaBcv > 0 && pBcvVal > 0 ? (
                              <span className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5">
                                ≈ Bs. {(pBcvVal * tasaBcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-cyan-500/70 font-semibold mt-0.5">Ref. BCV</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-xs text-cyan-300 font-bold">
                              {formatUSD(pBcvVal)}
                            </span>
                            {tasaBcv > 0 && pBcvVal > 0 && (
                              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                                ≈ Bs. {(pBcvVal * tasaBcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* P. TÉCNICO */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        {puedeGestionarStock ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pTecVal === 0 ? "" : pTecVal}
                            placeholder="0.00"
                            onChange={(e) => handlePrecioTecnicoChange(p, e.target.value)}
                            className="w-20 px-2 py-1.5 bg-[#18181b] border border-[var(--ts-border)] rounded-xl text-xs font-mono font-semibold text-center text-gray-300 focus:outline-none focus:border-[var(--ts-red)]"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              {formatUSD(pTecVal > 0 ? pTecVal : (pVentaVal > 0 ? Math.round(pVentaVal * 0.85 * 100) / 100 : 0))}
                            </span>
                            {esTecnicoAliado && (
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded mt-0.5">
                                -15% Aliado
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* MARGEN & CANDADO (Solo visible si puede ver costos) */}
                      {puedeVerCostos && (
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Input de margen individual */}
                            <div className="inline-flex items-center justify-center gap-0.5 bg-[#18181b] border border-[var(--ts-border)] rounded-xl px-2 py-1 focus-within:border-emerald-500 transition-all">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="99"
                                disabled={!puedeGestionarStock}
                                value={margenFilaValor}
                                placeholder="0"
                                onChange={(e) => handleMargenFilaChange(p, e.target.value)}
                                className="w-10 bg-transparent text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none"
                                title="Modificar margen individual para este producto (%)"
                              />
                              <span className="text-[11px] font-mono font-bold text-emerald-400/80">%</span>
                            </div>

                            {/* Botón Candado (Toggle Bloqueo) */}
                            {puedeGestionarStock ? (
                              <button
                                type="button"
                                onClick={() => toggleBloqueoMargen(p)}
                                className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                                  estaBloqueado
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-xs"
                                    : "bg-white/5 text-[var(--ts-text-muted)] border-white/10 hover:text-white hover:border-white/20"
                                }`}
                                title={
                                  estaBloqueado
                                    ? `Margen bloqueado individualmente (${margenFilaValor}%). Protegido de la barra global. Clic para desbloquear.`
                                    : "Margen flotante dinámico. Se actualizará con la barra global. Clic para bloquear."
                                }
                              >
                                {estaBloqueado ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-[9px] font-bold text-amber-300 pr-0.5">Fijo</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="p-1">
                                {estaBloqueado ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-lg">
                                    <Lock className="w-3 h-3" /> Fijo
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[var(--ts-text-muted)] font-mono">
                                    Flotante
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* ESTATUS Y STOCK */}
                      <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                        {puedeGestionarStock ? (
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
                              value={stockVal}
                              onChange={(e) => handleStockChange(p, e.target.value)}
                              className="w-12 px-1.5 py-0.5 bg-[#18181b] border border-[var(--ts-border)] rounded-lg text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-[var(--ts-red)]"
                              title="Cantidad en Stock"
                            />
                          </div>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            stockVal > 0
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}>
                            {stockVal > 0 ? `DISPONIBLE (${stockVal})` : "AGOTADO"}
                          </span>
                        )}
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
                                <span className="text-[10px] text-[var(--ts-text-muted)] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                  Catálogo
                                </span>
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
                <h3 className="text-lg font-bold text-white">¿Aplicar Margen a Productos Desbloqueados?</h3>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1">
                  Se recalcularán el <strong>Precio Divisas</strong>, <strong>Precio BCV</strong> y <strong>Precio Técnico</strong> de los <strong>{statsBloqueo.flotantes} productos flotantes</strong> en base de datos.
                  {statsBloqueo.bloqueados > 0 && (
                    <span className="block text-amber-400 font-semibold mt-1">
                      🔒 {statsBloqueo.bloqueados} productos con candado están protegidos y NO serán alterados.
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span>Estrategia:</span>
                  <span className="font-bold text-white">
                    {margenConfig.tipo === "utilidad" ? "Margen de Utilidad (Sobre Venta)" : "Markup (Sobre Costo)"}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Margen Divisas ($):</span>
                  <span className="font-bold">{margenConfig.porcentaje}%</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>Margen BCV ($ / Bs):</span>
                  <span className="font-bold">{margenConfig.porcentajeBcv}%</span>
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
                          const { precioVenta, precioBcv, precioTecnico } = calcularPrecios(
                            c,
                            margenConfig.tipo,
                            form.margen_bloqueado ? (form.margen_individual || margenConfig.porcentaje) : margenConfig.porcentaje,
                            margenConfig.descuentoTecnicoPct,
                            margenConfig.porcentajeBcv
                          );
                          setForm({
                            ...form,
                            precio_costo: c,
                            precio_venta: precioVenta,
                            precio_bcv: precioBcv,
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
                    Precio Divisas ($ Efectivo / Zelle)
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
                        const pb = form.precio_bcv > 0 ? form.precio_bcv : Math.round(pv * 1.10 * 100) / 100;
                        setForm({ ...form, precio_venta: pv, precio_bcv: pb, precio_tecnico: pt });
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                    Precio BCV ($ Factura / Liquidación Oficial)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyan-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.precio_bcv}
                      onChange={(e) => setForm({ ...form, precio_bcv: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  {tasaBcv > 0 && form.precio_bcv > 0 && (
                    <p className="text-[10px] font-mono text-cyan-400 mt-1 font-semibold">
                      ≈ Bs. {(form.precio_bcv * tasaBcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                {puedeVerCostos && (
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                      Margen Individual (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="99"
                      value={form.margen_individual !== undefined && form.margen_individual !== null ? form.margen_individual : 28}
                      onChange={(e) => setForm({ ...form, margen_individual: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-emerald-400 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox de Bloqueo / Candado */}
              <div className="p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {form.margen_bloqueado ? (
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Unlock className="w-4 h-4 text-[var(--ts-text-muted)] shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">
                      Bloquear margen de este producto (Candado 🔒)
                    </p>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">
                      Protege este producto para que el slider o ajustes globales no alteren sus precios.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.margen_bloqueado}
                  onChange={(e) => setForm({ ...form, margen_bloqueado: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
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
