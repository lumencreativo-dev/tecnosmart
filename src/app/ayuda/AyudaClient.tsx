"use client";

import { useRouter } from "next/navigation";
import FormularioSoporteModal from "@/components/landing/FormularioSoporteModal";

export default function AyudaClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-4">
      {/* El modal se muestra abierto en esta ruta pública dedicada */}
      <FormularioSoporteModal
        isOpen={true}
        onClose={() => {
          router.push("/");
        }}
      />
    </div>
  );
}
