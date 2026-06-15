import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { callbackUrl = "/", error } = await searchParams;

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
        fontFamily:
          "var(--font-geist-sans, system-ui), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          padding: "3rem",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          maxWidth: "28rem",
          width: "90%",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", fontWeight: 600 }}>
          SAP Assistant
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Buyer/Planner Action Workbench — sign in to continue.
        </p>

        {error && (
          <div
            style={{
              background: "rgba(220, 38, 38, 0.15)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              color: "#fca5a5",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            Sign-in failed: {error}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.875rem 1.5rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
              <rect width="10" height="10" x="1" y="1" fill="#f25022" />
              <rect width="10" height="10" x="12" y="1" fill="#7fba00" />
              <rect width="10" height="10" x="1" y="12" fill="#00a4ef" />
              <rect width="10" height="10" x="12" y="12" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </main>
  );
}
