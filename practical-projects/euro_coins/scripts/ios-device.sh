#!/usr/bin/env bash
# Builds the iOS app, signs it with your (free) Personal Team and installs + launches it on a
# USB-connected iPhone, without opening the Xcode window. Run via `npm run ios:device`, which
# first does `npm run build` and `cap sync ios`.
#
# One-time setup:
#   1. Xcode → Settings → Accounts → + → Apple ID (the only step that needs the Xcode window).
#   2. export IOS_TEAM_ID=XXXXXXXXXX   (your Personal Team ID, e.g. in ~/.zshrc)
# Optional:
#   IOS_DEVICE_UDID  pick a device when more than one iPhone is connected
#   IOS_BUNDLE_ID    if com.kiryazovkosta.eurocoins is taken for your Apple ID (e.g. ...eurocoins.dev)
#
# Team and bundle ID are passed on the command line, so project.pbxproj (tracked in git) stays unchanged.
set -euo pipefail

cd "$(dirname "$0")/.."

# Use the full Xcode even when xcode-select still points at the Command Line Tools
# (switching it needs sudo, which a non-admin account doesn't have)
if [[ -z "${DEVELOPER_DIR:-}" && "$(xcode-select -p 2>/dev/null)" == *CommandLineTools* ]]; then
  xcode_app="$(mdfind "kMDItemCFBundleIdentifier == 'com.apple.dt.Xcode'" | head -1)"
  [[ -n "$xcode_app" ]] || { echo "Xcode not found. Install it from the App Store." >&2; exit 1; }
  export DEVELOPER_DIR="$xcode_app/Contents/Developer"
fi

team_id="${IOS_TEAM_ID:-}"
if [[ -z "$team_id" ]]; then
  echo "IOS_TEAM_ID is not set. Add your Apple ID in Xcode → Settings → Accounts, then:" >&2
  echo "  export IOS_TEAM_ID=<your Personal Team ID>" >&2
  exit 1
fi
bundle_id="${IOS_BUNDLE_ID:-com.kiryazovkosta.eurocoins}"

# Find the connected iPhone (physical, not a simulator)
devices_json="$(mktemp -t devicectl)"
trap 'rm -f "$devices_json"' EXIT
xcrun devicectl list devices --quiet --json-output "$devices_json" >/dev/null
udid="${IOS_DEVICE_UDID:-$(node -e '
  const { result } = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  // "reality" is "simulated" for simulators; a real device that is not paired yet has no "reality" at all
  const devices = result.devices.filter(
    (d) => d.hardwareProperties?.reality !== "simulated" && d.hardwareProperties?.platform === "iOS"
  );
  if (devices.length > 1) {
    console.error("More than one device; set IOS_DEVICE_UDID to one of:");
    for (const d of devices) console.error(`  ${d.hardwareProperties.udid}  ${d.deviceProperties?.name}`);
    process.exit(1);
  }
  if (devices[0]) console.log(devices[0].hardwareProperties.udid);
' "$devices_json")}"
if [[ -z "$udid" ]]; then
  echo "No iPhone found. Plug it in with a data cable, unlock it and tap \"Trust This Computer\"." >&2
  exit 1
fi
echo "› Device: $udid"

derived_data="ios/App/build"   # gitignored (ios/.gitignore: App/build)
echo "› Building and signing (team $team_id, bundle $bundle_id)..."
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination "id=$udid" \
  -derivedDataPath "$derived_data" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  DEVELOPMENT_TEAM="$team_id" \
  PRODUCT_BUNDLE_IDENTIFIER="$bundle_id" \
  CODE_SIGN_STYLE=Automatic \
  -quiet \
  build

echo "› Installing..."
xcrun devicectl device install app --device "$udid" "$derived_data/Build/Products/Debug-iphoneos/App.app"

echo "› Launching..."
if ! xcrun devicectl device process launch --device "$udid" "$bundle_id"; then
  echo >&2
  echo "Installed, but iOS would not launch it. On the iPhone:" >&2
  echo "  • iOS 16+: Settings → Privacy & Security → Developer Mode → On (the phone restarts)" >&2
  echo "  • Settings → General → VPN & Device Management → your Apple ID → Trust" >&2
  echo "Then run this again, or just tap the Euro Coins icon." >&2
  exit 1
fi
echo "✔ Euro Coins is running on the iPhone. The free signing lasts 7 days; run this again once it expires."
