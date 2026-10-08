"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ProductoExtraido {
  codigo_sku: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  precio_tecnico: number;  // columna "15%"
  marca: string;
  categoria: string;
}

type Estado = "idle" | "procesando" | "listo" | "error";

// ──────────────────────────────────────────────
// Parser de tabla PDF columnar (por página)
// Columnas esperadas: SKU/Modelo | NOMBRE | Precio Venta (USD) | costo | 15%
//
// ESTRATEGIA:
//  - Se agrupa por Y con tolerancia ±4pts (filas en PDFs de hoja de cálculo
//    pueden tener ítems con Y que difiere 1-3pts dentro de la misma fila)
//  - Se llama UNA VEZ POR PÁGINA para evitar confusión de coordenadas
// ──────────────────────────────────────────────
function parsearPagina(pageItems: { str: string; transform: number[] }[]): ProductoExtraido[] {
  // 1. Recolectar ítems con coordenadas reales (sin redondear)
  const raw = pageItems
    .map(item => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
    .filter(item => item.str.length > 0);

  if (raw.length === 0) return [];

  // 2. Ordenar: Y descendente (arriba del PDF primero), luego X ascendente
  raw.sort((a, b) => b.y - a.y || a.x - b.x);

  // 3. Agrupar en filas con tolerancia de ±4 puntos en Y
  const TOLERANCIA_Y = 4;
  const lineas: { str: string; x: number }[][] = [];
  let filaActual: { str: string; x: number }[] = [raw[0]];
  let yActual = raw[0].y;

  for (let i = 1; i < raw.length; i++) {
    const item = raw[i];
    if (Math.abs(item.y - yActual) <= TOLERANCIA_Y) {
      filaActual.push(item);
    } else {
      // Guardar fila actual ordenada por X y empezar una nueva
      lineas.push([...filaActual].sort((a, b) => a.x - b.x));
      filaActual = [item];
      yActual = item.y;
    }
  }
  if (filaActual.length > 0) {
    lineas.push([...filaActual].sort((a, b) => a.x - b.x));
  }

  // 4. Palabras de encabezado/pie a ignorar (en minúsculas)
  const HEADERS = new Set([
    "sku", "modelo", "sku/modelo", "sku / modelo",
    "nombre", "precio", "venta", "usd", "costo",
    "descripcion", "descripción", "marca", "categoría",
    "categoria", "product", "items", "item", "código",
    "codigo", "15%", "%", "total", "subtotal",
    // Encabezados multi-palabra comunes en listas de precios
    "precio venta", "precio venta (usd)", "sku / modelo",
  ]);

  // 5. Procesar cada fila detectada
  const productos: ProductoExtraido[] = [];

  for (const celdas of lineas) {
    const textos = celdas.map(c => c.str);

    // Necesitamos el SKU + al menos un valor más
    if (textos.length < 2) continue;

    const posibleSKU = textos[0];

    // Descartar encabezados conocidos
    if (HEADERS.has(posibleSKU.toLowerCase())) continue;
    // Debe empezar con letra
    if (!/^[A-Za-z]/.test(posibleSKU)) continue;
    // Longitud razonable (SKUs legítimos raramente superan 50 chars)
    if (posibleSKU.length < 2 || posibleSKU.length > 50) continue;
    // NOTA: NO filtramos por espacios — hay SKUs válidos como "PA 1M",
    // "CANALETAS 39*19", "CANALETAS R25". El filtro de "sin precios = no producto"
    // es suficiente para descartar filas espurias.

    // Extraer números de la fila (ignorar el SKU)
    const numeros = textos
      .slice(1)
      .map(t => parseFloat(t.replace(",", ".")))
      .filter(n => !isNaN(n) && n > 0);

    // Sin precios → no es fila de producto
    if (numeros.length === 0) continue;

    // Separar texto no-numérico (nombre y posibles fragmentos del SKU)
    const restoParts = textos.slice(1).filter(t => isNaN(parseFloat(t.replace(",", "."))));

    // Reconectar SKUs partidos por "/"
    // Si el PDF dividió "CAJ-PLAS/R-PEQ" en ["CAJ-PLAS", "/", "R-PEQ"],
    // el primer fragmento de restoParts será "/" o "/ALGO" → unirlo al SKU
    let skuFinal = posibleSKU;
    let nombreParts = restoParts;

    if (restoParts.length > 0) {
      const primer = restoParts[0];
      // Si empieza con "/" o es exactamente "/", es continuación del SKU
      if (primer.startsWith("/") || primer === "/") {
        skuFinal = posibleSKU + primer;
        // El siguiente token podría ser aún más del SKU (p.ej. "R-PEQ" sin "/")
        nombreParts = restoParts.slice(1);
      }
    }

    const nombre = nombreParts.join(" ").trim() || `[Sin nombre] ${skuFinal}`;

    // Columnas: Precio Venta | Costo | 15% (Técnico)
    productos.push({
      codigo_sku:    skuFinal.toUpperCase(),
      nombre,
      precio_venta:   numeros[0] ?? 0,
      precio_costo:   numeros[1] ?? 0,
      precio_tecnico: numeros[2] ?? 0,
      marca:         "Hikvision",
      categoria:     "Cámaras Analógicas",
    });
  }

  return productos;
}

// Opciones de marcas y categorías
const MARCAS = [
  "Hikvision","HiLook","Ezviz","Dahua","Tapo","TP-Link",
  "Marsiva","ZKTeco","CDP","Must","Starlink","Western Digital",
  "Seagate","Genérico","Otra",
];

const CATEGORIAS = [
  "Cámaras Analógicas","Cámaras IP","Cámaras WiFi / PTZ","DVR / NVR",
  "Discos Duros","Cables y Bobinas","Conectores y Baluns",
  "Fuentes de Poder / UPS","Control de Acceso","Redes y Routers",
  "Alarmas","Domótica","Accesorios","Servicios","Otros",
];

export default function ImportarPage() {
  const [estado, setEstado]       = useState<Estado>("idle");
  const [mensaje, setMensaje]     = useState("");
  const [items, setItems]         = useState<ProductoExtraido[]>([]);
  const [guardados, setGuardados] = useState<string[]>([]);
  // Valores globales por defecto aplicables a todos los items
  const [marcaGlobal, setMarcaGlobal]         = useState("Hikvision");
  const [categoriaGlobal, setCategoriaGlobal] = useState("Cámaras Analógicas");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || !file.name.endsWith(".pdf")) {
      setEstado("error");
      setMensaje("Por favor selecciona un archivo PDF válido.");
      return;
    }
    setEstado("procesando");
    setMensaje(`Procesando: ${file.name}`);
    setGuardados([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer  = await file.arrayBuffer();
      const pdfDoc  = await pdfjsLib.getDocument({ data: buffer }).promise;

      // Procesar CADA PÁGINA por separado para evitar que las coordenadas Y
      // de la página 2 colisionen con las de la página 1
      const todosLosProductos: ProductoExtraido[] = [];
      const skusVistos = new Set<string>();

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page    = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageItems = content.items as { str: string; transform: number[] }[];
        const pageProds = parsearPagina(pageItems);

        // Deduplicar por SKU al combinar páginas
        for (const p of pageProds) {
          if (!skusVistos.has(p.codigo_sku)) {
            skusVistos.add(p.codigo_sku);
            todosLosProductos.push(p);
          }
        }
      }

      const extraidos = todosLosProductos;

      // Aplicar marca y categoría global como default
      const conDefaults = extraidos.map(p => ({
        ...p,
        marca:     marcaGlobal,
        categoria: categoriaGlobal,
      }));

      setItems(conDefaults);
      setEstado(conDefaults.length > 0 ? "listo" : "error");
      setMensaje(
        conDefaults.length > 0
          ? `✓ Se detectaron ${conDefaults.length} productos. Revisa y ajusta antes de importar.`
          : "No se detectaron productos con formato de tabla (SKU | Nombre | Precio) en el PDF."
      );
    } catch {
      setEstado("error");
      setMensaje("Error al leer el PDF. Asegúrate de que no esté protegido o sea un archivo de imagen.");
    }
  };

  // Aplicar marca/categoría global a todos los items
  const aplicarGlobal = () => {
    setItems(prev => prev.map(p => ({ ...p, marca: marcaGlobal, categoria: categoriaGlobal })));
  };

  // Eliminar fila de la lista previa al import
  const eliminarItem = (i: number) => {
    setItems(prev => prev.filter((_, xi) => xi !== i));
  };

  const guardarEnSupabase = async () => {
    setEstado("procesando");
    const insertados: string[] = [];
    const errores: string[]    = [];

    for (const p of items) {
      const { error } = await supabase.from("productos").upsert(
        {
          codigo_sku:            p.codigo_sku,
          nombre:                p.nombre,
          marca:                 p.marca,
          categoria:             p.categoria,
          precio_venta:          p.precio_venta,
          precio_costo:          p.precio_costo  || 0,
          precio_tecnico:        p.precio_tecnico || null,
          especificaciones_json: {},
          activo:                true,
        },
        { onConflict: "codigo_sku" }
      );

      if (!error) insertados.push(p.codigo_sku);
      else errores.push(p.codigo_sku);
    }

    setGuardados(insertados);
    setEstado("listo");
    setMensaje(
      `✓ ${insertados.length} productos importados.${errores.length > 0 ? ` ⚠️ ${errores.length} con error.` : ""}`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--ts-text-primary)]">
          Importar Catálogo PDF
        </h1>
        <p className="text-sm text-[var(--ts-text-muted)] mt-1">
          Sube una lista de precios en PDF con columnas: <strong>SKU / Modelo · Nombre · Precio Venta · Costo · 15%</strong>
        </p>
      </div>

      {/* ── Defaults globales ── */}
      <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
            Marca por defecto
          </label>
          <select
            value={marcaGlobal}
            onChange={(e) => setMarcaGlobal(e.target.value)}
            className="border border-[var(--ts-border)] rounded-lg px-3 py-2 text-sm bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
          >
            {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
            Categoría por defecto
          </label>
          <select
            value={categoriaGlobal}
            onChange={(e) => setCategoriaGlobal(e.target.value)}
            className="border border-[var(--ts-border)] rounded-lg px-3 py-2 text-sm bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
          >
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {items.length > 0 && (
          <button
            onClick={aplicarGlobal}
            className="px-4 py-2 bg-[#111] hover:bg-[#333] text-[var(--ts-text-primary)] text-xs font-bold rounded-lg transition-colors"
          >
            Aplicar a todos
          </button>
        )}
        <p className="text-xs text-[var(--ts-text-muted)] self-end">
          Puedes modificar marca y categoría por fila individualmente.
        </p>
      </div>

      {/* ── Drop zone ── */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-[var(--ts-border)] hover:border-[var(--ts-red)] rounded-2xl py-14 px-8 text-center cursor-pointer transition-colors group"
      >
        <Upload className="w-10 h-10 text-[var(--ts-text-muted)] group-hover:text-[var(--ts-red)] mx-auto mb-3 transition-colors" />
        <p className="text-sm font-medium text-[var(--ts-text-primary)]">
          Arrastra un PDF aquí o{" "}
          <span className="text-[var(--ts-red)] underline">haz clic para seleccionar</span>
        </p>
        <p className="text-xs text-[var(--ts-text-muted)] mt-1">
          Listas de precios con tabla de SKU, nombre y precios
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {/* ── Estado ── */}
      {estado !== "idle" && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
            estado === "procesando"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : estado === "listo"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {estado === "procesando" && <Loader2 className="w-4 h-4 animate-spin" />}
          {estado === "listo"      && <CheckCircle className="w-4 h-4" />}
          {estado === "error"      && <AlertCircle className="w-4 h-4" />}
          {mensaje}
        </div>
      )}

      {/* ── Tabla de items extraídos ── */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
              Productos detectados ({items.length})
            </h2>
            <button
              onClick={guardarEnSupabase}
              disabled={estado === "procesando"}
              className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-[var(--ts-text-primary)] text-sm font-bold px-5 py-2 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Importar a Catálogo
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--ts-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--ts-surface-raised)] text-white">
                  <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">SKU / Modelo</th>
                  <th className="text-left px-3 py-2 font-semibold">Nombre del Producto</th>
                  <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Marca</th>
                  <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Categoría</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">P. Venta $</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Costo $</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">P. Técnico $</th>
                  <th className="text-center px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={`${p.codigo_sku}-${i}`}
                    className={`border-b border-[var(--ts-border)] ${i % 2 === 0 ? "bg-[var(--ts-surface)]" : "bg-[var(--ts-surface-2)]"}`}
                  >
                    {/* SKU */}
                    <td className="px-3 py-1.5 font-mono font-bold text-[var(--ts-red)] whitespace-nowrap">
                      {p.codigo_sku}
                    </td>

                    {/* Nombre */}
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={p.nombre}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, nombre: e.target.value } : x)
                          )
                        }
                        className="w-full min-w-[200px] border border-[var(--ts-border)] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      />
                    </td>

                    {/* Marca */}
                    <td className="px-3 py-1.5">
                      <select
                        value={p.marca}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, marca: e.target.value } : x)
                          )
                        }
                        className="border border-[var(--ts-border)] rounded px-1.5 py-1 text-xs bg-[var(--ts-surface)] focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      >
                        {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>

                    {/* Categoría */}
                    <td className="px-3 py-1.5">
                      <select
                        value={p.categoria}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, categoria: e.target.value } : x)
                          )
                        }
                        className="border border-[var(--ts-border)] rounded px-1.5 py-1 text-xs bg-[var(--ts-surface)] focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      >
                        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>

                    {/* Precio Venta */}
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min={0} step={0.01}
                        value={p.precio_venta}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, precio_venta: parseFloat(e.target.value) || 0 } : x)
                          )
                        }
                        className="w-20 border border-[var(--ts-border)] rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      />
                    </td>

                    {/* Costo */}
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min={0} step={0.01}
                        value={p.precio_costo}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, precio_costo: parseFloat(e.target.value) || 0 } : x)
                          )
                        }
                        className="w-20 border border-[var(--ts-border)] rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      />
                    </td>

                    {/* Precio Técnico (15%) */}
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min={0} step={0.01}
                        value={p.precio_tecnico}
                        onChange={(e) =>
                          setItems(prev =>
                            prev.map((x, xi) => xi === i ? { ...x, precio_tecnico: parseFloat(e.target.value) || 0 } : x)
                          )
                        }
                        className="w-20 border border-[var(--ts-border)] rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      />
                    </td>

                    {/* Estado */}
                    <td className="px-3 py-1.5 text-center whitespace-nowrap">
                      {guardados.includes(p.codigo_sku) ? (
                        <span className="text-green-600 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> OK
                        </span>
                      ) : (
                        <span className="text-[#aaa]">Pendiente</span>
                      )}
                    </td>

                    {/* Eliminar fila */}
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => eliminarItem(i)}
                        className="text-[#d9d9d9] hover:text-red-500 transition-colors"
                        title="Quitar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[var(--ts-text-muted)] mt-2">
            💡 Puedes editar cualquier campo antes de importar. Se usa <strong>upsert</strong> por SKU, así que actualiza productos existentes si el SKU ya existe.
          </p>
        </div>
      )}
    </div>
  );
}
