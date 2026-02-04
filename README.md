# Stress Impact From Ingredients (Demo)

Marketing-style web app that estimates potential stress impact from everyday ingredient lists.

## What it does

- Accepts ingredient text by copy/paste
- Sends uploaded photos to OpenAI for ingredient + verdict processing
- Lets you paste an OpenAI API key in the UI (stored in browser localStorage)
- Scores likely stress impact on a 0-100 scale
- Highlights likely trigger ingredients
- Surfaces potentially supportive ingredients
- Provides practical next-step suggestions

## Local preview

Open `index.html` directly, or run a static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at:

- `.github/workflows/deploy-pages.yml`

After pushing to `main`, GitHub Pages deploys automatically.

Expected demo URL:

- `https://gaiafeel-afk.github.io/stressimpactfromingredients/`

## Note

This tool is educational and marketing-focused, not medical advice.
Uploaded photos are sent to OpenAI to generate verdict text.
