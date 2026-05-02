import { AuthView } from "@neondatabase/auth/react/ui";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-6">ScriptLoop</h1>
        <AuthView pathname="/sign-in" />
      </div>
    </div>
  );
}
