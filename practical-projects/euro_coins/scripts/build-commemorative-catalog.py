"""Build the €2 commemorative coins catalog from the ECB export.

Usage: python scripts/build-commemorative-catalog.py <Commemorative export dir> <app dir>

The export has one folder per year with a README.md index table, and one subfolder per coin
(image + README.md). Joint issues ("Joint issue - ..." folders) hold one image per country;
each country's version is its own coin here, because collectors keep them separately.

Writes public/assets/commemoratives/<year>/<id>.webp (at most 400px) and
<id>-thumb.webp (at most 160px), plus public/assets/commemoratives/catalog.json. Requires Pillow.
"""
import json, os, re, sys
from PIL import Image

SRC, APP = sys.argv[1], sys.argv[2]
OUT = os.path.join(APP, 'public/assets/commemoratives')
CODES = {'Andorra':'AD','Austria':'AT','Belgium':'BE','Bulgaria':'BG','Croatia':'HR','Cyprus':'CY','Estonia':'EE','Finland':'FI','France':'FR','Germany':'DE','Greece':'GR','Ireland':'IE','Italy':'IT','Latvia':'LV','Lithuania':'LT','Luxembourg':'LU','Malta':'MT','Monaco':'MC','Netherlands':'NL','Portugal':'PT','San Marino':'SM','Slovakia':'SK','Slovenia':'SI','Spain':'ES','Vatican City':'VA'}
# Left out on purpose (Kosta, 2026-11-25): the two newest 2025 coins (rows 1 and 2 of the ECB
# 2025 page: Lithuania - Lithuanian Minor, Slovenia - Miki Muster), to be added later.
SKIP = {(2025, 1), (2025, 2)}


def field(md, name):
    m = re.search(r'^\| ' + re.escape(name) + r' \| (.*?) \|$', md, re.M)
    return m.group(1).strip() if m else ''


def section(md, name):
    m = re.search(r'^## ' + re.escape(name) + r'\s*\n(.*?)(?=^## |\Z)', md, re.S | re.M)
    return m.group(1).strip() if m else ''


def description(md):
    text = section(md, 'Description')
    # Drop the export's own italic notes
    text = '\n\n'.join(p.strip() for p in re.split(r'\n\s*\n', text)
                       if p.strip() and not p.strip().startswith('_'))
    text = re.sub(r'([a-z\)\"”])\.([A-Z])', r'\1. \2', text)
    return text[:1].upper() + text[1:] if text else None


def slug(text, n=40):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s[:n].rstrip('-')


def save(src, year, cid):
    os.makedirs(os.path.join(OUT, str(year)), exist_ok=True)
    im = Image.open(src).convert('RGBA')
    bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3])
    full = bg.copy(); full.thumbnail((400, 400), Image.LANCZOS)
    full.save(os.path.join(OUT, str(year), cid + '.webp'), 'WEBP', quality=80, method=6)
    bg.thumbnail((160, 160), Image.LANCZOS)
    bg.save(os.path.join(OUT, str(year), cid + '-thumb.webp'), 'WEBP', quality=78, method=6)
    return f'assets/commemoratives/{year}/{cid}.webp', f'assets/commemoratives/{year}/{cid}-thumb.webp'


coins, ids = [], set()
for year in sorted((int(y) for y in os.listdir(SRC) if y.isdigit()), reverse=True):
    index = open(os.path.join(SRC, str(year), 'README.md'), encoding='utf-8').read()
    rows = re.findall(r'^\| (\d+) \| .*\]\(<(.+?)/README\.md>\) \|$', index, re.M)
    assert rows, year
    for no, folder in rows:
        if (year, int(no)) in SKIP:
            print('skipped', year, folder)
            continue
        d = os.path.join(SRC, str(year), folder)
        md = open(os.path.join(d, 'README.md'), encoding='utf-8').read()
        feature = field(md, 'Feature')
        base = {
            'year': year,
            'feature': feature,
            'issuingDate': field(md, 'Issuing date') or None,
            'description': description(md),
        }
        if folder.startswith('Joint issue'):
            images = sorted(f for f in os.listdir(d) if f.endswith('_joint.jpg'))
            for img in images:
                country = img.split('_2euro_')[0].replace('_', ' ')
                # 2009 has a second Luxembourg version ("Luxembourg_variant_...")
                variant = country.endswith(' variant')
                country = country.removesuffix(' variant')
                code = CODES[country]
                cid = f'{year}-{code.lower()}-joint' + ('-variant' if variant else '')
                small, thumb = save(os.path.join(d, img), year, cid)
                coins.append({'id': cid, 'countryCode': code, 'country': country, **base,
                              'feature': feature + (' (variant)' if variant else ''),
                              'issuingVolume': None, 'joint': True, 'image': small, 'thumb': thumb})
                ids.add(cid)
        else:
            country = field(md, 'Country')
            code = CODES[country]
            imgs = [f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.png', '.gif'))]
            assert len(imgs) == 1, d
            cid = f'{year}-{code.lower()}-{slug(feature)}'
            assert cid not in ids, cid
            ids.add(cid)
            small, thumb = save(os.path.join(d, imgs[0]), year, cid)
            coins.append({'id': cid, 'countryCode': code, 'country': country, **base,
                          'issuingVolume': field(md, 'Issuing volume') or None, 'joint': False,
                          'image': small, 'thumb': thumb})

with open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf-8') as f:
    json.dump({'coins': coins}, f, ensure_ascii=False, separators=(',', ':'))
print(len(coins), 'coins')
