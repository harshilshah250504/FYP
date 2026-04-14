import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const next = searchParams?.next;
  const nextPath =
    typeof next === "string" && next.startsWith("/") ? next : "/";

  return (
    <Suspense fallback={null}>
      <LoginClient nextPath={nextPath} />
    </Suspense>
  );
}

