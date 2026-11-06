"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload, CheckCircle2, AlertTriangle, AlertCircle, Loader2,
  Trash2, RefreshCw, Filter, Sliders, TrendingUp, TrendingDown,
  DollarSign, ArrowUpRight, ArrowDownRight, Check, X, Copy,
  FileText, ShieldCheck, ChevronDown, Layers, Sparkles, HelpCircle,
  Percent, ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import ProtectedView from "@/components/cotizador/ProtectedView";
import { inferirMarcaPorSKU } from "@/lib/skuMatcher";

// ─────────────────────────────────────────────────────────────
// TIPOS DE DATOS
// ─────────────────────────────────────────────────────────────

export interface ProductoStaging {
  id: string;
  codigo_sku: string;
  nombre: string;
  descripcion: string;
  marca: string;
  categoria: string;
  precio_costo: number;
  precio_venta: number;
  precio_tecnico: number;
  estatus_proveedor: string;
  cantidad_proveedor: number | null;

  // Conciliación con BD
  estado_conciliacion: "NUEVO" | "CAMBIO_PRECIO" | "SIN_CAMBIOS" | "DUPLICADO_ARCHIVO";
  db_producto_id?: string;
  costo_anterior?: number;
  precio_venta_anterior?: number;
  variacion_costo_pct?: number;

  seleccionado: boolean;
  precio_manual?: boolean;
}

export type TipoMargen = "utilidad" | "markup";

export interface MargenConfig {
  tipo: TipoMargen;
  porcentaje: number;           // Default: 28%
  descuentoTecnicoPct: number;  // Default: 15%
}

export type FiltroEstado = "TODOS" | "NUEVO" | "CAMBIO_PRECIO" | "SIN_CAMBIOS" | "DUPLICADO_ARCHIVO";

export type ModoImportacion = "completo" | "solo_cambios" | "solo_nuevos";

// ─────────────────────────────────────────────────────────────
// LISTAS DE MARCAS Y CATEGORÍAS
// ─────────────────────────────────────────────────────────────
const MARCAS_PREDETERMINADAS = [
  "EZVIZ", "Hikvision", "HiLook", "Dahua", "CDP", "MikroTik", "Grandstream",
  "Reyee", "Ubiquiti", "Starlink", "Huawei", "Cablix", "STC", "LinkedPro",
  "Hiksemi", "Adata", "Acer", "Tapo", "TP-Link", "Nexxt",
  "ZKTeco", "Must", "Western Digital", "Seagate", "Genérico", "Otra"
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

const SPANISH_STOPWORDS = new Set([
  "MARCA", "MODELO", "DESCRIPCION", "DESCRIPCIÓN", "IMAGEN", "PRECIO",
  "ESTATUS", "STATUS", "INSTALADOR", "CANTIDAD", "TOTAL", "DISPONIBLE",
  "TRANSITO", "EN TRANSITO", "NO DISPONIBLE", "DISPONIBÑE", "PAGINA", "PÁGINA",
  "ADAPTADOR", "CABLE", "CAJA", "PUNTO", "SWITCH", "ROUTER", "UNIDAD",
  "FUENTE", "MODULO", "MEMORIA", "DISCO", "ANTENA", "CONECTOR", "ATENUADOR",
  "HERRAJE", "HERRAMIENTA", "PINZAS", "CORTADOR", "ROSETA", "HEBILLA",
  "GANCHO", "TENSOR", "SPLITER", "JUMPER", "PIGTAIL", "CERRADURA", "CAMARA",
  "KIT", "SENSOR", "SIRENA", "MONITOR", "ENCHUFE", "ROBOT", "PORTA", "MINI"
]);

// ─────────────────────────────────────────────────────────────
// PARSEO DE NÚMEROS Y MONEDA MULTIFORMATO
// ─────────────────────────────────────────────────────────────
function parsearNumeroMoneda(str: string): number | null {
  if (!str) return null;
  const s = str.trim().replace(/^[\$€Bs\.\s]+/, "");
  if (!s || s === "-" || s === "N/A" || s === "NO") return null;

  // 1) 1.852,94 o 12.564,71 (punto miles, coma decimal)
  if (s.includes(".") && s.includes(",")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      const clean = s.replace(/\./g, "").replace(",", ".");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    } else {
      // 2,124.00 (coma miles, punto decimal)
      const clean = s.replace(/,/g, "");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    }
  }

  // 2) 15,77 o 0,09 (coma decimal)
  if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      const clean = s.replace(",", ".");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    } else {
      const clean = s.replace(/,/g, "");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    }
  }

  // 3) 30.00 o 43.00 (punto decimal)
  if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    } else if (parts.length > 2) {
      const clean = s.replace(/\./g, "");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    } else {
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    }
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ─────────────────────────────────────────────────────────────
// MOTOR DE MÁRGENES MATEMÁTICO
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// INFERENCIA INTELIGENTE DE CATEGORÍAS POR PALABRAS CLAVE
// ─────────────────────────────────────────────────────────────
function inferirCategoria(texto: string, categoriaBanner: string): string {
  if (categoriaBanner && categoriaBanner !== "Varios") return categoriaBanner;
  const t = texto.toUpperCase();

  if (t.includes("UPS") || t.includes("RESPALDO") || t.includes("ALIMENTACION") || t.includes("RECTIFICADOR")) {
    if (t.includes("ON-LINE") || t.includes("DOBLE CONVERSION") || t.includes("TORRE") || t.includes("RACK")) return "Fuentes de Poder / UPS";
    return "Fuentes de Poder / UPS";
  }
  if (t.includes("AVR") || t.includes("REGULADOR")) return "Reguladores de Voltaje / AVR";
  if (t.includes("BATERIA") || t.includes("BATERÍA") || t.includes("INVERSOR") || t.includes("SOLAR")) return "Inversores y Baterías";
  if (t.includes("FIBRA") || t.includes("PATCH CORD") || t.includes("JUMPER") || t.includes("SPLITER") || t.includes("ATENUADOR") || t.includes("SC/APC") || t.includes("SC/UPC") || t.includes("ADSS")) {
    if (t.includes("CAJA") || t.includes("EMPALME") || t.includes("ROSETA") || t.includes("TERMINACION") || t.includes("ODF")) return "Cajas de Empalme y ODF";
    if (t.includes("BOBINA") || t.includes("CARRETE") || t.includes("CABLE DROP")) return "Carretes de Fibra y Cables";
    return "Conectividad y Fibra Óptica";
  }
  if (t.includes("HERRAJE") || t.includes("GRAPA") || t.includes("FLEJE") || t.includes("HEBILLA") || t.includes("ABRAZADERA") || t.includes("GANCHO") || t.includes("TENSOR")) {
    return "Herrajes y Fijación";
  }
  if (t.includes("CORTADOR") || t.includes("PELACABLES") || t.includes("PINZAS") || t.includes("CRIMPEADORA") || t.includes("SUNCHADORA") || t.includes("LIMPIADOR")) {
    return "Herramientas y Limpiadores";
  }
  if (t.includes("SWITCH") || t.includes("S67") || t.includes("S53") || t.includes("S31") || t.includes("S22") || t.includes("10GE") || t.includes("100GE") || t.includes("POE") || t.includes("SFPP") || t.includes("SFP")) {
    return "Switches Empresariales";
  }
  if (t.includes("OLT") || t.includes("ONT") || t.includes("GPON") || t.includes("ROUTER") || t.includes("ACCESS POINT") || t.includes("AP") || t.includes("WIFI 6") || t.includes("WIFI 7") || t.includes("FIREWALL")) {
    return "Redes, Routers y OLT/ONT";
  }
  if (t.includes("CAMARA") || t.includes("CÁMARA") || t.includes("PTZ") || t.includes("DOMO") || t.includes("BULLET") || t.includes("TURRET") || t.includes("NVR") || t.includes("DVR") || t.includes("EZVIZ")) {
    if (t.includes("WIFI") || t.includes("SOLAR") || t.includes("BATERIA")) return "Cámaras WiFi / PTZ";
    return "Cámaras Analógicas y Domos";
  }
  if (t.includes("SSD") || t.includes("DISCO DURO") || t.includes("NVME") || t.includes("SATA") || t.includes("PENDRIVE")) return "Discos Duros y SSD";
  if (t.includes("RAM") || t.includes("SODIMM") || t.includes("UDIMM") || t.includes("DDR4") || t.includes("DDR5") || t.includes("MICROSD") || t.includes("MICRO SD")) return "Memorias RAM y MicroSD";
  if (t.includes("CERRADURA") || t.includes("PORTERO") || t.includes("TIMBRE") || t.includes("IDEAHUB") || t.includes("PANTALLA")) return "Video Porteros y Pantallas";
  if (t.includes("ALARMA") || t.includes("SENSOR") || t.includes("SIRENA") || t.includes("MAGNETICO")) return "Alarmas y Sensores";

  return "Accesorios y Varios";
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ImportarPage() {
  const [estado, setEstado] = useState<"idle" | "cargando" | "listo" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [items, setItems] = useState<ProductoStaging[]>([]);
  const [dbProductos, setDbProductos] = useState<any[]>([]);
  const [cargandoDb, setCargandoDb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroMarca, setFiltroMarca] = useState("TODAS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");

  // Configuración de Margen
  const [margenConfig, setMargenConfig] = useState<MargenConfig>({
    tipo: "utilidad",
    porcentaje: 28,
    descuentoTecnicoPct: 15,
  });

  // Modo de Importación
  const [modoImportacion, setModoImportacion] = useState<ModoImportacion>("completo");
  const [guardando, setGuardando] = useState(false);
  const [resultadoGuardado, setResultadoGuardado] = useState<{ actualizados: number; creados: number; omitidos: number } | null>(null);

  // ── 1. Cargar catálogo existente de Supabase ────────────────
  const cargarInventarioDB = async () => {
    setCargandoDb(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, codigo_sku, nombre, marca, categoria, precio_costo, precio_venta, precio_tecnico, stock");
      if (!error && data) {
        setDbProductos(data);
      }
    } catch (e) {
      console.error("Error cargando productos de BD:", e);
    } finally {
      setCargandoDb(false);
    }
  };

  useEffect(() => {
    cargarInventarioDB();
  }, []);

  // ── 2. Mapa indexado de productos existentes ────────────────
  const dbIndexMap = useMemo(() => {
    const map = new Map<string, any>();
    dbProductos.forEach(p => {
      if (p.codigo_sku) {
        const key = p.codigo_sku.trim().toUpperCase().replace(/\s+/g, "");
        map.set(key, p);
      }
    });
    return map;
  }, [dbProductos]);

  // ── 3. Motor de Conciliación ────────────────────────────────
  const conciliarProducto = (
    sku: string,
    costoNuevo: number,
    dbMap: Map<string, any>,
    skusEnArchivo: Set<string>
  ): {
    estado: "NUEVO" | "CAMBIO_PRECIO" | "SIN_CAMBIOS" | "DUPLICADO_ARCHIVO";
    dbProd?: any;
    costoAnterior?: number;
    precioVentaAnterior?: number;
    variacionPct?: number;
  } => {
    const cleanSku = sku.trim().toUpperCase().replace(/\s+/g, "");

    if (skusEnArchivo.has(cleanSku)) {
      return { estado: "DUPLICADO_ARCHIVO" };
    }

    const dbProd = dbMap.get(cleanSku);
    if (!dbProd) {
      return { estado: "NUEVO" };
    }

    const costoAnterior = Number(dbProd.precio_costo || 0);
    const precioVentaAnterior = Number(dbProd.precio_venta || 0);
    const diff = costoNuevo - costoAnterior;

    if (Math.abs(diff) > 0.02) {
      const variacionPct = costoAnterior > 0
        ? Math.round((diff / costoAnterior) * 1000) / 10
        : 100;
      return {
        estado: "CAMBIO_PRECIO",
        dbProd,
        costoAnterior,
        precioVentaAnterior,
        variacionPct,
      };
    }

    return {
      estado: "SIN_CAMBIOS",
      dbProd,
      costoAnterior,
      precioVentaAnterior,
      variacionPct: 0,
    };
  };

  // ── 4. Parser Inteligente Multiesquema de PDF ───────────────
  const procesarPDF = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setEstado("error");
      setMensaje("Por favor selecciona un archivo PDF válido.");
      return;
    }

    setEstado("cargando");
    setMensaje(`Analizando estructura inteligente de: ${file.name}...`);
    setResultadoGuardado(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

      const itemsExtraidos: ProductoStaging[] = [];
      const skusEnEsteArchivo = new Set<string>();

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const rawItems = (textContent.items as any[])
          .map(it => ({ str: String(it.str || "").trim(), x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) }))
          .filter(it => it.str.length > 0);

        if (rawItems.length === 0) continue;

        // 1. Detección Inteligente de Cabeceras de Columnas
        const skuHeader = rawItems.find(it => it.y > 600 && /(SKU|MODELO|CODIGO|CÓDIGO|PART NUMBER)/i.test(it.str));
        const descHeader = rawItems.find(it => it.y > 600 && /(NOMBRE|DESCRIPCI[OÓ]N|DETALLE|PRODUCTO)/i.test(it.str));
        const costHeader = rawItems.find(it => it.y > 600 && /(COSTO|PRECIO|PVP|VALOR)/i.test(it.str));
        const estadoHeader = rawItems.find(it => it.y > 600 && /(ESTADO|CONCILIA|ESTATUS|STATUS)/i.test(it.str));

        const tieneCabeceraColumnar = !!(skuHeader && (descHeader || costHeader));

        let skuLeft = 55;
        let skuRight = 230;
        let descRight = 410;
        let headerYCutoff = 800;

        if (tieneCabeceraColumnar && skuHeader) {
          headerYCutoff = Math.min(
            skuHeader.y,
            descHeader ? descHeader.y : skuHeader.y,
            costHeader ? costHeader.y : skuHeader.y
          ) - 4;

          const xSku = skuHeader.x;
          const xDesc = descHeader ? descHeader.x : (costHeader ? (xSku + costHeader.x) / 2 : xSku + 150);
          const xCost = costHeader ? costHeader.x : xDesc + 140;
          const xEstado = estadoHeader ? estadoHeader.x : 0;

          skuLeft = xEstado > 0 && xEstado < xSku ? (xEstado + xSku) / 2 : Math.max(0, xSku - 70);
          skuRight = (xSku + xDesc) / 2;
          descRight = (xDesc + xCost) / 2;
        }

        const bodyItems = rawItems.filter(it => it.y < headerYCutoff);

        // Detectar ítems de SKU en la banda vertical
        const skuItems = bodyItems
          .filter(it => it.x >= skuLeft && it.x < skuRight)
          .sort((a, b) => b.y - a.y);

        if (skuItems.length > 0) {
          // ── MODO 1: EXTRACCIÓN GEOMÉTRICA POR BANDAS DE COLUMNA (Ultra-Preciso) ──
          // Resistente a textos centrados, alineados a la izquierda o derecha
          const descItems = bodyItems.filter(it => it.x >= skuRight && it.x < descRight);
          const costItems = bodyItems.filter(it => it.x >= descRight);
          const estadoItems = bodyItems.filter(it => it.x < skuLeft);

          skuItems.forEach((sku, idx) => {
            const cleanSku = sku.str.trim();
            if (!cleanSku || SPANISH_STOPWORDS.has(cleanSku.toUpperCase())) return;

            // Rango vertical de esta fila
            const prevY = idx > 0 ? skuItems[idx - 1].y : headerYCutoff;
            const nextY = idx < skuItems.length - 1 ? skuItems[idx + 1].y : 0;
            const topBound = (sku.y + prevY) / 2;
            const bottomBound = (sku.y + nextY) / 2;

            // Extraer descripción perteneciente a este rango Y (unir múltiples líneas si aplica)
            const matchingDescs = descItems
              .filter(d => d.y <= topBound && d.y > bottomBound)
              .sort((a, b) => b.y - a.y);
            const descTexto = matchingDescs.map(d => d.str).join(" ").trim();
            const nombreLimpio = descTexto || cleanSku;

            // Extraer costo de proveedor en este rango Y
            const matchingCosts = costItems
              .filter(c => c.y <= topBound && c.y > bottomBound)
              .sort((a, b) => b.y - a.y);
            let costoProv = 0;
            if (matchingCosts.length > 0) {
              for (const cItem of matchingCosts) {
                const parsed = parsearNumeroMoneda(cItem.str);
                if (parsed !== null && parsed >= 0) {
                  costoProv = parsed;
                  break;
                }
              }
            }

            // Extraer estado / disponibilidad
            const matchingEstados = estadoItems.filter(e => e.y <= topBound && e.y > bottomBound);
            let estatus = "DISPONIBLE";
            matchingEstados.forEach(e => {
              const eUp = e.str.toUpperCase();
              if (eUp.includes("TRANSIT")) estatus = "EN TRANSITO";
              else if (eUp.includes("NO DISPON")) estatus = "NO DISPONIBLE";
            });

            // Inteligencia de Marca y Categoría:
            // 1. Primero consultar si ya existe en Supabase y tiene marca asignada
            const skuKey = cleanSku.toUpperCase().replace(/\s+/g, "");
            const prodExistente = dbIndexMap.get(skuKey);

            let marcaFinal = "";
            let catFinal = "";

            if (prodExistente && prodExistente.marca && prodExistente.marca !== "Otra" && prodExistente.marca !== "Huawei") {
              marcaFinal = prodExistente.marca;
              catFinal = prodExistente.categoria || "Accesorios y Varios";
            } else {
              // 2. Inferir mediante el motor inteligente skuMatcher
              const inferencia = inferirMarcaPorSKU(cleanSku, nombreLimpio);
              marcaFinal = inferencia.marca;
              catFinal = inferencia.categoria;
            }

            // Conciliación con BD
            const conciliacion = conciliarProducto(cleanSku, costoProv, dbIndexMap, skusEnEsteArchivo);
            skusEnEsteArchivo.add(skuKey);

            // Cálculos con margen
            const calcs = calcularPrecios(
              costoProv,
              margenConfig.tipo,
              margenConfig.porcentaje,
              margenConfig.descuentoTecnicoPct
            );

            itemsExtraidos.push({
              id: `stag-${Date.now()}-${itemsExtraidos.length}`,
              codigo_sku: cleanSku.toUpperCase(),
              nombre: nombreLimpio,
              descripcion: descTexto || nombreLimpio,
              marca: marcaFinal,
              categoria: catFinal,
              precio_costo: costoProv,
              precio_venta: calcs.precioVenta,
              precio_tecnico: calcs.precioTecnico,
              estatus_proveedor: estatus,
              cantidad_proveedor: null,
              estado_conciliacion: conciliacion.estado,
              db_producto_id: conciliacion.dbProd?.id,
              costo_anterior: conciliacion.costoAnterior,
              precio_venta_anterior: conciliacion.precioVentaAnterior,
              variacion_costo_pct: conciliacion.variacionPct,
              seleccionado: true,
            });
          });
        } else {
          // ── MODO 2: FALLBACK POR FILAS HORIZONTALES PARA FORMATOS NO COLUMNAR ──
          rawItems.sort((a, b) => b.y - a.y || a.x - b.x);
          const filas: { str: string; x: number; y: number }[][] = [];
          let filaActual: { str: string; x: number; y: number }[] = [rawItems[0]];
          let yActual = rawItems[0].y;

          for (let i = 1; i < rawItems.length; i++) {
            const item = rawItems[i];
            if (Math.abs(item.y - yActual) <= 6) {
              filaActual.push(item);
            } else {
              filas.push([...filaActual].sort((a, b) => a.x - b.x));
              filaActual = [item];
              yActual = item.y;
            }
          }
          if (filaActual.length > 0) filas.push([...filaActual].sort((a, b) => a.x - b.x));

          for (const fila of filas) {
            const lineaTexto = fila.map(f => f.str).join(" ").trim();
            const lineaUp = lineaTexto.toUpperCase();

            // Buscar costo
            let precioEncontrado: number = 0;
            let idxPrecio = -1;
            for (let fi = fila.length - 1; fi >= 0; fi--) {
              const token = fila[fi].str;
              const p = parsearNumeroMoneda(token);
              if (p !== null && p >= 0 && !SPANISH_STOPWORDS.has(token.toUpperCase())) {
                if (fila[fi].x > 450 || token.includes(",") || token.includes(".")) {
                  precioEncontrado = p;
                  idxPrecio = fi;
                  break;
                }
              }
            }

            // Buscar SKU / Modelo
            let modeloEncontrado = "";
            let idxModelo = -1;
            for (let fi = 0; fi < fila.length; fi++) {
              if (fi === idxPrecio) continue;
              const token = fila[fi].str;
              const tUp = token.toUpperCase();
              if (SPANISH_STOPWORDS.has(tUp)) continue;
              if (token.length >= 2 && token.length <= 45) {
                modeloEncontrado = token;
                idxModelo = fi;
                break;
              }
            }

            if (!modeloEncontrado) continue;

            const partesDesc = fila
              .filter((_, idx) => idx !== idxModelo && idx !== idxPrecio)
              .map(f => f.str)
              .join(" ")
              .trim();

            const nombreLimpio = partesDesc || modeloEncontrado;
            const inferencia = inferirMarcaPorSKU(modeloEncontrado, nombreLimpio);

            const conciliacion = conciliarProducto(
              modeloEncontrado,
              precioEncontrado,
              dbIndexMap,
              skusEnEsteArchivo
            );
            skusEnEsteArchivo.add(modeloEncontrado.trim().toUpperCase().replace(/\s+/g, ""));

            const calculos = calcularPrecios(
              precioEncontrado,
              margenConfig.tipo,
              margenConfig.porcentaje,
              margenConfig.descuentoTecnicoPct
            );

            itemsExtraidos.push({
              id: `stag-${Date.now()}-${itemsExtraidos.length}`,
              codigo_sku: modeloEncontrado.toUpperCase().trim(),
              nombre: nombreLimpio,
              descripcion: partesDesc || nombreLimpio,
              marca: inferencia.marca,
              categoria: inferencia.categoria,
              precio_costo: precioEncontrado,
              precio_venta: calculos.precioVenta,
              precio_tecnico: calculos.precioTecnico,
              estatus_proveedor: "DISPONIBLE",
              cantidad_proveedor: null,
              estado_conciliacion: conciliacion.estado,
              db_producto_id: conciliacion.dbProd?.id,
              costo_anterior: conciliacion.costoAnterior,
              precio_venta_anterior: conciliacion.precioVentaAnterior,
              variacion_costo_pct: conciliacion.variacionPct,
              seleccionado: true,
            });
          }
        }
      }

      setItems(itemsExtraidos);
      setEstado(itemsExtraidos.length > 0 ? "listo" : "error");
      setMensaje(
        itemsExtraidos.length > 0
          ? `✓ Se extrajeron y conciliaron ${itemsExtraidos.length} productos con éxito.`
          : "No se pudieron detectar productos estructurados. Verifica que el archivo contenga texto seleccionable."
      );
    } catch (err: any) {
      console.error("Error procesando PDF:", err);
      setEstado("error");
      setMensaje(`Error al procesar el documento PDF: ${err.message || "Estructura no compatible"}`);
    }
  };

  // ── 5. Recalcular Precios de Venta en todo el lote ───────────
  const aplicarNuevoMargen = (
    nuevoTipo: TipoMargen,
    nuevoPct: number,
    nuevoDescTec: number
  ) => {
    setMargenConfig({
      tipo: nuevoTipo,
      porcentaje: nuevoPct,
      descuentoTecnicoPct: nuevoDescTec,
    });

    setItems(prev =>
      prev.map(item => {
        if (item.precio_manual) return item; // Respetar si el usuario lo editó a mano
        const c = calcularPrecios(item.precio_costo, nuevoTipo, nuevoPct, nuevoDescTec);
        return {
          ...item,
          precio_venta: c.precioVenta,
          precio_tecnico: c.precioTecnico,
        };
      })
    );
  };

  // ── 6. Métricas y KPIs de la mesa de trabajo ────────────────
  const kpis = useMemo(() => {
    const total = items.length;
    const nuevos = items.filter(i => i.estado_conciliacion === "NUEVO").length;
    const cambiosPrecio = items.filter(i => i.estado_conciliacion === "CAMBIO_PRECIO").length;
    const sinCambios = items.filter(i => i.estado_conciliacion === "SIN_CAMBIOS").length;
    const duplicados = items.filter(i => i.estado_conciliacion === "DUPLICADO_ARCHIVO").length;
    const seleccionados = items.filter(i => i.seleccionado).length;

    return { total, nuevos, cambiosPrecio, sinCambios, duplicados, seleccionados };
  }, [items]);

  // ── 7. Filtrado para la tabla ───────────────────────────────
  const itemsFiltrados = useMemo(() => {
    return items.filter(i => {
      // Filtro de Estado de conciliación
      if (filtroEstado !== "TODOS" && i.estado_conciliacion !== filtroEstado) {
        return false;
      }
      // Filtro de Marca
      if (filtroMarca !== "TODAS" && i.marca !== filtroMarca) {
        return false;
      }
      // Filtro de Categoría
      if (filtroCategoria !== "TODAS" && i.categoria !== filtroCategoria) {
        return false;
      }
      // Búsqueda textual
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return (
          i.codigo_sku.toLowerCase().includes(q) ||
          i.nombre.toLowerCase().includes(q) ||
          i.marca.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filtroEstado, filtroMarca, filtroCategoria, busqueda]);

  // ── 8. Acciones de selección masiva ─────────────────────────
  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = new Set(itemsFiltrados.map(i => i.id));
    setItems(prev =>
      prev.map(it => (visibleIds.has(it.id) ? { ...it, seleccionado: checked } : it))
    );
  };

  // ── 9. Guardar e Impactar en Supabase ───────────────────────
  const ejecutarImportacion = async () => {
    // Filtrar según modo de importación
    const aProcesar = items.filter(i => {
      if (!i.seleccionado) return false;
      if (modoImportacion === "solo_cambios") return i.estado_conciliacion === "CAMBIO_PRECIO";
      if (modoImportacion === "solo_nuevos") return i.estado_conciliacion === "NUEVO";
      return true;
    });

    if (aProcesar.length === 0) {
      alert("No hay productos seleccionados para importar con el modo actual.");
      return;
    }

    setGuardando(true);
    let creados = 0;
    let actualizados = 0;
    let omitidos = 0;

    try {
      for (const p of aProcesar) {
        const payload = {
          codigo_sku: p.codigo_sku,
          nombre: p.nombre,
          marca: p.marca,
          categoria: p.categoria,
          precio_costo: p.precio_costo,
          precio_venta: p.precio_venta,
          precio_tecnico: p.precio_tecnico,
          stock: p.cantidad_proveedor ?? 0,
          activo: true,
          especificaciones_json: {
            estatus_proveedor: p.estatus_proveedor,
            ultima_actualizacion_masiva: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("productos").upsert(payload, {
          onConflict: "codigo_sku",
        });

        if (!error) {
          if (p.estado_conciliacion === "NUEVO") creados++;
          else actualizados++;
        } else {
          omitidos++;
          console.error(`Error guardando ${p.codigo_sku}:`, error);
        }
      }

      setResultadoGuardado({ creados, actualizados, omitidos });
      // Recargar catálogo en memoria para actualizar estado
      await cargarInventarioDB();
    } catch (e: any) {
      console.error("Error en importación masiva:", e);
      alert(`Error durante la importación: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ProtectedView permiso="inventario.importar" modulo="Carga Masiva Inteligente">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── ENCABEZADO PRINCIPAL ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 bg-[var(--ts-red)]/15 text-[var(--ts-red)] rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold text-[var(--ts-text-primary)]">
                Carga Masiva Inteligente & Conciliación de Precios
              </h1>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] max-w-2xl leading-relaxed">
              Carga listas de precios de mayoristas (Huawei, CDP, EZVIZ, Fibra, etc.), detecta variaciones de costo en tiempo real, filtra duplicados y recalcula márgenes de utilidad comercial automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={cargarInventarioDB}
              disabled={cargandoDb}
              className="flex items-center gap-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] border border-[var(--ts-border)] px-3.5 py-2 rounded-xl transition-all"
              title="Sincronizar base de datos de productos de TecnoSmart"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoDb ? "animate-spin text-[var(--ts-red)]" : ""}`} />
              <span>{cargandoDb ? "Sincronizando BD..." : `${dbProductos.length} productos en BD`}</span>
            </button>
          </div>
        </div>

        {/* ── ZONA DE CARGA DEL ARCHIVO PDF ── */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) procesarPDF(f);
          }}
          className="border-2 border-dashed border-[var(--ts-border)] hover:border-[var(--ts-red)]/60 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)]/50 rounded-3xl py-10 px-6 text-center cursor-pointer transition-all group shadow-sm"
        >
          <div className="w-14 h-14 bg-[var(--ts-red)]/10 text-[var(--ts-red)] rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-[var(--ts-text-primary)]">
            Haz clic o arrastra un catálogo PDF de proveedor aquí
          </p>
          <p className="text-xs text-[var(--ts-text-muted)] mt-1 max-w-lg mx-auto">
            Soporta catálogos multiesquema: Huawei FTTH, CDP / Hikvision UPS, Conectividad de Fibra, CCTV EZVIZ y Almacenamiento PC con precios en formato europeo o estadounidense.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) procesarPDF(f);
            }}
          />
        </div>

        {/* ── ESTADO DEL PROCESAMIENTO ── */}
        {estado !== "idle" && (
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-semibold border ${
              estado === "cargando"
                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                : estado === "listo"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-red-500/10 text-red-300 border-red-500/30"
            }`}
          >
            {estado === "cargando" && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {estado === "listo" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {estado === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{mensaje}</span>
          </div>
        )}

        {/* ── PANEL DE RESULTADOS TRAS IMPORTACIÓN ── */}
        {resultadoGuardado && (
          <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-transparent border border-emerald-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">¡Inventario Actualizado Exitosamente!</h3>
                <p className="text-xs text-emerald-200/80">
                  {resultadoGuardado.creados} productos creados · {resultadoGuardado.actualizados} costos/precios actualizados
                  {resultadoGuardado.omitidos > 0 && ` · ${resultadoGuardado.omitidos} con observaciones`}
                </p>
              </div>
            </div>
            <a
              href="/inventario"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Ver en Inventario General →
            </a>
          </div>
        )}

        {/* ── CUANDO HAY PRODUCTOS EXTRAÍDOS EN LA MESA DE TRABAJO ── */}
        {items.length > 0 && (
          <div className="space-y-6">

            {/* ── 1. AUDITORÍA / KPIS DEL LOTE ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total */}
              <button
                type="button"
                onClick={() => setFiltroEstado("TODOS")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filtroEstado === "TODOS"
                    ? "bg-[var(--ts-surface-2)] border-[var(--ts-red)] shadow-md"
                    : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-[var(--ts-border-2)]"
                }`}
              >
                <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Total Leídos</p>
                <p className="text-2xl font-black text-[var(--ts-text-primary)] mt-1">{kpis.total}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">{kpis.seleccionados} seleccionados</p>
              </button>

              {/* Nuevos */}
              <button
                type="button"
                onClick={() => setFiltroEstado("NUEVO")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filtroEstado === "NUEVO"
                    ? "bg-emerald-500/15 border-emerald-500 shadow-md"
                    : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🟢 Nuevos</p>
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1">{kpis.nuevos}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">No existen en BD</p>
              </button>

              {/* Cambio de Precio */}
              <button
                type="button"
                onClick={() => setFiltroEstado("CAMBIO_PRECIO")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filtroEstado === "CAMBIO_PRECIO"
                    ? "bg-amber-500/15 border-amber-500 shadow-md"
                    : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">🟡 Costo Modificado</p>
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1">{kpis.cambiosPrecio}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Proveedor varió costo</p>
              </button>

              {/* Sin Cambios */}
              <button
                type="button"
                onClick={() => setFiltroEstado("SIN_CAMBIOS")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filtroEstado === "SIN_CAMBIOS"
                    ? "bg-slate-500/15 border-slate-400 shadow-md"
                    : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-slate-500/40"
                }`}
              >
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">⚪ Sin Cambios</p>
                <p className="text-2xl font-black text-slate-200 mt-1">{kpis.sinCambios}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Costo idéntico</p>
              </button>

              {/* Duplicados en archivo */}
              <button
                type="button"
                onClick={() => setFiltroEstado("DUPLICADO_ARCHIVO")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filtroEstado === "DUPLICADO_ARCHIVO"
                    ? "bg-red-500/15 border-red-500 shadow-md"
                    : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-red-500/40"
                }`}
              >
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">🔴 Repetidos PDF</p>
                <p className="text-2xl font-black text-red-400 mt-1">{kpis.duplicados}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Mismo SKU en archivo</p>
              </button>

              {/* Acceso Rápido Recálculo */}
              <div className="p-4 rounded-2xl border border-[var(--ts-border)] bg-[var(--ts-surface)] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Estrategia Activa</p>
                  <p className="text-xs font-black text-white mt-1">
                    {margenConfig.tipo === "utilidad" ? "Margen de Utilidad" : "Markup"} {margenConfig.porcentaje}%
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Técnico: -{margenConfig.descuentoTecnicoPct}%</span>
              </div>
            </div>

            {/* ── 2. PANEL DE CONFIGURACIÓN DE MÁRGENES Y PRECIOS ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--ts-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--ts-red)]" />
                    <h2 className="text-sm font-bold text-[var(--ts-text-primary)]">
                      Motor de Márgenes y Fijación de Precios de Venta
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                    Modifica el margen deseado para que los precios de venta se recalculen instantáneamente para todo el lote.
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

              {/* Controles de Porcentaje y Presets */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Input de Porcentaje */}
                <div className="md:col-span-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-[var(--ts-text-primary)] flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                      Porcentaje de Margen Deseado:
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
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {margenConfig.tipo === "utilidad" ? (
                      <>
                        <strong>Fórmula de Margen de Utilidad:</strong> <code>PVP = Costo / (1 - {margenConfig.porcentaje}%)</code>.
                        Para un ítem de <strong>$100.00</strong> de costo $\rightarrow$ <strong>PVP: ${(100 / (1 - margenConfig.porcentaje / 100)).toFixed(2)}</strong> (Ganancia neta: ${((100 / (1 - margenConfig.porcentaje / 100)) - 100).toFixed(2)}, margen exacto del {margenConfig.porcentaje}% del total).
                      </>
                    ) : (
                      <>
                        <strong>Fórmula de Markup sobre Costo:</strong> <code>PVP = Costo × (1 + {margenConfig.porcentaje}%)</code>.
                        Para un ítem de <strong>$100.00</strong> de costo $\rightarrow$ <strong>PVP: ${(100 * (1 + margenConfig.porcentaje / 100)).toFixed(2)}</strong> (Margen sobre costo: {margenConfig.porcentaje}%).
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 3. FILTROS Y BARRA DE HERRAMIENTAS DE LA TABLA ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Buscador */}
              <div className="flex items-center gap-2.5 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por SKU, modelo o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl text-xs text-white placeholder-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              {/* Filtros de Marca y Categoría */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filtroMarca}
                  onChange={(e) => setFiltroMarca(e.target.value)}
                  className="px-3 py-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="TODAS">Todas las Marcas</option>
                  {MARCAS_PREDETERMINADAS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="px-3 py-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="TODAS">Todas las Categorías</option>
                  {CATEGORIAS_PREDETERMINADAS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 border-l border-[var(--ts-border)] pl-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-white rounded-lg text-xs font-semibold"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-white rounded-lg text-xs font-semibold"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
            </div>

            {/* ── 4. TABLA INTELIGENTE DE PRODUCTOS ── */}
            <div className="border border-[var(--ts-border)] rounded-3xl overflow-hidden bg-[var(--ts-surface)] shadow-md">
              <div className="overflow-x-auto max-h-[580px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--ts-surface-2)] z-10 text-[var(--ts-text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--ts-border)]">
                    <tr>
                      <th className="p-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={itemsFiltrados.length > 0 && itemsFiltrados.every(i => i.seleccionado)}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 accent-[var(--ts-red)] rounded"
                        />
                      </th>
                      <th className="p-3 font-bold">Estado / Conciliación</th>
                      <th className="p-3 font-bold">SKU / Modelo</th>
                      <th className="p-3 font-bold">Marca & Categoría</th>
                      <th className="p-3 font-bold min-w-[260px]">Nombre & Descripción</th>
                      <th className="p-3 font-bold text-right whitespace-nowrap">Costo Prov.</th>
                      <th className="p-3 font-bold text-right whitespace-nowrap">P. Venta</th>
                      <th className="p-3 font-bold text-right whitespace-nowrap">P. Técnico</th>
                      <th className="p-3 font-bold text-center">Margen</th>
                      <th className="p-3 font-bold text-center">Estatus</th>
                      <th className="p-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border-2)]">
                    {itemsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-xs text-[var(--ts-text-muted)]">
                          No hay productos que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      itemsFiltrados.map((item, idx) => {
                        const esNuevo = item.estado_conciliacion === "NUEVO";
                        const esCambio = item.estado_conciliacion === "CAMBIO_PRECIO";
                        const esDuplicado = item.estado_conciliacion === "DUPLICADO_ARCHIVO";
                        const variacion = item.variacion_costo_pct || 0;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-[var(--ts-surface-2)] transition-colors ${
                              !item.seleccionado ? "opacity-40 bg-black/20" : idx % 2 === 0 ? "bg-[var(--ts-surface)]" : "bg-[var(--ts-surface)]/70"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.seleccionado}
                                onChange={(e) => {
                                  const c = e.target.checked;
                                  setItems(prev => prev.map(it => it.id === item.id ? { ...it, seleccionado: c } : it));
                                }}
                                className="w-4 h-4 accent-[var(--ts-red)] rounded"
                              />
                            </td>

                            {/* Estado de conciliación */}
                            <td className="p-3 whitespace-nowrap">
                              {esNuevo && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  NUEVO
                                </span>
                              )}
                              {esCambio && (
                                <div className="space-y-0.5">
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    variacion > 0
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  }`}>
                                    {variacion > 0 ? <ArrowUpRight className="w-3 h-3 text-red-400" /> : <ArrowDownRight className="w-3 h-3 text-emerald-400" />}
                                    {variacion > 0 ? `+${variacion}%` : `${variacion}%`}
                                  </span>
                                  <p className="text-[9px] text-[var(--ts-text-muted)] font-mono">
                                    Antes: {formatUSD(item.costo_anterior || 0)}
                                  </p>
                                </div>
                              )}
                              {item.estado_conciliacion === "SIN_CAMBIOS" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                                  SIN CAMBIO
                                </span>
                              )}
                              {esDuplicado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/30">
                                  REPETIDO PDF
                                </span>
                              )}
                            </td>

                            {/* SKU / Modelo */}
                            <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                              <span className="text-[var(--ts-red)]">{item.codigo_sku}</span>
                            </td>

                            {/* Marca & Categoría */}
                            <td className="p-3 space-y-1">
                              <select
                                value={item.marca}
                                onChange={(e) => {
                                  const m = e.target.value;
                                  setItems(prev => prev.map(it => it.id === item.id ? { ...it, marca: m } : it));
                                }}
                                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                              >
                                {MARCAS_PREDETERMINADAS.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>

                              <select
                                value={item.categoria}
                                onChange={(e) => {
                                  const cat = e.target.value;
                                  setItems(prev => prev.map(it => it.id === item.id ? { ...it, categoria: cat } : it));
                                }}
                                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-2 py-1 text-[10px] text-[var(--ts-text-muted)] focus:outline-none"
                              >
                                {CATEGORIAS_PREDETERMINADAS.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </td>

                            {/* Nombre & Descripción */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.nombre}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItems(prev => prev.map(it => it.id === item.id ? { ...it, nombre: val } : it));
                                }}
                                className="w-full bg-transparent border-b border-transparent hover:border-[var(--ts-border)] focus:border-[var(--ts-red)] px-1 py-0.5 text-xs text-[var(--ts-text-primary)] font-medium focus:outline-none"
                                title={item.descripcion}
                              />
                            </td>

                            {/* Costo Proveedor */}
                            <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.precio_costo}
                                onChange={(e) => {
                                  const c = parseFloat(e.target.value) || 0;
                                  const calcs = calcularPrecios(c, margenConfig.tipo, margenConfig.porcentaje, margenConfig.descuentoTecnicoPct);
                                  setItems(prev => prev.map(it => it.id === item.id ? {
                                    ...it,
                                    precio_costo: c,
                                    precio_venta: calcs.precioVenta,
                                    precio_tecnico: calcs.precioTecnico,
                                  } : it));
                                }}
                                className={`w-20 text-right bg-[var(--ts-surface-2)] border rounded-lg px-2 py-1 text-xs font-mono font-bold ${
                                  item.precio_costo === 0 ? "border-amber-500/60 text-amber-300" : "border-[var(--ts-border)] text-white"
                                }`}
                              />
                              {item.precio_costo === 0 && (
                                <p className="text-[9px] text-amber-400 font-sans font-medium mt-0.5 text-right">
                                  Sin costo en PDF
                                </p>
                              )}
                            </td>

                            {/* Precio Venta */}
                            <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.precio_venta}
                                onChange={(e) => {
                                  const pv = parseFloat(e.target.value) || 0;
                                  setItems(prev => prev.map(it => it.id === item.id ? {
                                    ...it,
                                    precio_venta: pv,
                                    precio_manual: true,
                                  } : it));
                                }}
                                className="w-24 text-right bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono font-bold"
                              />
                            </td>

                            {/* Precio Técnico */}
                            <td className="p-3 text-right font-mono text-[var(--ts-text-muted)] whitespace-nowrap">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.precio_tecnico}
                                onChange={(e) => {
                                  const pt = parseFloat(e.target.value) || 0;
                                  setItems(prev => prev.map(it => it.id === item.id ? { ...it, precio_tecnico: pt } : it));
                                }}
                                className="w-20 text-right bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-2 py-1 text-[11px] text-[var(--ts-text-muted)] font-mono"
                              />
                            </td>

                            {/* Margen Real % */}
                            <td className="p-3 text-center whitespace-nowrap font-mono text-[11px] font-bold">
                              {item.precio_venta > 0 && item.precio_costo > 0 ? (
                                <span className="text-emerald-400">
                                  {Math.round(((item.precio_venta - item.precio_costo) / item.precio_venta) * 100)}%
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Estatus Proveedor */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                item.estatus_proveedor.includes("DISPONIB")
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}>
                                {item.cantidad_proveedor ? `${item.cantidad_proveedor} un.` : item.estatus_proveedor}
                              </span>
                            </td>

                            {/* Eliminar fila */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar fila de la mesa de trabajo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 5. BARRA FINAL DE ACCIÓN E IMPORTACIÓN SEGURA ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1">
                    Modo de Ingesta Segura:
                  </label>
                  <select
                    value={modoImportacion}
                    onChange={(e) => setModoImportacion(e.target.value as ModoImportacion)}
                    className="px-3.5 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    <option value="completo">Actualizar existentes y agregar nuevos (Recomendado)</option>
                    <option value="solo_cambios">Solo actualizar precios de productos existentes</option>
                    <option value="solo_nuevos">Solo agregar productos nuevos al catálogo</option>
                  </select>
                </div>

                <div className="text-xs text-[var(--ts-text-muted)] space-y-0.5">
                  <p>
                    Se impactarán <strong>{kpis.seleccionados} productos</strong> en el inventario.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    Se utiliza UPSERT inteligente con preservación de histórico.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={ejecutarImportacion}
                disabled={guardando || kpis.seleccionados === 0}
                className="w-full md:w-auto px-8 py-4 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-red-900/30"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Importando y sincronizando inventario...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar e Importar al Inventario ({kpis.seleccionados})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </ProtectedView>
  );
}
