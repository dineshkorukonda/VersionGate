import { useState } from "react";
import { changePassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { toast } from "sonner";
import { settingsInputClass } from "./settings-styles";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      toast.error("New password must be at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setUpdating(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      toast.success(res.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <VercelCardBox
      title="Administrator Password"
      description="Update your dashboard authentication password. Passwords must be at least 10 characters."
      footerLeft={
        <span>Use a secure password with a mix of characters to safeguard control plane access.</span>
      }
      footerAction={
        <Button
          type="submit"
          form="change-password-form"
          size="sm"
          disabled={updating || !newPassword}
          className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0"
        >
          {updating ? "Updating..." : "Save Password"}
        </Button>
      }
    >
      <form id="change-password-form" onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300" htmlFor="current-pass">
            Current Password
          </label>
          <Input
            id="current-pass"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
            className={settingsInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300" htmlFor="new-pass">
            New Password
          </label>
          <Input
            id="new-pass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 10 characters"
            required
            minLength={10}
            autoComplete="new-password"
            className={settingsInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300" htmlFor="confirm-pass">
            Confirm New Password
          </label>
          <Input
            id="confirm-pass"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            minLength={10}
            autoComplete="new-password"
            className={settingsInputClass}
          />
        </div>
      </form>
    </VercelCardBox>
  );
}
