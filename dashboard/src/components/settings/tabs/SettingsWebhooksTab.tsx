import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { settingsInputClass } from "@/components/settings/settings-styles";
import { toast } from "sonner";

export function SettingsWebhooksTab() {
  const [webhookProjectsScope, setWebhookProjectsScope] = useState<"all" | "specific">("all");
  const [webhookEvents, setWebhookEvents] = useState({
    deployments: true,
    rollbacks: true,
    domains: false,
    updates: false,
  });
  const [webhookEndpoint, setWebhookEndpoint] = useState("");

  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Add Webhook"
        description="Webhooks deliver HTTP POST payloads to your endpoint when deployment and engine events occur."
        footerLeft={
          <a
            href="https://github.com/dineshkorukonda/VersionGate"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Learn more about Webhooks ↗
          </a>
        }
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={() => {
              if (!webhookEndpoint.trim()) {
                toast.error("Please enter a webhook endpoint URL.");
                return;
              }
              toast.success("Webhook endpoint registered successfully");
              setWebhookEndpoint("");
            }}
          >
            Create Webhook
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-white">Projects</label>
            <div className="mt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="webhook-scope"
                  checked={webhookProjectsScope === "all"}
                  onChange={() => setWebhookProjectsScope("all")}
                  className="accent-white"
                />
                <span>All Projects</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="webhook-scope"
                  checked={webhookProjectsScope === "specific"}
                  onChange={() => setWebhookProjectsScope("specific")}
                  className="accent-white"
                />
                <span>Specific Projects</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white">Events</label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.deployments}
                  onChange={(e) => setWebhookEvents((ev) => ({ ...ev, deployments: e.target.checked }))}
                  className="accent-white rounded"
                />
                <span>Deployments</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.rollbacks}
                  onChange={(e) => setWebhookEvents((ev) => ({ ...ev, rollbacks: e.target.checked }))}
                  className="accent-white rounded"
                />
                <span>Rollbacks</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.domains}
                  onChange={(e) => setWebhookEvents((ev) => ({ ...ev, domains: e.target.checked }))}
                  className="accent-white rounded"
                />
                <span>Domains</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEvents.updates}
                  onChange={(e) => setWebhookEvents((ev) => ({ ...ev, updates: e.target.checked }))}
                  className="accent-white rounded"
                />
                <span>Engine Updates</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Endpoint URL</label>
            <Input
              value={webhookEndpoint}
              onChange={(e) => setWebhookEndpoint(e.target.value)}
              placeholder="https://api.example.com/webhooks/versiongate"
              className={settingsInputClass}
            />
          </div>
        </div>
      </VercelCardBox>
    </div>
  );
}
