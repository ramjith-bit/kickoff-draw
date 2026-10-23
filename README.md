# Kickoff — Match picker

A small football matchup picker for two friends playing Kick Off. A responsive web app with an Android host, original crest images, an 839-team FC 26 catalog and FC 27 overall-rating matches for a squad mod.

## Use the web app

No account, download or setup is required for visitors. Open its public deployment link and tap Draw teams. Preferences, exclusions, custom ratings, names and the last 30 draws stay in that browser. They are not shared between devices.

The source repository is https://github.com/ramjith-bit/kickoff-draw. GitHub Pages is configured at https://ramjith-bit.github.io/kickoff-draw/. `vercel.json` deploys the same web build to Vercel with `npm run build:web` and output directory `docs`.

## Features

- Balanced draws using numeric overall ratings, random draws, or two teams from one competition.
- Original team crest artwork, overall ratings and attack/midfield/defence values.
- 762 club entries, 60 men's national teams and 17 women's national teams.
- 739 FC 27 rating matches and 100 explicitly marked FC 26 fallbacks; a verified-only switch excludes the latter.
- Gender/type/competition/rating filters, a custom enabled-team pool, used-team prevention, one-side redraws and team swapping.
- Editable team data and JSON-text import/export.
- Migration from the original 32-team app without discarding saved history or custom edits.
- Offline app-shell caching after the first successful visit; previously viewed crests are cached as well.

See DATA-SOURCES.md and team-catalog.json for source URLs, rating provenance and the full snapshot. This is a public database reference, not a reading of the user's installed mod. Mod-specific differences remain editable. Legacy custom entries with star ratings are retained but need an overall rating before participating in overall-based draws.

## Develop and test

With Node 22 or newer:

```sh
npm test
npm run build:web
npm run preview
```

There are no npm runtime dependencies. The web output in `docs/` uses relative URLs and works on both GitHub Pages project paths and Vercel. The standalone PREVIEW.html contains the same interface for a quick browser preview; its original crest images require internet access on first view. Use a local HTTP server for service-worker checks.

The 22 automated tests cover the full catalog counts and rating provenance, original-crest URL validation, numeric-rating selection, verified-only filtering, fair pair selection, duplicate prevention, same-category draws, pool exhaustion, locked-side redraws and legacy roster compatibility. Browser checks cover rendering, crest loading, phone widths, redraws, search, editing, history and persistence.

## Build an installable APK on Windows

Requirements: Android Studio, a full JDK 17 (or Android Studio's bundled JDK), Android SDK Platform 35, SDK Build Tools 35.0.0, and internet access for initial build dependencies. Android 8.0 or later is required on the phone.

1. Install Android Studio and use its SDK Manager to install Platform 35 and Build Tools 35.0.0.
2. Extract this project into a folder you own.
3. In PowerShell, set `JAVA_HOME` to your JDK directory. For a standard Android Studio installation:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

4. From the project folder run:

```powershell
.\build.ps1
```

If your SDK is in a different location:

```powershell
.\build.ps1 -AndroidSdk 'C:\path\to\Android\Sdk'
```

The script downloads Gradle 8.11.1 from its official distribution service, verifies its SHA-256 checksum, generates the official Gradle wrapper, and runs the debug build plus Android lint. If your system policy prevents running local scripts, open the script to review it and use your organization's normal approved execution method.

The APK will be `app/build/outputs/apk/debug/app-debug.apk`. Copy it to your phone and open it to install. Android may ask you to allow app installation from the transfer app. This is a debug build for personal testing, not a Play Store release.

For Android Studio, first run `./build.ps1 -PrepareOnly` to create the wrapper, then open the project folder and allow Gradle sync. Run the `app` configuration on a phone or emulator. A separately installed Gradle 8.11.1 can also run `gradle wrapper`, `gradle :app:assembleDebug` and `gradle :app:lintDebug`.


## Android implementation

A Java Activity loads bundled HTML/CSS/JavaScript in a WebView. The app requests network access for external crest images; it does not load remote app scripts or pages. Android-specific build, lint and device checks run separately from the static web deployment. No local APK build was possible in the restricted development environment.

## Deployment

GitHub Actions workflow `.github/workflows/pages.yml` tests and publishes `docs/`. Vercel reads `vercel.json` from the repository root. The Android workflow is separate. Hosting a public web link does not require friends to connect GitHub or Vercel accounts.

All crest artwork belongs to the respective teams. Independent fan companion, not affiliated with EA SPORTS or FIFA Index.
