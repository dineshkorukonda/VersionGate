import re

with open('dashboard/src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Replace navBtn
content = content.replace(
    'const navBtn =\n  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-none px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-sidebar-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>span:last-child]:truncate";',
    'const navBtn =\n  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>span:last-child]:truncate";'
)

# Update sidebar header
content = re.sub(
    r'<div className="flex flex-col gap-0\.5 group-data-\[collapsible=icon\]:items-center">.*?</div>',
    '<div className="flex items-center"><span className="text-base font-semibold text-white">VersionGate</span></div>',
    content,
    flags=re.DOTALL
)

# Remove "Navigate" label
content = re.sub(
    r'<SidebarGroupLabel[^>]*>\s*Navigate\s*</SidebarGroupLabel>',
    '',
    content
)

# Update "Projects" label to not be uppercase
content = re.sub(
    r'<SidebarGroupLabel[^>]*>\s*Projects\s*</SidebarGroupLabel>',
    '<SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold text-sidebar-foreground">Projects</SidebarGroupLabel>',
    content
)

# Active state in nav links (Projects and Main nav)
content = content.replace(
    '"border-l-2 border-foreground bg-sidebar-accent font-medium text-foreground"',
    '"bg-sidebar-accent text-white"'
)
content = content.replace(
    '"border-l-2 border-primary bg-sidebar-accent font-medium text-primary"',
    '"bg-sidebar-accent text-white"'
)

# Sidebar footer styling for "New project"
content = re.sub(
    r'<div className="flex flex-col gap-1 px-1 group-data-\[collapsible=icon\]:hidden">.*?</div>',
    '',
    content,
    flags=re.DOTALL
)
content = content.replace(
    '<SidebarFooter className="gap-2 border-t border-sidebar-border p-2">',
    '<SidebarFooter className="p-4">'
)
content = content.replace(
    '<Button\n                type="button"\n                className="w-full gap-2  group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"\n                onClick={() => setCreateProjectOpen(true)}\n              >',
    '<Button\n                type="button"\n                className="w-full gap-2 bg-white text-black hover:bg-zinc-200"\n                onClick={() => setCreateProjectOpen(true)}\n              >'
)

# Header styling
content = content.replace(
    '<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">',
    '<header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">'
)

# System status in header (remove it, breadcrumbs only)
content = re.sub(
    r'<div className="flex items-center gap-2 font-mono text-\[10px\] uppercase tracking-widest text-muted-foreground">.*?</div>',
    '',
    content,
    flags=re.DOTALL
)

# Search styling
content = content.replace(
    'className="h-9 cursor-pointer border-border bg-muted pl-9 font-mono text-xs"',
    'className="h-8 cursor-pointer rounded-md border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground"'
)

# Footer removal
content = re.sub(
    r'<footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 font-mono text-\[10px\] uppercase tracking-wider text-muted-foreground">.*?</footer>',
    '',
    content,
    flags=re.DOTALL
)

with open('dashboard/src/components/Layout.tsx', 'w') as f:
    f.write(content)
