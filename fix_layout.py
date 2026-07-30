import re
with open('dashboard/src/components/Layout.tsx', 'r') as f:
    c = f.read()

# Remove the useEffect that fetches serverStats
useEffect_regex = r'  useEffect\(\(\) => \{\n    let cancelled = false;\n    const tick = async \(\) => \{\n      try \{\n        const s = await getServerStats\(\);\n      \} catch \{\n      \}\n    \};\n    void tick\(\);\n    const id = window\.setInterval\(tick, 10000\);\n    return \(\) => \{\n      cancelled = true;\n      window\.clearInterval\(id\);\n    \};\n  \}, \[\]\);\n'
c = re.sub(useEffect_regex, '', c, flags=re.DOTALL)

with open('dashboard/src/components/Layout.tsx', 'w') as f:
    f.write(c)
