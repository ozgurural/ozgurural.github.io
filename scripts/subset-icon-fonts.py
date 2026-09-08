#!/usr/bin/env python
"""Cut the icon fonts down to the icons this site actually uses.

Font Awesome Free ships 268 KB of woff2 for about two thousand glyphs, and the
site draws roughly seventy of them. On a first visit that is a quarter of the
page weight spent on glyphs nobody will see.

The set is derived, never hand-kept. The script scans the repository for
`fa-<name>` tokens, resolves each against Font Awesome's own `_variables.scss`,
and subsets the three woff2 files to the codepoints that resolved. A new icon
therefore needs no list updating: add the class, re-run, and it is included.
Anything that looks like an icon class but resolves to nothing is printed, so a
typo shows up here rather than as an empty box on the page.

Two families are left whole on purpose. `fa-v4compatibility` is aliases and is
already tiny, and the Google Fonts faces are served by Google.

    python scripts/subset-icon-fonts.py [--check]

--check subsets to a temporary file and reports the sizes without writing, so
CI or a doubtful human can see what would change.
"""
import io
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEBFONTS = os.path.join(ROOT, 'assets', 'webfonts')
VARS = os.path.join(ROOT, '_sass', 'vendor', 'font-awesome', '_variables.scss')

# where an icon class can be written: templates, content, data, and the film
# scripts, which draw their own markup
SCAN_DIRS = ['_includes', '_layouts', '_pages', '_posts', '_publications',
             '_teaching', '_data', 'assets/js', 'assets/css']
SCAN_ROOT_FILES = ['_config.yml', 'enterprise-ai-architecture.html', 'index.html']
SKIP = ('_site', 'node_modules', '.git', '.claude', 'vendor', 'dist')

FAMILY = {
    'fa-solid-900.woff2': 'solid',
    'fa-brands-400.woff2': 'brands',
    'fa-regular-400.woff2': 'regular',
}


def icon_names():
    """Every fa-<name> token written anywhere in the source."""
    pat = re.compile(r'\bfa-([a-z0-9]+(?:-[a-z0-9]+)*)\b')
    found = set()
    targets = []
    for d in SCAN_DIRS:
        p = os.path.join(ROOT, d)
        for dirpath, dirnames, filenames in os.walk(p):
            dirnames[:] = [x for x in dirnames if x not in SKIP]
            for fn in filenames:
                if fn.endswith(('.html', '.md', '.yml', '.yaml', '.js', '.css', '.json')):
                    targets.append(os.path.join(dirpath, fn))
    for fn in SCAN_ROOT_FILES:
        p = os.path.join(ROOT, fn)
        if os.path.exists(p):
            targets.append(p)
    for p in targets:
        try:
            txt = io.open(p, encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        found.update(pat.findall(txt))
    return found


def codepoints():
    """name -> codepoint, from Font Awesome's own variable table."""
    txt = io.open(VARS, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^\$fa-var-([a-z0-9-]+):\s*\\([0-9a-fA-F]+);', txt, re.M):
        out[m.group(1)] = int(m.group(2), 16)
    return out


def main():
    check = '--check' in sys.argv
    names = icon_names()
    table = codepoints()

    # sizing and layout keywords share the fa- prefix and are not icons
    NOT_ICONS = {'solid', 'regular', 'brands', 'fw', 'lg', 'xs', 'sm',
                 'spin', 'pulse', 'border', 'pull-left', 'pull-right',
                 'stack', 'stack-1x', 'stack-2x', 'inverse', 'li', 'ul',
                 'rotate-90', 'rotate-180', 'rotate-270', 'flip-horizontal',
                 'flip-vertical', 'flip-both', 'beat', 'fade', 'shake',
                 'bounce', 'spin-pulse', 'spin-reverse', 'layers', 'icon',
                 'font-path', 'var'}
    NOT_ICONS |= {'%dx' % n for n in range(1, 11)}
    NOT_ICONS |= {'%dx' % n for n in (2, 3, 4, 5, 6, 7, 8, 9, 10)}

    used, unknown = {}, []
    for n in sorted(names):
        if n in NOT_ICONS or re.fullmatch(r'\d+x', n):
            continue
        if n in table:
            used[n] = table[n]
        else:
            unknown.append(n)

    if unknown:
        print('not Font Awesome icon names (ignored, check for typos):')
        print('   ', ', '.join(unknown[:24]))
    print('%d icon names resolved' % len(used))

    total_before = total_after = 0
    for fn in FAMILY:
        src = os.path.join(WEBFONTS, fn)
        if not os.path.exists(src):
            continue
        # keep the original next to the subset: the subset is a build artifact
        # and this script has to be able to run twice
        orig = src.replace('.woff2', '.full.woff2')
        if not os.path.exists(orig):
            io.open(orig, 'wb').write(io.open(src, 'rb').read())
        before = os.path.getsize(orig)

        out = (src if not check
               else os.path.join(tempfile.gettempdir(), 'chk-' + fn))
        cps = ','.join('U+%04X' % c for c in sorted(set(used.values())))
        subprocess.run([sys.executable, '-m', 'fontTools.subset', orig,
                        '--unicodes=' + cps,
                        '--flavor=woff2',
                        '--layout-features=*',
                        '--output-file=' + out],
                       check=True, capture_output=True)
        after = os.path.getsize(out)
        total_before += before
        total_after += after
        print('%-24s %6.0f KB -> %5.0f KB' % (fn, before / 1024, after / 1024))

    print('total %.0f KB -> %.0f KB (%.0f KB saved)%s'
          % (total_before / 1024, total_after / 1024,
             (total_before - total_after) / 1024,
             '  [check only, nothing written]' if check else ''))


if __name__ == '__main__':
    main()
