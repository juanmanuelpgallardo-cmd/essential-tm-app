"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ loggedIn: boolean | null; email: string | null }>({ loggedIn: null, email: null });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      setUser({ loggedIn: !!data.user, email: data.user?.email ?? null })
    )
  }, [])

  const puedeVerEstadisticas =
    user.loggedIn &&
    (user.email === 'teresa.masajes@essentialtm.com' || user.email === 'miky.masajes@essentialtm.com')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#E8E4D9] flex flex-col items-center justify-center px-4 relative">
      {user.loggedIn && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 px-4 py-2 rounded-xl text-sm text-white bg-[#5C6B73] hover:bg-[#4A5A63] shadow-sm transition"
        >
          Cerrar sesión
        </button>
      )}
      <div className="max-w-md w-full space-y-8 text-center">

        {/* Logo / Título */}
        <div>
          <h1 className="text-4xl font-bold text-[#3A5A40] tracking-tight">Essential TM</h1>
          <p className="text-[#8A9A8A] mt-2 text-sm">Gestión de masajes y fisioterapia</p>
        </div>

        {user.loggedIn === null ? (
          <p className="text-[#8A9A8A] text-sm">Cargando...</p>
        ) : user.loggedIn ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
            <p className="text-sm text-[#5A6B5A]">Bienvenido, selecciona una opción</p>

            <Button
              onClick={() => router.push("/clientes")}
              className="w-full bg-[#C99470] hover:bg-[#B88363] text-white border-0 py-3 text-sm font-medium"
            >
              Ir a clientes
            </Button>

            {puedeVerEstadisticas && (
              <>
                <Link
                  href="/admin/ingresos"
                  className="flex items-center justify-center gap-2 w-full bg-[#C99470] hover:bg-[#B88363] text-white rounded-xl py-3 text-sm font-medium transition"
                >
                  📊 Ver Estadísticas de Pago
                </Link>
                <Link
                  href="/admin/ventas"
                  className="flex items-center justify-center gap-2 w-full bg-[#111827] hover:bg-[#2A2F38] text-white rounded-xl py-3 text-sm font-medium transition"
                >
                  📦 Control de Ventas Prozis
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-[#C99470] hover:bg-[#B88363] text-white border-0 py-3 text-sm font-medium"
            >
              Acceder al sistema
            </Button>
          </div>
        )}

        <p className="text-[#B5C4B5] text-xs">
          &copy; {new Date().getFullYear()} Essential TM
        </p>
      </div>
    </div>
  );
}
