import { useEffect, useState } from "react";
import {
  createApiToken,
  getApiTokens,
  revokeApiToken,
  type ApiTokenItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { toast } from "sonner";
import { settingsInputClass } from "./settings-styles";

export function ApiTokensCard() {
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  const loadTokens = async () => {
    try {
      const res = await getApiTokens();
      setTokens(res.tokens);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTokens();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await createApiToken(name.trim());
      setNewRawToken(res.token.token);
      setName("");
      toast.success("API token created. Copy it now, it will not be shown again.");
      void loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create API token");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiToken(id);
      toast.success("Token revoked");
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke token");
    }
  };

  return (
    <VercelCardBox
      title="API Access Tokens"
      description="Personal and CI/CD access tokens for interacting with the VersionGate engine API."
      footerLeft={<span>Tokens inherit your administrator role. Revoke immediately if compromised.</span>}
    >
      <div className="space-y-4">
        {newRawToken ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs">
            <p className="font-semibold text-emerald-400">New Token Created</p>
            <p className="mt-1 text-neutral-300">
              Copy this token now. You will not be able to see it again.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-black px-2.5 py-1.5 font-mono text-emerald-300 select-all">
                {newRawToken}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  void navigator.clipboard.writeText(newRawToken);
                  toast.success("Token copied to clipboard");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleCreate} className="flex gap-2 max-w-md">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. GitHub Actions, CLI)"
            className={settingsInputClass}
          />
          <Button
            type="submit"
            size="sm"
            disabled={creating || !name.trim()}
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0"
          >
            {creating ? "Creating..." : "Create Token"}
          </Button>
        </form>

        <div className="pt-2">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : tokens.length === 0 ? (
            <p className="text-xs text-neutral-500">No active API tokens found.</p>
          ) : (
            <div className="divide-y divide-neutral-800/60 rounded-lg border border-neutral-800 bg-black/40">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="font-mono text-[11px] text-neutral-500">
                      Created {new Date(t.createdAt).toLocaleDateString()} · Last used{" "}
                      {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/20 text-xs h-7"
                    onClick={() => void handleRevoke(t.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </VercelCardBox>
  );
}
