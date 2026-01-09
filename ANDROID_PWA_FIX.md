# PWA Android Fix Guide

## Critical Issue: Maskable Icons

Your current icons likely don't have the proper "safe zone" padding required for Android's adaptive icons. I've created a new `icon-maskable.svg` with 10% safe zone padding.

## Convert the Maskable Icon

You **must** create a new maskable icon from `public/icon-maskable.svg`:

### Option 1: Online Tool (Fastest)

1. Go to https://realfavicongenerator.net/ or https://maskable.app/editor
2. Upload `public/icon-maskable.svg`
3. Preview how it looks as a circle/rounded square
4. Download and **replace** your existing `icon-192x192.png` and `icon-512x512.png`

### Option 2: ImageMagick Command

```bash
magick public/icon-maskable.svg -resize 192x192 public/icon-192x192.png
magick public/icon-maskable.svg -resize 512x512 public/icon-512x512.png
```

## What I've Fixed

✅ **Added Custom Install Button**

- Created `src/lib/useInstallPrompt.js` hook
- Created `src/components/InstallPrompt.js` component
- Added to public layout - shows a custom install prompt

✅ **Updated Manifest**

- Added screenshot entry (temporary using icon)
- Kept both "any" and "maskable" purpose entries

✅ **Enhanced Meta Tags**

- Added `mobile-web-app-capable`
- Added `apple-mobile-web-app-capable`
- Proper manifest link

## Testing Steps

### 1. Replace Icons (IMPORTANT!)

Convert `icon-maskable.svg` to PNG and replace the existing icon files.

### 2. Rebuild & Deploy

```bash
npm run build
git add .
git commit -m "Add maskable icons and custom install prompt"
git push
```

### 3. Clear Chrome Data on Phone

- Chrome → Settings → Site Settings → All Sites
- Find your domain → Clear & Reset

### 4. Debug on Phone (If Still Not Working)

1. Connect phone via USB
2. Enable USB Debugging on phone
3. Go to `chrome://inspect/#devices` on laptop
4. Open your site on phone
5. Click "Inspect" on laptop
6. Go to Application tab → Manifest
7. Check for **red errors** in "Installability" section

## Common Android Issues

### 1. Icon Not Maskable

❌ Problem: Icon gets cut off in circles/squares
✅ Solution: Use the new `icon-maskable.svg` with safe zone padding

### 2. No HTTPS in Development

❌ Problem: Testing on phone with `http://your-laptop-ip:3000`
✅ Solution: Use your deployed Vercel URL for testing

### 3. Chrome Silenced the Prompt

❌ Problem: User dismissed it once, won't show again
✅ Solution: Clear site data or use the custom InstallPrompt component

### 4. Missing Required Fields

❌ Problem: Manifest missing start_url, scope, or valid icons
✅ Solution: Already fixed in your manifest.json

## Custom Install Button

The custom install prompt will appear automatically when:

- User visits the site
- PWA is installable (all criteria met)
- User hasn't dismissed it
- App is not already installed

Users can click "Install" instead of waiting for Chrome's prompt.

## Checking Installability

On Android Chrome:

1. Visit your site: `https://your-domain.vercel.app`
2. Wait 30 seconds while browsing
3. Look for:
   - Custom install prompt at bottom (from the component)
   - Chrome menu (⋮) → "Install app" or "Add to Home screen"
   - Banner at bottom of page (Chrome's native prompt)

## What Makes It Installable

- ✅ Served over HTTPS (Vercel provides this)
- ✅ Valid manifest.json with name, icons, start_url
- ✅ Service worker registered (next-pwa handles this)
- ✅ Icons with "maskable" purpose
- ✅ Screenshot (added temporary one)
- ✅ User engagement signals (visits/time on site)

## Screenshots (Optional Enhancement)

For the best install experience, create actual screenshots:

1. Take screenshots of your app on mobile (1080x1920 or similar)
2. Save as `public/screenshot-mobile.png`
3. Update manifest.json to use real screenshot instead of icon
4. Add desktop screenshot (1920x1080) for wider form factor

This gives users a preview of the app before installing.

## Next Steps

1. **Convert the maskable SVG to PNG** (most important!)
2. Build and deploy
3. Test on Android after clearing Chrome data
4. Use `chrome://inspect` if it still doesn't work

The custom install button gives you a fallback - even if Chrome's automatic prompt doesn't appear, users can still install via your custom UI.
