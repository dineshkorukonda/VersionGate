with open('dashboard/src/pages/Overview.tsx', 'r') as f:
    c = f.read()

bad_div = """      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricBar label="Projects" value={String(stats.total)} percent={Math.min(100, stats.total * 10)} />
        <MetricBar label="Active" value={String(stats.running)} percent={stats.total ? (stats.running / stats.total) * 100 : 0} />
        <MetricBar label="Deploying" value={String(stats.deploying)} percent={stats.total ? (stats.deploying / stats.total) * 100 : 0} warn={stats.deploying > 0} />
        <MetricBar label="Failed" value={String(stats.failed)} percent={stats.total ? (stats.failed / stats.total) * 100 : 0} warn={stats.failed > 0} />
      </div>"""

good_div = """<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.running}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deploys Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>"""

c = c.replace(bad_div, good_div)
with open('dashboard/src/pages/Overview.tsx', 'w') as f:
    f.write(c)

with open('dashboard/src/components/Layout.tsx', 'r') as f:
    c2 = f.read()
# remove unused serverOk
c2 = c2.replace('const [serverOk, setServerOk] = useState(true);', '')
c2 = c2.replace('if (!cancelled) setServerOk(s.status === "ok" || s.status === "unavailable");', '')
c2 = c2.replace('if (!cancelled) setServerOk(false);', '')
with open('dashboard/src/components/Layout.tsx', 'w') as f:
    f.write(c2)

with open('dashboard/src/pages/Projects.tsx', 'r') as f:
    c3 = f.read()
# remove unused PageHeader
c3 = c3.replace('import { PageHeader } from "@/components/PageHeader";\n', '')
# remove unused latestJobByProject
c3 = c3.replace('const [latestJobByProject, setLatestJobByProject] = useState<Map<string, string>>(new Map());', '')
c3 = c3.replace('setLatestJobByProject(m);', '')
with open('dashboard/src/pages/Projects.tsx', 'w') as f:
    f.write(c3)

