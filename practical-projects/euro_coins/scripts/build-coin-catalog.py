"""Build the coin catalog from the ECB export (one folder per country/denomination with README.md + images).

Usage: python scripts/build-coin-catalog.py <EuroCoins export dir> <app dir> supabase/coin_catalog_schema.sql <migration .sql>
Writes public/assets/coins/<iso>/<denom>/s<n>.webp (540px) and s<n>-thumb.webp (160px),
public/assets/coins/catalog.json and the seeded migration. Requires Pillow.
"""
import os, re, json, sys
from PIL import Image
SRC = sys.argv[1]
APP = sys.argv[2]
OUT = os.path.join(APP, 'public/assets/coins')
CODES = {'Andorra':'AD','Austria':'AT','Belgium':'BE','Bulgaria':'BG','Croatia':'HR','Cyprus':'CY','Estonia':'EE','Finland':'FI','France':'FR','Germany':'DE','Greece':'GR','Ireland':'IE','Italy':'IT','Latvia':'LV','Lithuania':'LT','Luxembourg':'LU','Malta':'MT','Monaco':'MC','Netherlands':'NL','Portugal':'PT','San Marino':'SM','Slovakia':'SK','Slovenia':'SI','Spain':'ES','Vatican City':'VA'}
DEN = {'1 cent':'1c','2 cent':'2c','5 cent':'5c','10 cent':'10c','20 cent':'20c','50 cent':'50c','1 euro':'1e','2 euro':'2e'}

def section(md, name):
    m = re.search(r'^## ' + re.escape(name) + r'\s*\n(.*?)(?=^## |\Z)', md, re.S | re.M)
    return m.group(1).strip() if m else ''

def paras(text):
    if not text or text.startswith('_No separate'):
        return None
    # fix missing spaces after sentence end ("valid.The")
    text = re.sub(r'([a-z\)\"”])\.([A-Z])', r'\1. \2', text)
    return '\n\n'.join(p.strip() for p in re.split(r'\n\s*\n', text) if p.strip())

coins, issuers = [], {}
for country, code in CODES.items():
    for folder, den in DEN.items():
        d = os.path.join(SRC, country, folder)
        md = open(os.path.join(d, 'README.md'), encoding='utf-8').read()
        details = []
        for k, v in re.findall(r'^\| ([^|#][^|]*?) \| ([^|]+?) \|$', md, re.M):
            if k in ('Country', 'Denomination', 'Series', 'Type', '---'):
                continue
            details.append({'label': k, 'value': v.strip()})
        series = []
        for n, years, design, img in re.findall(r'^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$', section(md, 'Series and years'), re.M):
            n = int(n); img = img.strip()
            rel = f'{code.lower()}/{den}/s{n}'
            os.makedirs(os.path.join(OUT, code.lower(), den), exist_ok=True)
            im = Image.open(os.path.join(d, img)).convert('RGBA')
            bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3])
            bg.save(os.path.join(OUT, rel + '.webp'), 'WEBP', quality=85, method=6)
            bg.resize((160, 160), Image.LANCZOS).save(os.path.join(OUT, rel + '-thumb.webp'), 'WEBP', quality=80, method=6)
            start = int(re.match(r'\d{4}', years).group())
            series.append({'seriesNo': n, 'years': years.strip(), 'startYear': start, 'design': design.strip(),
                           'image': f'assets/coins/{rel}.webp', 'thumb': f'assets/coins/{rel}-thumb.webp'})
        assert series, d
        issuers[code] = paras(section(md, 'About the issuer'))
        coins.append({'countryCode': code, 'denomination': den, 'description': paras(section(md, 'Design')),
                      'details': details, 'series': series})

json.dump({'issuers': issuers, 'coins': coins}, open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

def q(s): return 'null' if s is None else "'" + s.replace("'", "''") + "'"
sql = open(sys.argv[3]).read()
rows = ',\n'.join(f"  ({q(c)}, {q(t)})" for c, t in issuers.items())
sql += f"\ninsert into public.coin_issuers (country_code, description) values\n{rows}\non conflict (country_code) do update set description = excluded.description;\n"
rows = ',\n'.join(f"  ({q(c['countryCode'])}, {q(c['denomination'])}, {q(c['description'])}, {q(json.dumps(c['details'], ensure_ascii=False))}::jsonb)" for c in coins)
sql += f"\ninsert into public.coin_designs (country_code, denomination, description, details) values\n{rows}\non conflict (country_code, denomination) do update set description = excluded.description, details = excluded.details;\n"
rows = ',\n'.join(f"  ({q(c['countryCode'])}, {q(c['denomination'])}, {s['seriesNo']}, {q(s['years'])}, {s['startYear']}, {q(s['design'])}, {q(s['image'])}, {q(s['thumb'])})" for c in coins for s in c['series'])
sql += f"\ninsert into public.coin_series (country_code, denomination, series_no, years, start_year, design, image_path, thumb_path) values\n{rows}\non conflict (country_code, denomination, series_no) do update set years = excluded.years, start_year = excluded.start_year, design = excluded.design, image_path = excluded.image_path, thumb_path = excluded.thumb_path;\n"
open(sys.argv[4], 'w', encoding='utf-8').write(sql)
print(len(coins), sum(len(c['series']) for c in coins))
