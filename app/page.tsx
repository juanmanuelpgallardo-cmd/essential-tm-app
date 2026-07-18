"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(!!data.user))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Essential TM</h1>
      {user ? (
        <Button onClick={() => router.push("/clientes")}>
          Ir a clientes
        </Button>
      ) : (
        <Button onClick={() => router.push("/login")}>
          Acceder al sistema
        </Button>
      )}
    </main>
  );
}
