"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/cotizador");
        router.refresh();
      } else {
        setError("Usuario o contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--ts-red-subtle)] rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--ts-red)]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-blanco.png"
            alt="TecnoSmart VZL"
            width={200}
            height={60}
            className="mx-auto h-12 w-auto object-contain mb-4"
          />
          <div className="flex items-center justify-center gap-2 text-[var(--ts-text-muted)]">
            <Shield className="w-4 h-4 text-[var(--ts-red)]" />
            <span className="text-xs font-medium uppercase tracking-widest">Portal Interno</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[var(--ts-surface)]/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-[var(--ts-text-primary)] text-lg font-bold mb-6 text-center">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--ts-surface)]/5 border border-white/10 rounded-xl text-[var(--ts-text-primary)] text-sm placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[#c9242b]/30 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-[var(--ts-surface)]/5 border border-white/10 rounded-xl text-[var(--ts-text-primary)] text-sm placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)] focus:ring-1 focus:ring-[#c9242b]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[var(--ts-red-subtle)] border border-[var(--ts-red)]/30 text-[var(--ts-red)] text-xs font-medium px-4 py-2.5 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-[var(--ts-text-primary)] font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </div>
              ) : (
                "Acceder al Sistema"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--ts-text-muted)] text-[10px] mt-6">
          TECNO SMART VZL C.A · RIF: J-50701960-8
        </p>
      </div>
    </div>
  );
}
