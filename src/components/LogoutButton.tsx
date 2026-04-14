"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm hover:opacity-90 transition-opacity"
    >
      Log out
    </button>
  );
}

