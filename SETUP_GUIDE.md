# Pattern Pals — React Native / Expo
## Complete Setup, Build & Submission Guide

---

## PROJECT STRUCTURE
```
PatternPals/
├── App.js                        ← Root navigation
├── app.json                      ← Expo config (bundle IDs etc)
├── eas.json                      ← EAS Build config
├── package.json                  ← Dependencies
├── babel.config.js
├── assets/
│   ├── icon.png                  ← 1024×1024 app icon (YOU MUST CREATE)
│   ├── splash.png                ← 1284×2778 splash screen (YOU MUST CREATE)
│   └── adaptive-icon.png         ← 1024×1024 Android adaptive icon
└── src/
    ├── data/gameData.js           ← All game content
    ├── hooks/useStorage.js        ← AsyncStorage save/load
    ├── utils/theme.js             ← Colors, fonts, spacing
    ├── components/UI.js           ← Shared Button, Card, Pill etc
    └── screens/
        ├── HomeScreen.js          ← Home with daily challenge + modes
        ├── GameScreen.js          ← Core gameplay (all modes)
        ├── PalSelectScreen.js     ← Character collection
        ├── ParentScreen.js        ← Parent dashboard + SEL skills
        └── JournalScreen.js       ← Emotion journal
```

---

## STEP 1 — PREREQUISITES (do this first)

### Accounts you need:
- [ ] Apple Developer Account — $99/year at developer.apple.com
- [ ] Google Play Console — $25 one-time at play.google.com/console
- [ ] Expo account — free at expo.dev

### Software on your Mac/PC:
- Node.js 20+ (nodejs.org)
- npm or yarn
- Expo CLI + EAS CLI

```bash
npm install -g expo-cli eas-cli
```

---

## STEP 2 — INSTALL & RUN LOCALLY

```bash
cd PatternPals
npm install

# Start development server
npm start

# Test on iOS simulator (Mac only)
npm run ios

# Test on Android
npm run android
```

Scan the QR code with the **Expo Go** app on your phone to test instantly.

---

## STEP 3 — CREATE YOUR ASSETS

You need to create these image files before building:

**icon.png** — 1024×1024px, no rounded corners (Apple adds them)
- Use Canva, Figma, or Adobe Express
- Show the 🐾 paw + colorful background
- No transparent background — use solid color #e8f4fd

**splash.png** — 1284×2778px
- Simple centered logo on #e8f4fd background
- Text: "Pattern Pals" + "Echo Pals Edition"

**adaptive-icon.png** — 1024×1024px (same as icon, Android uses this)

Put all 3 files in the `assets/` folder.

---

## STEP 4 — CONFIGURE YOUR IDs

Edit `app.json` — replace these values:
```json
"bundleIdentifier": "com.kindredpal.patternpals"   ← your bundle ID
"package": "com.kindredpal.patternpals"            ← same for Android
```

Edit `eas.json` — replace these values:
```json
"appleId": "your-apple-id@email.com"
"ascAppId": "your-app-store-connect-app-id"
"appleTeamId": "your-apple-team-id"
```

---

## STEP 5 — SET UP EAS BUILD

```bash
# Login to Expo
eas login

# Configure EAS for your project
eas build:configure

# This creates your project on expo.dev and sets up credentials
```

---

## STEP 6 — BUILD FOR PRODUCTION

```bash
# Build for BOTH stores (recommended)
npm run build:all

# Or build individually:
npm run build:ios      # Creates .ipa for App Store
npm run build:android  # Creates .aab for Play Store
```

EAS Build runs on Expo's cloud servers — takes 10-20 minutes.
You'll get download links when complete.

**iOS build requirements:**
- Apple Developer account connected
- EAS manages certificates and provisioning profiles automatically

**Android build requirements:**
- No extra setup for first build
- EAS generates and manages your signing keystore

---

## STEP 7 — APP STORE CONNECT SETUP (iOS)

1. Go to appstoreconnect.apple.com
2. Click "+" → New App
3. Fill in:
   - **Name:** Pattern Pals: Echo Pals
   - **Bundle ID:** com.kindredpal.patternpals
   - **SKU:** patternpals-001
   - **Primary Language:** English

### App Store Listing (copy-paste ready):

**Subtitle (30 chars):** Real Friends. Shared Values.

**Description:**
```
Pattern Pals: Echo Pals is the memory game that secretly teaches kids about feelings.

Watch your Pal show you a sequence of emotions — Happy, Silly, Brave, Scared and more — then echo them back in order! The sequences get longer, faster, and trickier as you level up.

WHAT MAKES ECHO PALS DIFFERENT:
Unlike tile-matching games, Pattern Pals teaches Social-Emotional Learning (SEL) — the #1 skill set schools now measure. Every game session builds working memory AND emotional vocabulary simultaneously. Nothing else on the App Store does this.

4 GAME MODES:
🧠 Classic — Watch the emotional sequence and echo it back
⚡ Speed — Beat the countdown timer 
🪞 Mirror — Reverse the sequence for an extra challenge
📖 Story — Help your Pal express their feelings in a story

9 PALS TO UNLOCK:
Start with Panda, then unlock Fox, Bunny, Cat, Bear, Owl, Lion, Dragon, and the legendary Unicorn as your XP grows!

FOR PARENTS:
The Parent Dashboard shows your child's progress in 5 key SEL skills:
- Emotional Recognition
- Working Memory  
- Self-Regulation
- Empathy
- Attention & Focus

NO ADS. NO IN-APP PURCHASES. No data collected.
A completely safe, screen-time-worthy experience parents can trust.

BACKED BY RESEARCH:
Working memory games improve short-term recall, focus, and academic performance. Emotional recognition skills reduce anxiety and improve social relationships. Pattern Pals combines both.

Perfect for ages 6-12, enjoyable by all ages.
```

**Keywords (100 chars max):**
```
memory game kids,emotional learning,SEL,brain training,pattern,feelings,educational
```

**Categories:**
- Primary: Games → Educational
- Secondary: Education

**Age Rating:** 4+

**Privacy:** No data collected (select all "No" in privacy questionnaire)

---

## STEP 8 — GOOGLE PLAY SETUP

1. Go to play.google.com/console
2. Create app:
   - **App name:** Pattern Pals Echo Pals
   - **Default language:** English (US)
   - **App or game:** Game
   - **Free or paid:** Free

3. Complete all sections in "Set up your app"
4. Upload your .aab file to Internal Testing first
5. Test on a real Android device
6. Promote to Production when ready

**Content rating:** Complete the questionnaire → rates as "Everyone"

---

## STEP 9 — SUBMIT

```bash
# Submit to App Store (after build is complete)
npm run submit:ios

# Submit to Google Play
npm run submit:android
```

**Apple review:** 24-48 hours typically
**Google review:** 24 hours typically

---

## STEP 10 — APPLE APPROVAL TIPS

Apple rejects ~35% of apps. Here's how to avoid rejection:

✅ **Privacy policy required** — Create one free at app-privacy-policy-generator.firebaseapp.com
✅ **No misleading claims** — Don't say "proven to improve memory" without citation
✅ **Fully functional** — All buttons must work, no placeholder content
✅ **Kids category rules** — No ads, no links to external sites, no social features, no data collection (you're already good)
✅ **Screenshots** — 6.7" iPhone screenshots required (use simulator or Canva)

**If rejected:** Apple tells you exactly why. Fix and resubmit. Most rejections are minor.

---

## MONETIZATION (add later)

When you're ready to monetize, add:
```bash
npm install expo-in-app-purchases
```

Suggested IAP items:
- "Remove Ads" — $2.99 (no ads to remove, so offer "Support the Pals" instead)
- "Pal Pack 1" — $1.99 (unlock Dragon + Unicorn early)
- "Classroom Edition" — $4.99/month (teacher dashboard, class codes)

---

## UPDATING THE APP

For small fixes (no new native code):
```bash
# Push OTA update — no App Store review needed!
npx expo publish
```

For major updates:
```bash
npm run build:all
# Then resubmit via App Store Connect / Play Console
```

---

## SUPPORT & NEXT STEPS

- **Expo docs:** docs.expo.dev
- **EAS Build docs:** docs.expo.dev/build/introduction
- **App Store Connect:** appstoreconnect.apple.com
- **Google Play Console:** play.google.com/console

Questions? The Expo Discord (discord.gg/expo) is extremely helpful.

---

## YOUR BUNDLE ID: com.kindredpal.patternpals
## YOUR APP NAME: Pattern Pals: Echo Pals
## TARGET AGE: 6-12 (rated 4+ for all ages)
## PRICE: Free
## MONETIZATION: IAP (add in v1.1)
