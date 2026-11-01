"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Phone, ArrowRight, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function FormularioAsesoria() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState<"Cliente Final" | "Técnico-Instalador">("Cliente Final");
  const [necesidad, setNecesidad] = useState("Cámaras y seguridad");
  const [zona, setZona] = useState("");
  const [problema, setProblema] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;

    setGuardando(true);

    // 1. Guardar en Supabase (tabla `solicitudes_asesoria`)
    try {
      await supabase.from("solicitudes_asesoria").insert([
        {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          tipo,
          necesidad,
          zona: zona.trim() || null,
          problema: problema.trim() || null,
          estado: "nuevo",
          origen: "landing_web",
        },
      ]);
    } catch (err) {
      console.warn("Aviso: Registro local previo a ejecutar SQL en Supabase:", err);
    }

    // 2. Crear mensaje estructurado para WhatsApp oficial (0412-2789273)
    const textoMensaje = `*Solicitud de Asesoría Gratuita - TecnoSmart VZL*%0A` +
      `*Nombre:* ${encodeURIComponent(nombre.trim())}%0A` +
      `*Teléfono/WhatsApp:* ${encodeURIComponent(telefono.trim())}%0A` +
      `*Tipo:* ${encodeURIComponent(tipo)}%0A` +
      `*Necesidad:* ${encodeURIComponent(necesidad)}%0A` +
      `*Zona/Ciudad:* ${encodeURIComponent(zona.trim() || "No especificada")}%0A` +
      `*Detalle:* ${encodeURIComponent(problema.trim() || "Deseo recibir la llamada de un ingeniero")}`;

    const urlWhatsApp = `https://wa.me/584122789273?text=${textoMensaje}`;
    
    // Abrir WhatsApp para atención inmediata por parte de un ingeniero
    window.open(urlWhatsApp, "_blank", "noopener,noreferrer");
    setGuardando(false);
    setEnviado(true);
  };

  return (
    <section id="asesoria-gratuita" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center mb-12">
          <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
            Atención Especializada
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-black text-white tracking-tight">
            Solicita tu Asesoría Gratuita
          </h2>
          
          {/* Promesa Visible */}
          <div className="mt-4 inline-flex items-center gap-2 bg-[#171720] border border-[#2d2d3c] px-4 py-2 rounded-xl text-xs sm:text-sm text-[var(--ts-red)] font-semibold shadow-md">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Te llamará uno de nuestros ingenieros en menos de 24 horas hábiles.</span>
          </div>
        </div>

        {/* Card del Formulario */}
        <div className="bg-[#121217] border border-[#242430] rounded-3xl p-6 sm:p-10 shadow-2xl">
          
          {enviado ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-950/40 border border-green-800/40 text-green-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                ¡Solicitud Registrada con Éxito!
              </h3>
              <p className="text-sm text-[#a5a5b2] max-w-md mx-auto leading-relaxed">
                Uno de nuestros ingenieros se pondrá en contacto contigo en tu WhatsApp/teléfono ({telefono}) en menos de 24 horas hábiles.
              </p>
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="mt-4 text-xs text-[var(--ts-red)] underline hover:text-red-400 font-semibold"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo 1: Nombre de contacto * */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  1. Nombre de contacto <span className="text-[var(--ts-red)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#181822] border border-[#2c2c3a] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#60606e] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[var(--ts-red)] transition-all"
                />
              </div>

              {/* Campo 2: Teléfono / WhatsApp * */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  2. Teléfono / WhatsApp <span className="text-[var(--ts-red)]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0412-1234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#181822] border border-[#2c2c3a] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#60606e] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[var(--ts-red)] transition-all"
                />
              </div>

              {/* Campo 3: Tipo (Cliente Final / Técnico-Instalador) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  3. Tipo de Solicitante <span className="text-[var(--ts-red)]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipo("Cliente Final")}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      tipo === "Cliente Final"
                        ? "bg-[var(--ts-red)]/15 border-[var(--ts-red)] text-white shadow-md shadow-red-950/30"
                        : "bg-[#181822] border-[#2c2c3a] text-[#8e8e98] hover:text-white"
                    }`}
                  >
                    <span>Cliente Final</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo("Técnico-Instalador")}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      tipo === "Técnico-Instalador"
                        ? "bg-[var(--ts-red)]/15 border-[var(--ts-red)] text-white shadow-md shadow-red-950/30"
                        : "bg-[#181822] border-[#2c2c3a] text-[#8e8e98] hover:text-white"
                    }`}
                  >
                    <span>Técnico / Instalador</span>
                  </button>
                </div>
              </div>

              {/* Campo 4: ¿Qué necesitas? */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  4. ¿Qué necesitas? <span className="text-[var(--ts-red)]">*</span>
                </label>
                <select
                  value={necesidad}
                  onChange={(e) => setNecesidad(e.target.value)}
                  className="w-full bg-[#181822] border border-[#2c2c3a] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[var(--ts-red)] transition-all cursor-pointer"
                >
                  <option value="Cámaras y seguridad">Cámaras y seguridad (videovigilancia CCTV/IP)</option>
                  <option value="Starlink">Starlink (instalación, configuración o pago)</option>
                  <option value="Domótica y redes">Domótica y redes (control de acceso / cableado)</option>
                  <option value="Automatización">Automatización y soluciones tecnológicas para empresas</option>
                  <option value="Soporte premium">Soporte premium ($5/mes)</option>
                  <option value="Otro">Otro requerimiento tecnológico</option>
                </select>
              </div>

              {/* Campo 5: Zona / ciudad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  5. Zona / Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tinaquillo, Valencia, Caracas, etc."
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  className="w-full bg-[#181822] border border-[#2c2c3a] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#60606e] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[var(--ts-red)] transition-all"
                />
              </div>

              {/* Campo 6: Cuéntanos tu problema en una frase (opcional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9999a5] mb-2">
                  6. Cuéntanos tu problema en una frase <span className="text-[#656572] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Sufrí un intento de robo y quiero instalar cámaras en los 4 accesos de mi local."
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  className="w-full bg-[#181822] border border-[#2c2c3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#60606e] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[var(--ts-red)] transition-all resize-none"
                />
              </div>

              {/* Aclaratoria obligatoria: llamada gratis vs visita técnica paga */}
              <div className="bg-[#181824] border border-[#2e2e3e] rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--ts-red)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#a0a0b0] leading-relaxed">
                  <strong>Aclaratoria sobre cotizaciones:</strong> La llamada telefónica de asesoría y el diagnóstico inicial con el ingeniero es <strong>100% gratuita</strong>. Si la evaluación requiere una inspección presencial en tu local o propiedad para levantar el proyecto en sitio, <strong>esa visita técnica es paga</strong>.
                </p>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={guardando}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] disabled:opacity-70 text-white font-bold text-base py-4 px-6 rounded-xl shadow-xl shadow-red-950/50 transition-all hover:scale-[1.01]"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registrando solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>Solicitar mi asesoría gratuita</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </section>
  );
}
