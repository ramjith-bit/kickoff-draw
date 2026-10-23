# GitHub Pages

The deployable web application is in `docs/`. It is generated from the Android app's bundled assets, so both versions use the same draw rules and roster. Relative URLs work under a GitHub project path. No environment variables, external service, server, package installation or API keys are required.

The GitHub account connected for this task is `ramjith-bit`. A new `kickoff-draw` repository is the intended destination; no existing unrelated repository should be overwritten.

## Deployment

1. Create a new repository named `kickoff-draw` in your GitHub account. A public repository works with free GitHub Pages. Initialize it with a README so it has a default branch.
2. Commit this project's contents at the repository root.
3. In the repository, select Settings → Pages → Build and deployment → Source → GitHub Actions.
4. Run the **Publish web app** workflow from Actions (or push a commit to the default branch).
5. Use the site URL reported by the successful Pages deployment. Do not assume the site is live until that deployment succeeds.

Alternatively, select **Deploy from a branch**, branch `main`, folder `/docs`, then Save. The checked-in `docs/` folder is ready to publish without Actions. For later app changes, run `npm run build:web` and commit the updated `docs/` output.

## Offline use and local data

Open the deployed HTTPS site once while online. Once the header says **OFFLINE READY**, its service worker has cached the interface for future visits. Team edits, filters, names and draw history are stored in that browser on that device. They are not uploaded to GitHub or synced between friends. Clearing site data removes them; roster JSON can be exported beforehand.

The manifest lets supporting browsers offer an Add to Home Screen option. Installation behavior depends on the browser. The web app itself works in an ordinary tab.

## Check locally

```sh
npm test
npm run build:web
```

Serve `docs/` with a local HTTP server. Service-worker registration needs HTTPS or localhost. GitHub Pages provides HTTPS. The hosting process itself is independent of the Android APK build.
