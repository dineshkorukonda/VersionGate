import { useState, type ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatEnvText, handleEnvPaste, parseEnvText } from "@/lib/env-parser";
import type { ManagedDatabase } from "@/lib/api";

export interface EnvPair {
  key: string;
  value: string;
}

interface EnvVariablesEditorProps {
  pairs: EnvPair[];
  onChange: (pairs: EnvPair[]) => void;
  managedDbs?: ManagedDatabase[];
  selectedDbId?: string;
  onAttachDatabase?: (dbId: string) => void;
  maxHeightClass?: string;
  title?: string;
  description?: string;
}

export function EnvVariablesEditor({
  pairs,
  onChange,
  managedDbs,
  selectedDbId = "",
  onAttachDatabase,
  maxHeightClass = "max-h-56",
  title = "Environment Variables",
  description = "Encrypted at rest with AES-256-GCM.",
}: EnvVariablesEditorProps) {
  const [mode, setMode] = useState<"form" | "raw">("form");
  const [rawText, setRawText] = useState("");
  const [maskSecrets, setMaskSecrets] = useState(true);

  const handleSwitchToRaw = () => {
    setRawText(formatEnvText(pairs));
    setMode("raw");
  };

  const handleSwitchToForm = () => {
    const parsed = parseEnvText(rawText);
    onChange(parsed.length > 0 ? parsed : [{ key: "", value: "" }]);
    setMode("form");
  };

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    const parsed = parseEnvText(text);
    onChange(parsed);
  };

  const addPair = () => {
    onChange([...pairs, { key: "", value: "" }]);
  };

  const removePair = (idx: number) => {
    const next = pairs.filter((_, i) => i !== idx);
    onChange(next.length > 0 ? next : [{ key: "", value: "" }]);
  };

  const updatePair = (idx: number, field: "key" | "value", val: string) => {
    const next = pairs.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    onChange(next);
  };

  const copyDotEnv = () => {
    const text = mode === "raw" ? rawText : formatEnvText(pairs);
    if (!text.trim()) {
      toast.error("No environment variables to copy");
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Environment configuration copied to clipboard"),
      () => toast.error("Failed to copy .env")
    );
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div>
          <span className="font-sans text-sm font-medium text-foreground">{title}</span>
          {description ? (
            <p className="font-sans text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mode Switch */}
          <div className="flex items-center border border-border bg-muted/20 p-0.5">
            <button
              type="button"
              onClick={mode === "raw" ? handleSwitchToForm : undefined}
              className={cn(
                "px-2 py-0.5 text-[10px] transition-colors",
                mode === "form"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Key-Value
            </button>
            <button
              type="button"
              onClick={mode === "form" ? handleSwitchToRaw : undefined}
              className={cn(
                "px-2 py-0.5 text-[10px] transition-colors",
                mode === "raw"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Raw .env
            </button>
          </div>

          {/* Mask Secrets Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-6 px-2 text-[10px]",
              maskSecrets ? "border-amber-500/40 text-amber-500 bg-amber-500/10" : "text-muted-foreground"
            )}
            onClick={() => setMaskSecrets(!maskSecrets)}
          >
            {maskSecrets ? "Masked" : "Revealed"}
          </Button>

          {/* Copy .env Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={copyDotEnv}
          >
            Copy .env
          </Button>

          {/* Attach Database Dropdown if supplied */}
          {managedDbs && managedDbs.length > 0 && onAttachDatabase ? (
            <select
              value={selectedDbId}
              onChange={(e) => {
                const id = e.target.value;
                if (id) onAttachDatabase(id);
              }}
              className="h-6 border border-border bg-background px-1.5 text-[10px] text-foreground focus:outline-none"
            >
              <option value="">+ Attach Managed DB...</option>
              {managedDbs.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name} ({db.engine.toUpperCase()} :{db.hostPort})
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {/* Editor Body */}
      {mode === "form" ? (
        <div className="space-y-2">
          <div className={cn("space-y-2 overflow-y-auto pr-1", maxHeightClass)}>
            {pairs.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="KEY"
                  value={p.key}
                  onChange={(e) => updatePair(idx, "key", e.target.value)}
                  onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                    const text = e.clipboardData.getData("text");
                    const updater = (fn: (prev: EnvPair[]) => EnvPair[]) => {
                      onChange(fn(pairs));
                    };
                    if (handleEnvPaste(text, idx, updater as any)) {
                      e.preventDefault();
                    }
                  }}
                  className="font-mono text-xs uppercase"
                />
                <Input
                  type={maskSecrets ? "password" : "text"}
                  placeholder="VALUE"
                  value={p.value}
                  onChange={(e) => updatePair(idx, "value", e.target.value)}
                  onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                    const text = e.clipboardData.getData("text");
                    const updater = (fn: (prev: EnvPair[]) => EnvPair[]) => {
                      onChange(fn(pairs));
                    };
                    if (handleEnvPaste(text, idx, updater as any, "value")) {
                      e.preventDefault();
                    }
                  }}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePair(idx)}
                  className="h-8 w-8 p-0 font-mono text-xs text-muted-foreground hover:text-rose-500"
                >
                  [x]
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addPair} className="w-full text-xs">
            + Add Variable
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
            placeholder={`# Paste or edit .env directly\nNODE_ENV=production\nDATABASE_URL=postgresql://user:pass@host:5432/db\nAPI_KEY=secret_key`}
            rows={8}
            spellCheck={false}
            className={cn(
              "w-full resize-y rounded-md border border-input bg-muted/20 p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring",
              maxHeightClass
            )}
          />
          <p className="text-[11px] text-muted-foreground">
            Lines with <span className="font-semibold">#</span> are treated as comments. Double/single quotes and <span className="font-semibold">export KEY=VAL</span> prefixes are parsed automatically.
          </p>
        </div>
      )}
    </div>
  );
}
