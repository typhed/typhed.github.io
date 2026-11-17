import { AuthGate } from "@/components/auth-gate";
import { Workspace } from "@/components/workspace";

export default function HomePage() {
  return (
    <AuthGate>
      <Workspace />
    </AuthGate>
  );
}
