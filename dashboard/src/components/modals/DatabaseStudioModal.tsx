import { useEffect, useMemo, useState } from "react";
import {
  executeDatabaseQuery,
  getDatabaseSchema,
  type DatabaseQueryResult,
  type DatabaseSchemaResult,
  type ManagedDatabase,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DatabaseStudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: ManagedDatabase | null;
}

export function DatabaseStudioModal({
  open,
  onOpenChange,
  database,
}: DatabaseStudioModalProps) {
  const [schema, setSchema] = useState<DatabaseSchemaResult | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");

  const defaultQueryForEngine = (engine?: string, tableName?: string) => {
    if (!tableName) {
      if (engine === "postgres") return "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 20;";
      if (engine === "mysql") return "SHOW TABLES;";
      if (engine === "redis") return "KEYS *";
      if (engine === "mongodb") return "db.getCollectionNames()";
      return "";
    }
    if (engine === "postgres") return `SELECT * FROM "${tableName}" LIMIT 50;`;
    if (engine === "mysql") return `SELECT * FROM \`${tableName}\` LIMIT 50;`;
    if (engine === "redis") return `TYPE ${tableName}`;
    if (engine === "mongodb") return `db.${tableName}.find().limit(50)`;
    return "";
  };

  const loadSchema = async () => {
    if (!database) return;
    setLoadingSchema(true);
    try {
      const res = await getDatabaseSchema(database.id);
      setSchema(res.schema);
      if (res.schema.tables.length > 0 && !selectedTable) {
        const first = res.schema.tables[0].name;
        setSelectedTable(first);
        setQuery(defaultQueryForEngine(database.engine, first));
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to load database schema");
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (open && database) {
      setResult(null);
      setQueryError(null);
      setSelectedTable(null);
      setQuery(defaultQueryForEngine(database.engine));
      void loadSchema();
    }
  }, [open, database?.id]);

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    const q = defaultQueryForEngine(database?.engine, tblName);
    setQuery(q);
    void runQuery(q);
  };

  const runQuery = async (customQuery?: string) => {
    if (!database) return;
    const targetQuery = customQuery ?? query;
    if (!targetQuery.trim()) {
      toast.error("Please enter a query to execute");
      return;
    }

    setExecuting(true);
    setQueryError(null);
    try {
      const res = await executeDatabaseQuery(database.id, targetQuery);
      setResult(res);
      toast.success(`Query completed in ${res.executionTimeMs}ms (${res.rowCount} rows)`);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Query failed";
      setQueryError(msg);
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  };

  const filteredTables = useMemo(() => {
    if (!schema) return [];
    const q = tableSearch.trim().toLowerCase();
    if (!q) return schema.tables;
    return schema.tables.filter((t) => t.name.toLowerCase().includes(q));
  }, [schema, tableSearch]);

  const copyResults = (format: "json" | "csv") => {
    if (!result) return;
    if (format === "json") {
      const formatted = result.rows.map((row) => {
        const obj: Record<string, string> = {};
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      void navigator.clipboard.writeText(JSON.stringify(formatted, null, 2));
      toast.success("Copied Result data formatted as JSON");
    } else {
      const csv = [
        result.columns.join(","),
        ...result.rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      void navigator.clipboard.writeText(csv);
      toast.success("[ COPIED ] Result data formatted as CSV");
    }
  };

  if (!database) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-6xl overflow-hidden p-0 gap-0 border-border bg-card">
        {/* Header Strip */}
        <DialogHeader className="border-b border-border px-6 py-4 bg-muted/20 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <DialogTitle className="font-mono text-sm font-semibold text-foreground">
                {database.name}
              </DialogTitle>
              <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-primary">
                {database.engine}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                :{database.hostPort}
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Database Studio // Run SQL queries, inspect tables, and analyze live database records.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[75vh] overflow-hidden">
          {/* Left: Schema Explorer */}
          <div className="border-r border-border bg-background/60 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                Schema Tables ({filteredTables.length})
              </span>
              <button
                type="button"
                onClick={() => void loadSchema()}
                disabled={loadingSchema}
                className="font-mono text-[10px] text-primary hover:underline cursor-pointer"
              >
                {loadingSchema ? "Scanning…" : "Refresh"}
              </button>
            </div>

            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter tables..."
              className="h-8 font-mono text-xs w-full"
            />

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {loadingSchema ? (
                <div className="py-8 text-center font-mono text-xs text-muted-foreground">
                  Scanning schema metadata…
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-muted-foreground">
                  {schema?.tables.length === 0 ? "No tables created yet." : "No tables match search."}
                </div>
              ) : (
                filteredTables.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectTable(t.name)}
                    className={cn(
                      "w-full rounded px-2.5 py-1.5 text-left font-mono text-xs transition-colors truncate flex items-center justify-between cursor-pointer",
                      selectedTable === t.name
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] opacity-60 uppercase">{t.type || "tbl"}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Query Editor & Data Grid */}
          <div className="flex flex-col overflow-hidden bg-black">
            {/* Query Input Strip */}
            <div className="p-4 border-b border-border space-y-3 bg-muted/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Query Console
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    (Ctrl + Enter to execute)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono"
                    onClick={() => setQuery(defaultQueryForEngine(database.engine, selectedTable || undefined))}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={executing}
                    className="h-7 text-xs font-mono font-semibold"
                    onClick={() => void runQuery()}
                  >
                    {executing ? "Running…" : "Execute Query"}
                  </Button>
                </div>
              </div>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void runQuery();
                  }
                }}
                rows={3}
                placeholder="Enter SQL command or query..."
                className="w-full rounded-md border border-neutral-800 bg-[#0a0a0a] p-2.5 font-mono text-xs text-white outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            {/* Telemetry Strip */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/5 text-xs font-mono">
              <div className="flex items-center gap-4 text-muted-foreground">
                {result ? (
                  <>
                    <span>Execution: <strong className="text-foreground">{result.executionTimeMs}ms</strong></span>
                    <span>Rows: <strong className="text-foreground">{result.rowCount}</strong></span>
                  </>
                ) : (
                  <span>Ready to run queries against {database.engine}</span>
                )}
              </div>

              {result && result.rowCount > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded border border-border bg-muted/20 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] transition-colors rounded",
                        viewMode === "table" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                      )}
                    >
                      Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("raw")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] transition-colors rounded",
                        viewMode === "raw" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                      )}
                    >
                      Raw
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyResults("json")}
                    className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => copyResults("csv")}
                    className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Copy CSV
                  </button>
                </div>
              ) : null}
            </div>

            {/* Results Grid Viewport */}
            <div className="flex-1 overflow-auto p-4">
              {queryError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 font-mono text-xs text-red-300">
                  <p className="font-semibold text-red-200">Query Execution Failed</p>
                  <p className="mt-1 whitespace-pre-wrap">{queryError}</p>
                </div>
              ) : executing ? (
                <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                  Executing query on container…
                </div>
              ) : !result ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center font-mono text-xs text-muted-foreground">
                  <p>Execute a query or pick a table on the left to browse data.</p>
                </div>
              ) : viewMode === "raw" ? (
                <pre className="rounded bg-neutral-950 p-3 font-mono text-xs text-neutral-300 whitespace-pre-wrap overflow-auto">
                  {result.rawOutput || JSON.stringify(result.rows, null, 2)}
                </pre>
              ) : result.columns.length === 0 || result.rows.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-muted-foreground">
                  {result.rawOutput ? (
                    <pre className="text-left bg-neutral-950 p-3 rounded">{result.rawOutput}</pre>
                  ) : (
                    "Query executed successfully with 0 rows returned."
                  )}
                </div>
              ) : (
                <div className="rounded border border-border overflow-hidden">
                  <table className="w-full border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left">
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 font-semibold text-foreground border-r border-border last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors last:border-b-0"
                        >
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-3 py-1.5 border-r border-border/50 last:border-r-0 text-muted-foreground max-w-xs truncate"
                              title={String(cell)}
                            >
                              {cell === null || cell === undefined ? (
                                <span className="text-neutral-600 italic">null</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
