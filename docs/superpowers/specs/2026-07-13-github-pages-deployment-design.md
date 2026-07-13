# GitHub Pages Deployment Design

## Outcome

Fluency Reset will publish automatically to `https://legendhjj.github.io/EnglishlearningWeb/` whenever changes are pushed to `feature/fluency-reset-mvp`. Deployment will use GitHub Actions and GitHub Pages without adding a backend or external runtime service.

## Build and deployment

A workflow in `.github/workflows/deploy-pages.yml` will install the locked dependencies, run the production build, upload `dist`, and deploy that artifact with GitHub's official Pages actions. The workflow will run on pushes to `feature/fluency-reset-mvp` and can also be started manually from the Actions tab.

The workflow will use least-privilege permissions: read access to repository contents, write access to Pages, and an identity token for deployment. A concurrency group will prevent overlapping Pages deployments.

## Asset paths and routing

Vite will use `/EnglishlearningWeb/` as the production base path so scripts, styles, fonts, and other assets load from the project site rather than the account root.

The application will use hash-based client routing. URLs such as `https://legendhjj.github.io/EnglishlearningWeb/#/app` remain entirely within the single generated `index.html`, so refreshing a nested application screen will not produce a GitHub Pages 404. Local development will continue to work through Vite.

## User setup and documentation

The README will document the one-time GitHub setting: open **Settings > Pages** and select **GitHub Actions** as the source. It will also document the site URL, automatic deployment trigger, manual workflow trigger, and where to inspect a failed deployment.

## Privacy and scope

Deployment remains static, backend-free, and login-free. LocalStorage and IndexedDB continue to belong to the browser origin. Audio recordings are not uploaded by the deployment flow or by the application.

## Verification

Implementation verification will run the existing required checks:

```bash
npm test -- --run
npm run typecheck
npm run build
```

The generated `dist/index.html` will also be inspected to confirm its asset URLs include `/EnglishlearningWeb/`. The workflow YAML, branch trigger, Pages artifact path, and router change will be reviewed directly.
