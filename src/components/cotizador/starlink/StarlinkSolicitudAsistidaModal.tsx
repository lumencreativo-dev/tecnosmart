"use client";

import { useState } from "react";
import {
  X,
  User,
  Phone,
  FileText,
  MapPin,
  Camera,
  Upload,
  Send,
  Satellite,
  Wifi,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { guardarSolicitudStarlink } from "@/lib/starlinkSolicitudes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function StarlinkSolicitudAsistidaModal({
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedulaRif, setCedulaRif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [planDeseado, setPlanDeseado] = useState("Starlink Residencial");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [notas, setNotas] = useState("");

  const [fotoFrontal, setFotoFrontal] = useState<string | null>(null);
  const [fotoTrasera, setFotoTrasera] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: "frontal" | "trasera") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      if (tipo === "frontal") setFotoFrontal(b64);
      else setFotoTrasera(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !cedulaRif.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg("Completa los campos obligatorios (*).");
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    const res = await guardarSolicitudStarlink({
      nombre_completo: nombreCompleto.trim(),
      cedula_rif: cedulaRif.trim(),
      telefono: telefono.trim(),
      email: email.trim() || undefined,
      direccion: direccion.trim(),
      plan_deseado: planDeseado,
      wifi_ssid_preferido: wifiSsid.trim() || undefined,
      wifi_password_preferido: wifiPassword.trim() || undefined,
      cedula_frontal_url: fotoFrontal || undefined,
      cedula_trasera_url: fotoTrasera || undefined,
      notas: notas.trim() ? `[Asistida Tienda/WhatsApp]: ${notas.trim()}` : "[Asistida Tienda/WhatsApp]",
      estado: "pendiente",
      origen: "asistida_tienda",
    });

    setGuardando(false);

    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMsg(res.error || "Error al registrar la solicitud.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                Cargar Solicitud Asistida (WhatsApp / Tienda)
              </h2>
              <p className="text-xs text-[var(--ts-text-muted)]">
                Registra los datos y fotos enviados por el cliente para activar su antena más tarde
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Nombre Completo del Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Carlos Mendoza o Empresa Ejemplo C.A."
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Cédula o RIF *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: V-14.890.123"
                value={cedulaRif}
                onChange={(e) => setCedulaRif(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: 0414-4141887"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Dirección Exacta de Instalación *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Finca San José, Tinaquillo / Casa Francis"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Plan Deseado
              </label>
              <select
                value={planDeseado}
                onChange={(e) => setPlanDeseado(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              >
                <option value="Starlink Residencial">Starlink Residencial ($50/mes)</option>
                <option value="Starlink Itinerante 100GB">Starlink Itinerante 100GB ($70/mes)</option>
                <option value="Starlink Itinerante Ilimitado">Starlink Itinerante Ilimitado ($120/mes)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Correo Personal (Opcional)
              </label>
              <input
                type="email"
                placeholder="cliente@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>

          {/* Fotos de Cédula recibidas por WhatsApp */}
          <div className="border border-[var(--ts-border)] rounded-xl p-3.5 bg-[var(--ts-surface-2)]/40 space-y-3">
            <label className="block text-xs font-bold text-[var(--ts-text-primary)]">
              Fotos de la Cédula (Guardadas del WhatsApp)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Frontal */}
              <div>
                <span className="block text-[10px] text-[var(--ts-text-muted)] mb-1">Cédula Frontal</span>
                {fotoFrontal ? (
                  <div className="relative aspect-[3/2] rounded-xl overflow-hidden border border-emerald-500/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fotoFrontal} alt="Frontal" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotoFrontal(null)}
                      className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-[var(--ts-border)] hover:border-[var(--ts-red)] rounded-xl aspect-[3/2] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-[var(--ts-surface)]">
                    <Upload className="w-5 h-5 text-[var(--ts-text-muted)] mb-1" />
                    <span className="text-[11px] font-bold text-[var(--ts-text-primary)]">Subir Frontal</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "frontal")} className="hidden" />
                  </label>
                )}
              </div>

              {/* Trasera */}
              <div>
                <span className="block text-[10px] text-[var(--ts-text-muted)] mb-1">Cédula Trasera</span>
                {fotoTrasera ? (
                  <div className="relative aspect-[3/2] rounded-xl overflow-hidden border border-emerald-500/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fotoTrasera} alt="Trasera" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotoTrasera(null)}
                      className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-[var(--ts-border)] hover:border-[var(--ts-red)] rounded-xl aspect-[3/2] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-[var(--ts-surface)]">
                    <Upload className="w-5 h-5 text-[var(--ts-text-muted)] mb-1" />
                    <span className="text-[11px] font-bold text-[var(--ts-text-primary)]">Subir Trasera</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "trasera")} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Preferencias de WiFi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                WiFi SSID Preferido (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Starlink-Finca"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                Clave WiFi Preferida (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Finca2026*"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
              Notas Internas de Instalación
            </label>
            <input
              type="text"
              placeholder="Ej: Pasó la ubicación por audio, requiere cable de 45m..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[var(--ts-border)] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{guardando ? "Guardando..." : "Guardar en Solicitudes Pendientes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
