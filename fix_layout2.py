import re
with open('dashboard/src/components/Layout.tsx', 'r') as f:
    c = f.read()

# find useEffect calling getServerStats
# It starts around line 137
# I will use a more robust regex to remove it
useEffect_regex = r'  useEffect\(\(\) => \{\n    let cancelled = false;\n    const tick = async \(\) => \{\n      try \{\n        const s = await getServerStats\(\);\n.*?    return \(\) => \{\n      cancelled = true;\n      window\.clearInterval\(id\);\n    \};\n  \}, \[\]\);\n'
c = re.sub(useEffect_regex, '', c, flags=re.DOTALL)

with open('dashboard/src/components/Layout.tsx', 'w') as f:
    f.write(c)
