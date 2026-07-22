# CV / Résumé (LaTeX source)

`resume.tex` is the single source for **Ozgur_Ural_PhD_Resume.pdf** (linked from
the site nav). It is a self-contained, single-column, ATS-friendly document:
everything except the horizontal rules and bullets is selectable text, so
applicant-tracking systems parse it cleanly (copy the PDF text out — it comes
through complete and in reading order).

## Build

Automatic (recommended): push a change to `cv/**` and the
[`build-cv`](../.github/workflows/build-cv.yml) GitHub Action compiles the PDF
and commits the refreshed `Ozgur_Ural_PhD_Resume.pdf` to the repo root, where
GitHub Pages serves it.

Local (MiKTeX or TeX Live):

```bash
pdflatex -output-directory=build -jobname=Ozgur_Ural_PhD_Resume resume.tex
pdflatex -output-directory=build -jobname=Ozgur_Ural_PhD_Resume resume.tex   # 2nd pass for links
cp build/Ozgur_Ural_PhD_Resume.pdf ../Ozgur_Ural_PhD_Resume.pdf
```

or simply `latexmk -pdf resume.tex`. (`build/` is git-ignored.)

## Notes

- Compiles with **pdfLaTeX** — no external `.sty` needed; the layout commands are
  inlined in the preamble.
- Keep it single-column and text-based; do not add multi-column layouts, tables
  for alignment, or text inside images, or ATS parsing degrades.
- The layout commands are adapted from Cies Breijs' MIT-licensed résumé template
  (<https://github.com/cies/resume>).
