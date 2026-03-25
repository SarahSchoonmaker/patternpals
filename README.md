# 🐾 Pal Feelings

A memory game for kids that builds Social-Emotional Learning (SEL) skills. Watch your Pal express a sequence of emotions — then echo them back in order!

Built with **React Native + Expo** by KindredPal Inc.

---

## 📋 Prerequisites

Before you start, make sure you have these installed:

| Tool     | Version | Install                          |
| -------- | ------- | -------------------------------- |
| Node.js  | 18+     | [nodejs.org](https://nodejs.org) |
| npm      | 9+      | Comes with Node                  |
| Expo CLI | Latest  | `npm install -g expo-cli`        |
| EAS CLI  | Latest  | `npm install -g eas-cli`         |

**To test on your phone:**

- Install **Expo Go** from the App Store (iOS) or Play Store (Android)

**To build for App Store / Play Store:**

- An [Expo account](https://expo.dev) (free)
- Apple Developer account ($99/year) for iOS builds
- Google Play Developer account ($25 one-time) for Android builds

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/SarahSchoonmaker/palfeelings.git
cd palfeelings
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** Some Expo packages have peer dependency conflicts with newer npm versions. This flag tells npm to install them anyway.

### 3. Install the in-app purchase package

```bash
npx expo install expo-in-app-purchases --legacy-peer-deps
```

### 4. Start the development server

```bash
npx expo start --clear
```

Then scan the QR code with:

- **iPhone:** Open the Camera app → scan → tap the Expo Go link
- **Android:** Open Expo Go app → scan QR code

> **Connection issues?** Try tunnel mode:
>
> ```bash
> npx expo start --tunnel --clear
> ```

---

## 📁 Project Structure

```
PalFeelings/
├── App.js                          # Root — navigation + font loading
├── app.json                        # Expo config (bundle ID, version, assets)
├── eas.json                        # EAS Build + Submit config (Apple credentials)
├── babel.config.js                 # Babel config
├── package.json                    # Dependencies
│
├── assets/
│   ├── icon.png                    # App icon — 1024×1024px
│   ├── splash.png                  # Splash screen — 1290×2796px
│   ├── adaptive-icon.png           # Android icon — 1024×1024px (no rounded corners)
│   └── favicon.png                 # Web favicon — 256×256px
│
└── src/
    ├── data/
    │   └── gameData.js             # EMOTIONS, PALS, STORY_LINES, DAILY_CHALLENGES
    │
    ├── hooks/
    │   └── useStorage.js           # AsyncStorage save/load, XP, premium, groups
    │
    ├── utils/
    │   └── theme.js                # Colors, fonts, spacing, shadows, radius
    │
    ├── components/
    │   ├── UI.js                   # Button, Card, Pill, ProgressBar, BackButton
    │   └── BottomNav.js            # Persistent bottom navigation bar
    │
    └── screens/
        ├── HomeScreen.js           # Home — FOTD card, journey level, mode grid
        ├── GameScreen.js           # Main game — worlds, combos, sequence logic
        ├── PalSelectScreen.js      # Character selection with premium gate
        ├── PaywallScreen.js        # $7.99 premium upgrade screen
        ├── ParentScreen.js         # SEL skill tracking dashboard
        ├── JournalScreen.js        # Emotion journal
        ├── LeaderboardScreen.js    # Weekly leaderboard + journey levels + friends
        └── FeelingOfDayScreen.js   # Daily emotion + parent conversation starters
```

---

## 🎮 Game Features

### Free Tier

- 🐼 Panda pal
- 🧠 Classic mode
- 🎮 Levels 1–10
- 🌟 Feeling of the Day (+50 XP daily bonus)
- 🔥 Daily streak tracking

### Premium ($7.99 one-time)

- 🐾 All 9 Pals (Fox, Bunny, Cat, Bear, Owl, Lion, Dragon, Unicorn)
- ⚡ Speed, Mirror & Story modes
- ♾️ Unlimited levels
- 📊 Full Parent Dashboard (5 SEL skill meters)
- 🎯 Daily Challenges
- 📖 Emotion Journal
- 🚫 Zero ads ever
- 🔄 Free updates for life

### Game Mechanics

- **6 Worlds** unlock as you level up (Sunny Meadow → Magic Castle)
- **5 Emotion Combos** trigger special bonuses (e.g. Happy + Excited = 2× score)
- **No game over** — wrong answers replay the sequence so kids keep practicing
- **Level cap** at 10 for free users — paywall triggers at the moment of greatest engagement

---

## 🔧 Configuration

### app.json — key fields to update

```json
{
  "expo": {
    "name": "Pal Feelings",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.sschoonm.kindredpal"
    },
    "android": {
      "package": "com.sschoonm.kindredpal"
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

### eas.json — Apple credentials (keep this private, add to .gitignore)

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

> ⚠️ **Never commit real credentials to GitHub.** Add `eas.json` to `.gitignore`.

---

## 🏗️ Building for App Store

### Prerequisites

- EAS account linked: `eas login`
- Project linked: `eas init`

### Build iOS

```bash
eas build --platform ios --profile production
```

Takes ~15–20 minutes. EAS handles certificates and provisioning profiles automatically.

### Submit to App Store Connect

```bash
eas submit --platform ios
```

### Build Android

```bash
eas build --platform android --profile production
eas submit --platform android
```

### Or use the npm scripts shorthand

```bash
npm run build:ios       # Build iOS
npm run build:android   # Build Android
npm run build:all       # Build both platforms
npm run submit:ios      # Submit iOS to App Store
npm run submit:android  # Submit Android to Play Store


```

## 📦 Key Dependencies

| Package                                     | Purpose                           |
| ------------------------------------------- | --------------------------------- |
| `expo` ~51                                  | Core Expo SDK                     |
| `react-native` 0.74                         | React Native framework            |
| `@react-navigation/native-stack`            | Screen navigation                 |
| `expo-linear-gradient`                      | World backgrounds + UI gradients  |
| `expo-haptics`                              | Tactile feedback on button taps   |
| `expo-font`                                 | Custom Baloo 2 + Nunito fonts     |
| `expo-splash-screen`                        | Splash screen management          |
| `@react-native-async-storage/async-storage` | Local game save data              |
| `react-native-safe-area-context`            | Notch/camera safe zones           |
| `react-native-gesture-handler`              | Swipe gestures                    |
| `expo-in-app-purchases`                     | $7.99 premium purchase (StoreKit) |
| `@expo-google-fonts/baloo-2`                | Display font                      |
| `@expo-google-fonts/nunito`                 | Body font                         |

---

---

## 📬 Contact

- **Support:** support@kindredpal.com
- **Company:** KindredPal Inc., Florida, USA
- **App Store:** [Pal Feelings](https://appstoreconnect.apple.com/apps/6760982189)
- **Support page:** [sarahschoonmaker.github.io/palfeelings-privacy-page](https://sarahschoonmaker.github.io/palfeelings-privacy-page)

---

_Built with ❤️ by KindredPal — technology that brings people together_

```

```
