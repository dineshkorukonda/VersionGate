import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VercelCardBox } from "@/components/ui/VercelCardBox";

export function ProjectDetailDatabasesTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Managed Databases"
        description="Databases attached or provisioned for this project."
        footerLeft={<span>Create and attach PostgreSQL, MySQL, Redis, or SQLite instances.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={() => navigate("/databases")}
          >
            Manage Databases
          </Button>
        }
      >
        <p className="text-xs text-neutral-400">
          VersionGate automatically injects standard{" "}
          <code className="font-mono text-neutral-200">DATABASE_URL</code> and{" "}
          <code className="font-mono text-neutral-200">REDIS_URL</code> environment variables when databases are linked.
        </p>
      </VercelCardBox>
    </div>
  );
}
