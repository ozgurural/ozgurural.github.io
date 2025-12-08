# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Personal academic portfolio website built on the [academicpages](https://github.com/academicpages/academicpages.github.io) Jekyll template. The site is hosted on GitHub Pages at `ozgurural.github.io`.

## Development Commands

### Local Development (Docker - Recommended)

```bash
# Build and start Jekyll server with live reload
docker-compose up --build

# Start server (image already built)
docker-compose up
```

Server runs at `http://localhost:4000` with live reload on port 35729.

### Local Development (Native Ruby)

```bash
# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve -l -H localhost

# Build site without serving
bundle exec jekyll build
```

### JavaScript Assets

```bash
# Install npm dependencies
npm install

# Build minified JS (combines jQuery, FitVids, plugins)
npm run build:js

# Watch for JS changes
npm run watch:js
```

## Architecture

### Content Collections

Content is organized in Jekyll collections defined in `_config.yml`:

- `_publications/` - Academic publications (output to `/publications/`)
- `_portfolio/` - Portfolio items (output to `/portfolio/`)
- `_talks/` - Conference talks and presentations (output to `/talks/`)
- `_teaching/` - Teaching materials (output to `/teaching/`)
- `_posts/` - Blog posts (standard Jekyll posts)
- `_pages/` - Static pages (about, CV, projects, etc.)

### Key Configuration Files

- `_config.yml` - Main Jekyll config; site settings, author profile, collections, plugins
- `_config_docker.yml` - Docker-specific overrides (blanks URL for local dev)
- `_data/navigation.yml` - Site header navigation menu order and links
- `_data/cv.json` - Structured CV data (optional JSON-based CV layout)

### Markdown Generators

The `markdown_generator/` directory contains Python scripts and Jupyter notebooks to batch-generate markdown files from TSV/BibTeX data:

- `publications.tsv` → `_publications/` markdown files
- `talks.tsv` → `_talks/` markdown files
- `PubsFromBib.ipynb` - Generate publications from BibTeX
- `OrcidToBib.ipynb` - Fetch publications from ORCID

### Layouts & Includes

- `_layouts/` - Page templates (default, single, archive, talk, cv-layout)
- `_includes/` - Reusable components (author-profile, masthead, footer, seo)
- `_sass/` - SCSS stylesheets

### Static Assets

- `images/` - Site images (author avatar referenced as `ozgururalpp.jpg` in config)
- `files/` - Downloadable files (PDFs, documents)
- `assets/js/` - JavaScript (main.min.js is built from npm scripts)
