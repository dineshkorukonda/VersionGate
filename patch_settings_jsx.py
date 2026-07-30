import re

with open('dashboard/src/pages/Settings.tsx', 'r') as f:
    c = f.read()

# Add Tabs imports
if 'Tabs, TabsContent, TabsList, TabsTrigger' not in c:
    c = c.replace('import { Button }', 'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\nimport { Button }')

c = c.replace('<div className="w-full max-w-4xl space-y-10">', '<div className="w-full max-w-4xl space-y-6">')

header_to_replace = """      <PageHeader
        title="System Settings"
        description="Instance configuration, self-update, and environment variables"
        mono
      />"""

new_header = """      <PageHeader
        title="Settings"
        description="Manage your instance configuration, network, and security settings."
      />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 h-10 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="general" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">General</TabsTrigger>
          <TabsTrigger value="network" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Network</TabsTrigger>
          <TabsTrigger value="security" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Security</TabsTrigger>
          <TabsTrigger value="updates" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Updates</TabsTrigger>
          <TabsTrigger value="advanced" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-6">"""

c = c.replace(header_to_replace, new_header)

# We close General tab before <Card id="application-updates" ...
c = c.replace('      <Card id="application-updates"', '        </TabsContent>\n        <TabsContent value="updates" className="space-y-6">\n      <Card id="application-updates"')

# Close Updates tab before <Card className="border-border/50 bg-card/60 ring-1 ring-border/30"> (System Nginx)
c = c.replace('      <Card className="border-border/50 bg-card/60 ring-1 ring-border/30">\n        <CardHeader>\n          <CardTitle>System Nginx Configuration', '        </TabsContent>\n        <TabsContent value="network" className="space-y-6">\n      <Card className="border-border/50 bg-card/60 ring-1 ring-border/30">\n        <CardHeader>\n          <CardTitle>System Nginx Configuration')

# Close Network tab before Apply Environment Variables Patch
c = c.replace('      <Card className="border-destructive/40 bg-destructive/5 ">\n        <CardHeader>\n          <CardTitle className="text-destructive">Apply Environment Variables Patch', '        </TabsContent>\n        <TabsContent value="advanced" className="space-y-6">\n      <Card className="border-destructive/40 bg-destructive/5 ">\n        <CardHeader>\n          <CardTitle className="text-destructive">Apply Environment Variables Patch')

# Close Advanced tab and add Security tab at the end (with ApiTokensCard)
end_tag = '      </Card>\n    </div>\n  );\n}'
new_end_tag = '      </Card>\n        </TabsContent>\n        <TabsContent value="security" className="space-y-6">\n          <ApiTokensCard />\n        </TabsContent>\n      </Tabs>\n    </div>\n  );\n}'
c = c.replace(end_tag, new_end_tag)

with open('dashboard/src/pages/Settings.tsx', 'w') as f:
    f.write(c)
