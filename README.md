# ChefPath Deployment Guide

This repository is prepared for:
- Backend deployment on Render (Spring Boot API)
- Frontend deployment on GitHub Pages (`docs/` static site)
- Supabase Auth with custom SMTP (Mailtrap) to bypass the built-in `2 emails/hour` limit

## Architecture

- `src/main/...`: Spring Boot backend (REST API under `/api`)
- `docs/...`: Static frontend for GitHub Pages
- `docs/js/config.js`: Frontend runtime config (Supabase + backend API URL + route map)

GitHub Pages cannot run Spring Boot, so the public setup is:
- GitHub Pages serves UI
- Render serves API
- Supabase handles auth and database

## 1) Configure Render (Backend)

1. Create a new Render Web Service from this repo.
2. Use:
   - Runtime: `Java`
   - Build command: `mvn clean package -DskipTests`
   - Start command: `java -jar target/springboot-applications-0.0.1-SNAPSHOT.jar`
3. Set environment variable:
   - `APP_CORS_ALLOWED_ORIGIN=https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>`
4. Deploy and copy your backend URL, e.g. `https://chefpath-backend.onrender.com`.

## 2) Configure GitHub Pages (Frontend)

1. In `docs/js/config.js`, set:
   - `window.__API_BASE_URL__ = "https://<YOUR_RENDER_URL>/api";`
2. Push to `main`.
3. In GitHub repo settings:
   - `Pages` -> `Build and deployment` -> `Source: GitHub Actions`
4. The workflow `.github/workflows/deploy-pages.yml` will publish `docs/`.

## 3) Configure Supabase SMTP with Mailtrap

Supabase docs: [Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

1. Open Supabase Dashboard:
   - `Authentication` -> `Settings` -> `SMTP Settings`
2. Enable custom SMTP and fill Mailtrap values:
   - `SMTP host`: from Mailtrap
   - `SMTP port`: from Mailtrap (usually `587` or `2525`)
   - `SMTP user`: from Mailtrap
   - `SMTP password`: from Mailtrap
   - `Sender email`: verified sender (Mailtrap)
   - `Sender name`: `ChefPath` (or your app name)
3. Save.
4. Go to:
   - `Authentication` -> `Rate Limits`
5. Increase `Rate limit for sending emails` above the default.

After custom SMTP is enabled, Supabase allows sending to real users and you can tune rate limits for your use case.

## 4) Local Git Commands (New Repo)

Run these after you create an empty GitHub repo manually:

```bash
git init
git add .
git commit -m "Prepare GitHub Pages + Render + Supabase SMTP deployment"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

## Notes

- The `mailtrap-java` Maven SDK is useful when your backend sends emails directly.
- For Supabase Auth emails (sign-up confirmation, magic links, reset password), SMTP is configured in Supabase dashboard, not in Spring Boot code.
