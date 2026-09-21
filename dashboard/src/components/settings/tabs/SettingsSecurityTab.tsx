import { ApiTokensCard } from "@/components/settings/ApiTokensCard";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";

export function SettingsSecurityTab() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <ApiTokensCard />
    </div>
  );
}
