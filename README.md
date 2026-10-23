# Kickoff Draw — Android

An offline Android companion for choosing both sides in EAFC 26 Kick Off. Version 0.1.0.

## What is implemented

- Balanced, unrestricted and same-league random matchups.
- Home/away team cards, player names, swapping teams and redrawing just one side.
- Gender, club/national, league and half-star rating filters.
- Custom team pools: enable or exclude individual teams.
- Optional session-wide used-team prevention with explicit reset.
- Add, edit and delete teams; validated roster import/export using JSON text.
- Local persistence for preferences, player names, team data, current draw and the latest 30 matchups.
- Responsive interface, screen-reader labels and reduced-motion support.
- Android Back closes a dialog, returns to Draw, then exits from Draw.

The Android application uses a small Java Activity with a bundled HTML/CSS/JavaScript interface in a WebView. All assets ship inside the application. No internet permission, remote scripts, account, server, analytics, or runtime dependency downloads are used. Node is needed only for development tests and the optional browser preview.

## Try the interface before building

Open `PREVIEW.html` in a modern browser. It is a self-contained copy of the app interface; it does not install an Android app. Browser saves are separate from Android app saves.

Or, with Node 22 or newer, from this folder:

```sh
npm test
npm run preview
```

Visit http://127.0.0.1:4173. No npm install is needed because development tools use Node's built-in modules.

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

## Alternative: build with GitHub Actions

Create your own repository and upload **the contents of this project folder at the repository root**, including `.github/workflows/android.yml`. The repository does not need to be public. Go to Actions → Build Android APK → Run workflow. On success, download the `kickoff-draw-debug-apk` artifact, extract it, and install `app-debug.apk`. The workflow also runs the logic tests and Android lint. No repository was created or uploaded automatically.

## Team-data scope

The starter roster is a **32-club star-rating snapshot**, with 16 men's and 16 women's teams from the FC 26 ratings reveal. It is not a full Kick Off database and is not a live squad update. No national teams are included initially; add them in Teams using the ratings and availability shown in your installed game. National teams need at least two compatible entries before they can be drawn.

Source: [Sports Illustrated: The 32 Highest Rated Teams in EA Sports FC 26 Revealed](https://www.si.com/soccer/32-highest-rated-teams-ea-sports-fc-26-revealed), published 6 September 2025, updated 30 September 2025. League and country labels organize the starter roster. Ratings are editable. Initial badges use text initials; official crests are not bundled. This independent fan project is not affiliated with EA SPORTS.

Balanced mode compares **star ratings**, not numeric overall ratings. All-category draws still pair men with men, women with women, clubs with clubs, and national teams with national teams. Every valid unordered pair has the same draw probability, followed by random home/away assignment. Consequently, individual teams with fewer compatible opponents can appear less often. Single-side redraws uniformly select a different valid replacement and keep the opponent fixed. In same-league mode, larger leagues have more possible matchups and therefore contribute more draws.

Every draw and redraw records a matchup. Swapping only exchanges the teams assigned to the two players; it does not rename players or append a new history entry. Used teams count across all modes and categories until reset. A redraw can keep a previously used locked opponent, while its replacement must meet the active filters and repeat rule. Exhausted pools produce an explanation and never reset automatically.

## Roster import format

Import/export works by copying and pasting JSON in Teams → Import / export. Import replaces the roster after confirmation, clears the current matchup and used/excluded team lists, and preserves history. This is a text-based import/export, not a system file picker. Example:

```json
[
  {"id":"example-a","name":"Example A","league":"Custom League","country":"Example Country","gender":"men","kind":"club","stars":4},
  {"id":"example-b","name":"Example B","league":"Custom League","country":"Example Country","gender":"men","kind":"club","stars":4.5}
]
```

IDs must be unique and contain only letters, digits, hyphens or underscores. A roster contains 2–1,000 teams. Stars must be 0.5–5 in half-star steps. Category is `men` or `women`; kind is `club` or `national`. Roster JSON is validated before existing data changes.

## Validation and remaining work

17 automated engine tests pass, including thousands of seeded draws and tests for fairness, balanced/same-league restrictions, exclusion pools, invalid imports, repeat exhaustion and locked-side redraws. The JavaScript files pass Node syntax checks. Browser testing covers player names, both-side and one-side draws, women's categories, history, persistence after reload, adding/searching/excluding/deleting a temporary team, and malformed import handling.

**An APK has not been built or tested in this environment:** it has no usable Android SDK/JDK toolchain and blocks outbound dependency downloads. Java compilation, Android lint, actual WebView persistence, Android Back behavior, rotation, TalkBack and physical-device installation still need verification on Android or in the provided CI workflow. No compiled APK is included. The build script and CI configuration are included but have not been executed here.

## Project layout

- `app/src/main/java/.../MainActivity.java`: offline Android host.
- `app/src/main/assets/engine.js`: framework-independent draw rules and validation.
- `app/src/main/assets/teams.js`: starter snapshot and source attribution.
- `app/src/main/assets/index.html`, `style.css`, `app.js`: interface and local persistence.
- `tests/engine.test.cjs`: automated logic tests.
- `tools/preview.cjs`: local development server.
- `.github/workflows/android.yml`: Android debug build, lint and tests.
- `build.ps1`: local Windows build and official wrapper generation.

Data stays on the device and is removed when app storage is cleared or the app is uninstalled. Back up your roster JSON before uninstalling. History and player names are not included in roster exports.
