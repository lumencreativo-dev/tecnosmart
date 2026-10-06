"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ProductoExtraido {
  codigo_sku: string;
  nombre: string;
  precio_venta: number;
  especificaciones: string;
}

type Estado = "idle" | "procesando" | "listo" | "error";

export default function ImportarPage() {
  const [estado, setEstado]     = useState<Estado>("idle");
  const [mensaje, setMensaje]   = useState("");
  const [items, setItems]       = useState<ProductoExtraido[]>([]);
  const [guardados, setGuardados] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Procesa el PDF de forma simple: usa FileReader para texto
   * Para extracción real de PDF, integrar pdfjs-dist en client-side
   */
  const handleFile = async (file: File) => {
    if (!file || !file.name.endsWith(".pdf")) {
      setEstado("error");
      setMensaje("Por favor selecciona un archivo PDF válido.");
      return;
    }
    setEstado("procesando");
    setMensaje(`Procesando: ${file.name}`);

    // Importar pdf.js dinámicamente (client-side)
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;

      let textoCompleto = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page    = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const texto   = content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str)
          .join(" ");
        textoCompleto += texto + "\n";
      }

      // Extracción heurística de modelos Hikvision (DS-XXXX)
      const regex = /\b(DS-[\w\-]+(?:\/[\w\-]+)*)\b/g;
      const matches = [...new Set(textoCompleto.match(regex) ?? [])];

      // Buscar precios adyacentes (patrón: número decimal)
      const extracted: ProductoExtraido[] = matches.slice(0, 50).map((sku, i) => ({
        codigo_sku:     sku,
        nombre:         `Producto Hikvision ${sku}`,
        precio_venta:   0, // El usuario debe completar
        especificaciones: textoCompleto.slice(
          Math.max(0, textoCompleto.indexOf(sku) - 20),
          textoCompleto.indexOf(sku) + 120
        ).replace(/\s+/g, " ").trim(),
      }));

      setItems(extracted);
      setEstado(extracted.length > 0 ? "listo" : "error");
      setMensaje(
        extracted.length > 0
          ? `Se encontraron ${extracted.length} modelos. Revisa y confirma antes de importar.`
          : "No se detectaron modelos Hikvision (DS-XXXX) en el PDF."
      );
    } catch {
      setEstado("error");
      setMensaje("Error al leer el PDF. Asegúrate de que no esté protegido.");
    }
  };

  const guardarEnSupabase = async () => {
    setEstado("procesando");
    const insertados: string[] = [];

    for (const p of items) {
      if (p.precio_venta <= 0) continue; // Solo insertar si tiene precio

      const { error } = await supabase.from("productos").upsert(
        {
          codigo_sku: p.codigo_sku,
          nombre: p.nombre,
          marca: "Hikvision",
          precio_venta: p.precio_venta,
          precio_costo: 0,
          especificaciones_json: { descripcion: p.especificaciones },
          activo: true,
        },
        { onConflict: "codigo_sku" }
      );

      if (!error) insertados.push(p.codigo_sku);
    }

    setGuardados(insertados);
    setEstado("listo");
    setMensaje(
      `✓ ${insertados.length} productos guardados en Supabase.${
        insertados.length < items.length
          ? ` (${items.length - insertados.length} omitidos por precio = 0)`
          : ""
      }`
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">
          Importar Catálogo PDF
        </h1>
        <p className="text-sm text-[#6e6e6e] mt-1">
          Sube una lista de precios o hoja técnica Hikvision en PDF para
          extraer modelos e importarlos al catálogo de productos.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-[#d9d9d9] hover:border-[#c9242b] rounded-2xl py-16 px-8 text-center cursor-pointer transition-colors group"
      >
        <Upload className="w-10 h-10 text-[#6e6e6e] group-hover:text-[#c9242b] mx-auto mb-3 transition-colors" />
        <p className="text-sm font-medium text-[#111111]">
          Arrastra un PDF aquí o{" "}
          <span className="text-[#c9242b] underline">haz clic para seleccionar</span>
        </p>
        <p className="text-xs text-[#6e6e6e] mt-1">
          Listas de precios Hikvision, hojas técnicas, catálogos
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

      {/* Estado */}
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
          {estado === "procesando" && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {estado === "listo" && <CheckCircle className="w-4 h-4" />}
          {estado === "error" && <AlertCircle className="w-4 h-4" />}
          {mensaje}
        </div>
      )}

      {/* Tabla de items extraídos */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wide">
              Modelos Detectados ({items.length})
            </h2>
            <button
              onClick={guardarEnSupabase}
              disabled={estado === "procesando"}
              className="flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Importar a Catálogo
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#d9d9d9]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#111111] text-white">
                  <th className="text-left px-4 py-2 font-semibold">SKU / Modelo</th>
                  <th className="text-left px-4 py-2 font-semibold">Nombre</th>
                  <th className="text-left px-4 py-2 font-semibold">Precio Venta (USD)</th>
                  <th className="text-left px-4 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.codigo_sku}
                    className={`border-b border-[#d9d9d9] ${i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}`}
                  >
                    <td className="px-4 py-2 font-mono font-bold text-[#c9242b]">{p.codigo_sku}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={p.nombre}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x, xi) =>
                              xi === i ? { ...x, nombre: e.target.value } : x
                            )
                          )
                        }
                        className="w-full border border-[#d9d9d9] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[#6e6e6e]">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={p.precio_venta}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((x, xi) =>
                                xi === i
                                  ? { ...x, precio_venta: parseFloat(e.target.value) || 0 }
                                  : x
                              )
                            )
                          }
                          className="w-24 border border-[#d9d9d9] rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {guardados.includes(p.codigo_sku) ? (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Importado
                        </span>
                      ) : (
                        <span className="text-[#6e6e6e]">Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#6e6e6e] mt-2">
            💡 Completa el precio de venta antes de importar. Productos con precio $0 serán omitidos.
          </p>
        </div>
      )}
    </div>
  );
}
