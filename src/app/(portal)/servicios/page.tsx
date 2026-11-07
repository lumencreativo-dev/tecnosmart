import ServiciosManager from "@/components/cotizador/ServiciosManager";
import ProtectedView from "@/components/cotizador/ProtectedView";

export default function ServiciosPage() {
  return (
    <ProtectedView permiso="inventario.ver" modulo="Servicios & Mano de Obra">
      <div className="min-h-[calc(100vh-140px)] bg-[var(--ts-bg)]">
        <ServiciosManager />
      </div>
    </ProtectedView>
  );
}
