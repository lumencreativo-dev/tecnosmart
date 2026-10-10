"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  Plus, Search, RefreshCw, Calendar, CheckCircle, 
  AlertTriangle, CreditCard, Lock, User, MoreVertical, X
} from "lucide-react";
import ClientePicker from "./ClientePicker";

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oeydtomyjwxwpvjrrebx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_pJvbkDKqbNRpqVs2J7FR5g_3N8LZi-X";
const supabase = createClient(supabaseUrl, supabaseKey);

type ServicioRecurrente = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_sugerido: number;
  mensaje_whatsapp?: string;
};

type Suscripcion = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  estado: string;
  ciclo_facturacion: string;
  monto: number;
  proximo_pago: string;
  credenciales_usuario?: string;
  credenciales_clave?: string;
  credenciales_notas?: string;
  clientes?: { id?: string; contacto: string; empresa?: string; telefono?: string; rif_cedula?: string };
  servicios_recurrentes?: { nombre: string; mensaje_whatsapp?: string };
};

export default function SuscripcionesManager() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [servicios, setServicios] = useState<ServicioRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activas" | "pendientes" | "catalogo">("activas");
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<"suscripcion" | "servicio">("suscripcion");
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [formData, setFormData] = useState({
    servicio_id: "",
    estado: "Activo",
    ciclo_facturacion: "Mensual",
    monto: "",
    proximo_pago: new Date().toISOString().split('T')[0],
    credenciales_usuario: "",
    credenciales_clave: "",
    credenciales_notas: ""
  });
  
  const [servicioData, setServicioData] = useState({
    nombre: "", descripcion: "", precio_sugerido: "", mensaje_whatsapp: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar servicios
      const { data: sData, error: sErr } = await supabase
        .from("servicios_recurrentes")
        .select("*")
        .order("nombre");
      
      if (!sErr && sData) setServicios(sData);

      // 2. Cargar suscripciones
      const { data: subData, error: subErr } = await supabase
        .from("suscripciones")
        .select(`
          *,
          clientes(empresa, contacto, telefono, rif_cedula),
          servicios_recurrentes(nombre, mensaje_whatsapp)
        `)
        .order("proximo_pago");

      if (subErr) console.error("Error cargando suscripciones:", subErr.message);
      if (!subErr && subData) setSuscripciones(subData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServicio = async () => {
    try {
      const payload = {
        nombre: servicioData.nombre,
        descripcion: servicioData.descripcion,
        precio_sugerido: Number(servicioData.precio_sugerido),
        mensaje_whatsapp: servicioData.mensaje_whatsapp
      };

      if (editId) {
        const { error } = await supabase.from("servicios_recurrentes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("servicios_recurrentes").insert([payload]);
        if (error) throw error;
      }
      
      fetchData();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert("Error al guardar servicio");
    }
  };

  const handleSaveSuscripcion = async () => {
    if (!selectedCliente || !formData.servicio_id) return alert("Cliente y Servicio son requeridos");
    try {
      const payload = {
        cliente_id: selectedCliente.id,
        servicio_id: formData.servicio_id,
        estado: formData.estado,
        ciclo_facturacion: formData.ciclo_facturacion,
        monto: Number(formData.monto),
        proximo_pago: formData.proximo_pago,
        credenciales_usuario: formData.credenciales_usuario,
        credenciales_clave: formData.credenciales_clave,
        credenciales_notas: formData.credenciales_notas
      };

      if (editId) {
        const { error } = await supabase.from("suscripciones").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suscripciones").insert([payload]);
        if (error) throw error;
      }
      
      fetchData();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert("Error al guardar suscripción");
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'text-emerald-500 bg-emerald-500/10';
      case 'Suspendido': return 'text-amber-500 bg-amber-500/10';
      case 'Cancelado': return 'text-[var(--ts-red)] bg-[var(--ts-red)]/10';
      default: return 'text-[var(--ts-text-muted)] bg-[var(--ts-border)]';
    }
  };

  const isDue = (dateString: string) => {
    return new Date(dateString) <= new Date();
  };

  const openNewSuscripcion = () => {
    setEditId(null);
    setSelectedCliente(null);
    setFormData({
      servicio_id: "", estado: "Activo", ciclo_facturacion: "Mensual", monto: "",
      proximo_pago: new Date().toISOString().split('T')[0],
      credenciales_usuario: "", credenciales_clave: "", credenciales_notas: ""
    });
    setFormType("suscripcion");
    setShowModal(true);
  };

  const openEditSuscripcion = (s: Suscripcion) => {
    setEditId(s.id);
    setSelectedCliente(s.clientes ? { id: s.cliente_id, ...s.clientes } : null);
    setFormData({
      servicio_id: s.servicio_id, estado: s.estado, ciclo_facturacion: s.ciclo_facturacion, monto: s.monto.toString(),
      proximo_pago: s.proximo_pago,
      credenciales_usuario: s.credenciales_usuario || "", credenciales_clave: s.credenciales_clave || "", credenciales_notas: s.credenciales_notas || ""
    });
    setFormType("suscripcion");
    setShowModal(true);
  };

  const openEditServicio = (s: ServicioRecurrente) => {
    setEditId(s.id);
    setServicioData({
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      precio_sugerido: s.precio_sugerido.toString(),
      mensaje_whatsapp: s.mensaje_whatsapp || ""
    });
    setFormType("servicio");
    setShowModal(true);
  };

  const [showRenovarModal, setShowRenovarModal] = useState(false);
  const [renovarData, setRenovarData] = useState({
    suscripcion_id: "", proximo_pago: "", referencia: "", notas: "", monto: 0
  });

  const openRenovarModal = (s: Suscripcion) => {
    const actual = new Date(s.proximo_pago);
    let nextDate = new Date(s.proximo_pago);
    switch (s.ciclo_facturacion) {
      case 'Mensual': nextDate.setMonth(actual.getMonth() + 1); break;
      case 'Bimestral': nextDate.setMonth(actual.getMonth() + 2); break;
      case 'Trimestral': nextDate.setMonth(actual.getMonth() + 3); break;
      case 'Semestral': nextDate.setMonth(actual.getMonth() + 6); break;
      case 'Anual': nextDate.setFullYear(actual.getFullYear() + 1); break;
      default: nextDate.setMonth(actual.getMonth() + 1);
    }

    setRenovarData({
      suscripcion_id: s.id,
      proximo_pago: nextDate.toISOString().split('T')[0],
      referencia: "",
      notas: "",
      monto: s.monto
    });
    setShowRenovarModal(true);
  };

  const handleConfirmarRenovacion = async () => {
    if (!renovarData.referencia) return alert("Por favor ingresa una referencia de pago.");
    try {
      await supabase.from("suscripciones_pagos").insert([{
        suscripcion_id: renovarData.suscripcion_id,
        monto: renovarData.monto,
        referencia: renovarData.referencia,
        notas: renovarData.notas
      }]);

      await supabase.from("suscripciones").update({ proximo_pago: renovarData.proximo_pago }).eq("id", renovarData.suscripcion_id);
      
      fetchData();
      setShowRenovarModal(false);
      alert("Suscripción renovada exitosamente. Se ha registrado el pago.");
    } catch (e: any) {
      console.error(e);
      alert("Error al renovar: " + e.message);
    }
  };

  const router = useRouter();

  const handleGenerarFactura = (s: Suscripcion) => {
    const cId = s.clientes?.id || s.cliente_id;
    const cNombre = s.clientes?.empresa || s.clientes?.contacto || "";
    const cRif = s.clientes?.rif_cedula || "";
    const cTelf = s.clientes?.telefono || "";
    const sNombre = `Renovación de ${s.servicios_recurrentes?.nombre || 'Servicio'} - Ciclo ${s.ciclo_facturacion}`;
    const sMonto = s.monto.toString();

    const params = new URLSearchParams({
      modo: "venta_directa",
      cliente_id: cId,
      cliente_nombre: cNombre,
      cliente_rif: cRif,
      cliente_telefono: cTelf,
      servicio: sNombre,
      monto: sMonto
    });

    router.push(`/cotizador/facturacion?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── HEADER TABS Y BOTONES ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setActiveTab("activas")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "activas" ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-secondary)]"}`}
          >
            Suscripciones Activas
          </button>
          <button 
            onClick={() => setActiveTab("pendientes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "pendientes" ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-secondary)]"}`}
          >
            Pendientes <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{suscripciones.filter(s => isDue(s.proximo_pago) && s.estado === 'Activo').length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("catalogo")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "catalogo" ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-secondary)]"}`}
          >
            Catálogo de Servicios
          </button>
        </div>

        <div className="flex gap-2">
          {activeTab === "catalogo" ? (
            <button onClick={() => { setFormType("servicio"); setShowModal(true); setEditId(null); }} className="flex items-center gap-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] text-xs font-bold px-4 py-2 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Nuevo Servicio
            </button>
          ) : (
            <button onClick={openNewSuscripcion} className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Nueva Suscripción
            </button>
          )}
        </div>
      </div>

      {/* ── LISTADO DE SUSCRIPCIONES ── */}
      {(activeTab === "activas" || activeTab === "pendientes") && (
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[var(--ts-text-muted)] text-sm">Cargando datos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">Cliente</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">Servicio</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">Estado</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">Próximo Pago</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">Monto</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ts-border)] text-sm">
                  {suscripciones
                    .filter(s => activeTab === "pendientes" ? (isDue(s.proximo_pago) && s.estado === 'Activo') : true)
                    .map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--ts-surface-2)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[var(--ts-text-primary)]">{s.clientes?.empresa || s.clientes?.contacto}</div>
                        {s.clientes?.empresa && s.clientes?.contacto && <div className="text-xs text-[var(--ts-text-muted)]">{s.clientes.contacto}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-[var(--ts-text-muted)]" /> {s.servicios_recurrentes?.nombre}</div>
                        <div className="text-[10px] text-[var(--ts-text-muted)] uppercase tracking-wide mt-0.5">{s.ciclo_facturacion}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${getStatusColor(s.estado)}`}>
                          {s.estado === 'Activo' && <CheckCircle className="w-3 h-3" />}
                          {s.estado === 'Suspendido' && <AlertTriangle className="w-3 h-3" />}
                          {s.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`font-medium flex items-center gap-1.5 ${isDue(s.proximo_pago) ? 'text-amber-500 font-bold' : 'text-[var(--ts-text-primary)]'}`}>
                          <Calendar className="w-4 h-4" /> {new Date(s.proximo_pago).toLocaleDateString()}
                        </div>
                        {isDue(s.proximo_pago) && <div className="text-[10px] text-amber-500 font-bold mt-0.5">Pago Vencido</div>}
                      </td>
                      <td className="px-5 py-4 font-black text-[var(--ts-text-primary)]">
                        ${s.monto.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleGenerarFactura(s)} className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors">
                            Facturar
                          </button>
                          {activeTab === "pendientes" && (
                            <button onClick={() => openRenovarModal(s)} className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] px-3 py-1.5 rounded-lg transition-colors">
                              Renovar
                            </button>
                          )}
                          <button onClick={() => openEditSuscripcion(s)} className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface-2)] px-3 py-1.5 rounded-lg transition-colors">
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {suscripciones.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[var(--ts-text-muted)]">
                        No hay suscripciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CATÁLOGO DE SERVICIOS ── */}
      {activeTab === "catalogo" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {servicios.map((s) => (
            <div key={s.id} className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 hover:border-[var(--ts-red)] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[var(--ts-text-primary)]">{s.nombre}</h3>
                <span className="text-xs font-black bg-[var(--ts-surface-2)] px-2 py-1 rounded-md text-[var(--ts-text-primary)]">${s.precio_sugerido.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[var(--ts-text-muted)] mb-4 h-10 line-clamp-2">{s.descripcion}</p>
              <div className="flex gap-2">
                <button onClick={() => openEditServicio(s)} className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface-2)] px-3 py-1.5 rounded-lg transition-colors flex-1 text-center">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALES ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--ts-border)] sticky top-0 bg-[var(--ts-surface)] z-10">
              <h2 className="text-lg font-bold text-[var(--ts-text-primary)]">
                {formType === "servicio" ? "Nuevo Servicio Recurrente" : "Nueva Suscripción"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors text-[var(--ts-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {formType === "servicio" ? (
                // Form Servicio
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Nombre del Servicio</label>
                    <input type="text" value={servicioData.nombre} onChange={e => setServicioData({...servicioData, nombre: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="Ej: Starlink Residencial" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Descripción</label>
                    <textarea value={servicioData.descripcion} onChange={e => setServicioData({...servicioData, descripcion: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors min-h-[100px]" placeholder="Detalles del servicio..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Precio Sugerido ($)</label>
                    <input type="number" value={servicioData.precio_sugerido} onChange={e => setServicioData({...servicioData, precio_sugerido: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="60.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Plantilla WhatsApp (Opcional)</label>
                    <textarea value={servicioData.mensaje_whatsapp} onChange={e => setServicioData({...servicioData, mensaje_whatsapp: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors min-h-[80px]" placeholder="Hola {cliente}, te recordamos tu pago de {monto} por el servicio de {servicio}." />
                    <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Variables: <span className="font-bold text-[var(--ts-text-primary)]">{'{cliente}'}</span>, <span className="font-bold text-[var(--ts-text-primary)]">{'{monto}'}</span>, <span className="font-bold text-[var(--ts-text-primary)]">{'{servicio}'}</span></p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button onClick={handleSaveServicio} className="bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">Guardar Servicio</button>
                  </div>
                </div>
              ) : (
                // Form Suscripción
                <div className="space-y-6">
                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Cliente Asignado</label>
                    {!selectedCliente ? (
                      <div className="border border-[var(--ts-border)] rounded-xl overflow-hidden bg-[var(--ts-surface-2)]">
                        <ClientePicker onSelect={(c) => setSelectedCliente(c)} clienteSeleccionado={selectedCliente} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-[var(--ts-border)] rounded-xl bg-[var(--ts-surface-2)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--ts-border)] flex items-center justify-center"><User className="w-4 h-4 text-[var(--ts-text-primary)]" /></div>
                          <div>
                            <p className="text-sm font-bold text-[var(--ts-text-primary)]">{selectedCliente.empresa || selectedCliente.contacto}</p>
                            <p className="text-[10px] text-[var(--ts-text-muted)]">{selectedCliente.rif_cedula || 'Sin RIF/Cédula'}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedCliente(null)} className="text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] font-bold px-2 py-1">Cambiar</button>
                      </div>
                    )}
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Estado</label>
                        <select 
                          value={formData.estado}
                          onChange={e => setFormData({...formData, estado: e.target.value})}
                          className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Suspendido">Suspendido</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Servicio</label>
                        <select 
                          value={formData.servicio_id}
                          onChange={e => {
                            const s = servicios.find(x => x.id === e.target.value);
                            setFormData({...formData, servicio_id: e.target.value, monto: s ? s.precio_sugerido.toString() : formData.monto});
                          }}
                          className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                        >
                          <option value="">Seleccione un servicio</option>
                          {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Ciclo</label>
                      <select 
                        value={formData.ciclo_facturacion}
                        onChange={e => setFormData({...formData, ciclo_facturacion: e.target.value})}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      >
                        <option value="Mensual">Mensual</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Monto a Facturar ($)</label>
                      <input type="number" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="60.00" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Próximo Pago</label>
                      <input type="date" value={formData.proximo_pago} onChange={e => setFormData({...formData, proximo_pago: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" />
                    </div>
                  </div>

                  {/* Bóveda */}
                  <div className="border border-[var(--ts-border)] rounded-xl p-4 bg-[var(--ts-surface-2)]/50">
                    <h3 className="text-sm font-bold text-[var(--ts-text-primary)] flex items-center gap-2 mb-4"><Lock className="w-4 h-4 text-amber-500" /> Bóveda de Credenciales (Opcional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">Usuario / Correo</label>
                        <input type="text" value={formData.credenciales_usuario} onChange={e => setFormData({...formData, credenciales_usuario: e.target.value})} className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="ej: juan@gmail.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">Contraseña</label>
                        <input type="text" value={formData.credenciales_clave} onChange={e => setFormData({...formData, credenciales_clave: e.target.value})} className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="••••••••" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">Notas / Seriales</label>
                        <input type="text" value={formData.credenciales_notas} onChange={e => setFormData({...formData, credenciales_notas: e.target.value})} className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="KIT S/N: XYZ-1234..." />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={handleSaveSuscripcion} className="bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                      {editId ? 'Guardar Cambios' : 'Crear Suscripción'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RENOVAR ── */}
      {showRenovarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--ts-border)] bg-[var(--ts-surface)]">
              <h2 className="text-lg font-bold text-[var(--ts-text-primary)]">Registrar Pago y Renovar</h2>
              <button onClick={() => setShowRenovarModal(false)} className="p-2 hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors text-[var(--ts-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Nueva Fecha de Próximo Pago</label>
                <input type="date" value={renovarData.proximo_pago} onChange={e => setRenovarData({...renovarData, proximo_pago: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Monto Pagado ($)</label>
                <input type="number" value={renovarData.monto} onChange={e => setRenovarData({...renovarData, monto: Number(e.target.value)})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Referencia de Pago</label>
                <input type="text" value={renovarData.referencia} onChange={e => setRenovarData({...renovarData, referencia: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="N° de Ref / Comprobante" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">Notas Adicionales</label>
                <input type="text" value={renovarData.notas} onChange={e => setRenovarData({...renovarData, notas: e.target.value})} className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors" placeholder="Banco, Zelle, etc." />
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={handleConfirmarRenovacion} className="w-full bg-[var(--ts-red)] hover:bg-red-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm">Confirmar Renovación</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
