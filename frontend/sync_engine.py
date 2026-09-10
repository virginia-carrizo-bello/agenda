import os, re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
front_html_path = os.path.join(base_dir, 'front.html')

with open(front_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract CSS between <style> and </style>
style_start = content.find('<style>') + len('<style>')
style_end = content.find('</style>')
css = content[style_start:style_end].strip()

front_css_path = os.path.join(base_dir, 'frontend', 'src', 'styles', 'front.css')
with open(front_css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Locate the real <body> after </style>
real_body_start = content.find('<body>', style_end)
body_html_start = real_body_start + len('<body>')

# 3. Locate script positions
matches = [m.start() for m in re.finditer(r'<script', content)]
main_script_pos = matches[1]  # Tag at 124108
gcal_script_pos = matches[2]  # Tag at 246899

# 4. Extract Real Clean Body HTML
body_html = content[body_html_start:main_script_pos].strip()

# Write frontend/index.html
index_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-touch-fullscreen" content="yes">
    <meta name="theme-color" content="#FAF5EF" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#16121D" media="(prefers-color-scheme: dark)">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='128' fill='%238B5FA8'/%3E%3Cpath d='M256 120v40M256 352v40M120 256h40M352 256h40M160 160l28 28M324 324l28 28M352 160l-28 28M188 324l-28 28' stroke='%23ffffff' stroke-width='32' stroke-linecap='round'/%3E%3Ccircle cx='256' cy='256' r='64' fill='none' stroke='%23ffffff' stroke-width='32'/%3E%3C/svg%3E">
    <title>Tempo — Organizador</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div id="root">
        {body_html}
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
'''

index_html_path = os.path.join(base_dir, 'frontend', 'index.html')
with open(index_html_path, 'w', encoding='utf-8') as f:
    f.write(index_html)

# 5. Extract Main Script JS
main_script_end = content.find('</script>', main_script_pos)
main_js = content[main_script_pos + len('<script>'):main_script_end].strip()

# 6. Extract GCal Script JS
gcal_script_end = content.find('</script>', gcal_script_pos)
gcal_js = content[gcal_script_pos + len('<script>'):gcal_script_end].strip()

# Combine JS engine
full_engine_js = f'''// Tempo 1:1 Complete Engine with GCal Integration
export function initTempoEngine() {{
{main_js}

{gcal_js}
}}
'''

engine_path = os.path.join(base_dir, 'frontend', 'src', 'tempoEngine.js')
with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(full_engine_js)

print(f"Extracted clean HTML ({len(body_html)} bytes), CSS ({len(css)} bytes), and JS engine ({len(full_engine_js)} bytes).")
