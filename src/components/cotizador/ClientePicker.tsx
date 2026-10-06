"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, ChevronRight, Building2, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Cliente } from "@/lib/types";

interface Props {
  onSelect: (cliente: Cliente) => void;
  clienteSeleccionado: Cliente | null;
}

const CLIENTE_VACIO: Cliente = {
  empresa: "", rif_cedula: "", contacto: "",
  email: "", telefono: "", direccion: "", tipo: "cliente_normal",
};

export default function ClientePicker({ onSelect, clienteSeleccionado }: Props) {
  const [modo, setModo] = useState<"buscar" | "nuevo">("buscar");
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [form, setForm] = useState<Cliente>(CLIENTE_VACIO);
  const [guardando, setGuardando] = useState(false);

  // Búsqueda reactiva
  const buscar = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .or(`empresa.ilike.%${q}%,rif_cedula.ilike.%${q}%,contacto.ilike.%${q}%`)
      .limit(8);
    setResultados(data ?? []);
    setBuscando(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 300);
    return () => clearTimeout(t);
  }, [query, buscar]);

  const guardarNuevoCliente = async () => {
    if (!form.empresa && !form.contacto) return;
    setGuardando(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert([form])
      .select()
      .single();
    setGuardando(false);
    if (!error && data) {
      onSelect(data as Cliente);
      setModo("buscar");
      setQuery("");
    } else {
      alert("Error al guardar cliente: " + error?.message);
    }
  };

  // Si ya hay un cliente seleccionado, mostrar resumen
  if (clienteSeleccionado?.empresa || clienteSeleccionado?.contacto) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#c9242b]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#c9242b]" />
          </div>
          <div>
            <p className="font-semibold text-[#111111] text-sm">
              {clienteSeleccionado.empresa || clienteSeleccionado.contacto}
            </p>
            <p className="text-xs text-[#6e6e6e]">
              {clienteSeleccionado.rif_cedula && `${clienteSeleccionado.rif_cedula} · `}
              {clienteSeleccionado.telefono}
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelect(CLIENTE_VACIO)}
          className="text-xs text-[#c9242b] hover:underline"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5]">
        <button
          onClick={() => setModo("buscar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            modo === "buscar"
              ? "text-[#c9242b] border-b-2 border-[#c9242b]"
              : "text-[#6e6e6e] hover:text-[#111111]"
          }`}
        >
          <Search className="w-4 h-4" /> Buscar cliente existente
        </button>
        <button
          onClick={() => setModo("nuevo")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            modo === "nuevo"
              ? "text-[#c9242b] border-b-2 border-[#c9242b]"
              : "text-[#6e6e6e] hover:text-[#111111]"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="p-4">
        {/* ── MODO BUSCAR ── */}
        {modo === "buscar" && (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
              <input
                type="text"
                placeholder="Buscar por empresa, RIF o contacto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] focus:ring-1 focus:ring-[#c9242b]/30"
              />
            </div>

            {buscando && (
              <p className="text-xs text-[#6e6e6e] text-center mt-3">Buscando...</p>
            )}

            {resultados.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-52 overflow-y-auto">
                {resultados.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => onSelect(c)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f5] transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#111111]">
                          {c.empresa || c.contacto}
                        </p>
                        <p className="text-xs text-[#6e6e6e] flex items-center gap-2">
                          {c.rif_cedula && <span>{c.rif_cedula}</span>}
                          {c.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{c.telefono}
                            </span>
                          )}
                          {c.tipo === "tecnico" && (
                            <span className="bg-[#c9242b]/10 text-[#c9242b] px-1.5 py-0.5 rounded text-[10px] font-bold">
                              TÉCNICO
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6e6e6e]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && !buscando && resultados.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-[#6e6e6e]">No encontrado.</p>
                <button
                  onClick={() => { setModo("nuevo"); setForm({ ...CLIENTE_VACIO, empresa: query }); }}
                  className="mt-2 text-sm text-[#c9242b] hover:underline font-medium"
                >
                  + Crear "{query}" como nuevo cliente
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MODO NUEVO ── */}
        {modo === "nuevo" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "empresa",    label: "Empresa / Razón Social", required: true },
                { key: "rif_cedula", label: "RIF / Cédula" },
                { key: "contacto",   label: "Nombre de Contacto", required: true },
                { key: "telefono",   label: "Teléfono / WhatsApp" },
                { key: "email",      label: "Email" },
                { key: "direccion",  label: "Dirección" },
              ].map(({ key, label, required }) => (
                <div key={key} className={key === "direccion" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-[#6e6e6e] mb-1">
                    {label}{required && <span className="text-[#c9242b]"> *</span>}
                  </label>
                  <input
                    type="text"
                    value={form[key as keyof Cliente] as string ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] focus:ring-1 focus:ring-[#c9242b]/30"
                  />
                </div>
              ))}
            </div>

            {/* Tipo de cliente */}
            <div>
              <label className="block text-xs font-medium text-[#6e6e6e] mb-1">Tipo de cliente</label>
              <div className="flex gap-3">
                {[
                  { val: "cliente_normal", label: "Cliente Final" },
                  { val: "tecnico",        label: "Técnico / Instalador" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setForm(f => ({ ...f, tipo: val as Cliente["tipo"] }))}
                    className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                      form.tipo === val
                        ? "bg-[#c9242b] border-[#c9242b] text-white"
                        : "border-[#d9d9d9] text-[#6e6e6e] hover:border-[#c9242b] hover:text-[#c9242b]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={guardarNuevoCliente}
              disabled={guardando || (!form.empresa && !form.contacto)}
              className="w-full bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar y usar este cliente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
