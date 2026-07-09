import sys

with open('assets/js/lab-films/redundancy-reactor.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'var e1 = s.tex2("\\\\text{Failure Probability (Independent)}", { px: 480, py: 96, size: "1.4rem", color: "#e8eef9" });',
    'var e1 = s.tex2("\\\\text{Failure Probability (Independent)}", { px: 480, py: 66, size: "1.4rem", color: "#e8eef9" });\\n      s.fadeIn(e1, { at: 10, dur: 1.0 });'
)

c = c.replace(
    'var e2 = s.tex2("\\\\text{For 3 voters: Fails if 2 or 3 fail}", { px: 480, py: 148, size: "1.3rem", color: AMB });',
    'var e2 = s.tex2("\\\\text{For 3 voters: Fails if 2 or 3 fail}", { px: 480, py: 106, size: "1.3rem", color: AMB });'
)

c = c.replace(
    'var e1 = s.tex2("\\\\text{Redundancy drastically suppresses independent errors}", { px: 700, py: 80, size: "1.3rem", color: "#e8eef9" });',
    'var e1 = s.tex2("\\\\text{Redundancy drastically suppresses independent errors}", { px: 700, py: 60, size: "1.3rem", color: "#e8eef9" });'
)

c = c.replace(
    'var t = s.tex2("\\\\text{Design Diversity: Build N independent implementations.}", { px: 480, py: 110, size: "1.4rem", color: "#dbeafe" });',
    'var t = s.tex2("\\\\text{Design Diversity: Build N independent implementations.}", { px: 480, py: 50, size: "1.4rem", color: "#dbeafe" });'
)

with open('assets/js/lab-films/redundancy-reactor.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed redundancy reactor overlaps.')
