# PWA Icon Generation Guide

## Overview

Your app is now configured as a PWA (Progressive Web App). However, you need to create PNG icon files from the provided SVG template.

## Required Icon Sizes

- `icon-192x192.png` (192x192 pixels)
- `icon-256x256.png` (256x256 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## Option 1: Use Online Tool (Easiest)

1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload the `public/icon.svg` file
3. Download all generated sizes
4. Place them in the `public/` folder

## Option 2: Use Image Editing Software

1. Open `public/icon.svg` in:
   - **Figma/Adobe XD** (recommended for designers)
   - **Inkscape** (free, cross-platform)
   - **Adobe Illustrator**
2. Export as PNG at these sizes:

   - 192x192px → `icon-192x192.png`
   - 256x256px → `icon-256x256.png`
   - 384x384px → `icon-384x384.png`
   - 512x512px → `icon-512x512.png`

3. Save all files to `public/` folder

## Option 3: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert SVG to different PNG sizes
magick public/icon.svg -resize 192x192 public/icon-192x192.png
magick public/icon.svg -resize 256x256 public/icon-256x256.png
magick public/icon.svg -resize 384x384 public/icon-384x384.png
magick public/icon.svg -resize 512x512 public/icon-512x512.png
```

## Option 4: Customize the Icon

The provided SVG has:

- **Background**: Slate color (#1e293b) - matches your theme
- **Court/Field**: Green (#10b981) representing sports courts
- **Checkmark**: Indicates booking confirmation

Feel free to modify `public/icon.svg` with your own design before converting to PNG.

## Verifying PWA Setup

After creating the icons:

1. **Build the app**: `npm run build`
2. **Start production server**: `npm start`
3. **Open Chrome DevTools** (F12)
4. Go to **Application** tab → **Manifest**
5. Check that all icons load correctly
6. Test "Install App" button in browser address bar

## What's Already Configured

✅ PWA package installed (`@ducanh2912/next-pwa`)
✅ `next.config.js` configured with PWA wrapper
✅ `public/manifest.json` created with app metadata
✅ `src/app/layout.js` updated with PWA metadata
✅ Theme color set to #1e293b (slate)
✅ Service worker auto-generated (in production only)

## Features Enabled

- **Installable**: Users can install app on home screen
- **Offline-ready**: Basic caching for better performance
- **App shortcuts**: Dashboard and Book Court quick actions
- **Standalone mode**: Runs without browser chrome
- **Theme color**: Matches your app design

## Testing on Mobile

1. Build and deploy your app to a production URL (must be HTTPS)
2. Open in Chrome/Edge/Safari on mobile
3. Look for "Add to Home Screen" prompt
4. Install and test standalone mode

## Troubleshooting

**Icons not showing?**

- Check file names match exactly (case-sensitive)
- Verify files are in `public/` folder
- Clear browser cache and reload

**Service worker not registering?**

- Only works in production mode (`npm run build` then `npm start`)
- Disabled in development mode by default

**Install prompt not appearing?**

- Ensure app is served over HTTPS
- Check all icons are present
- Verify manifest.json loads without errors

## Next Steps

1. Create the PNG icons using one of the methods above
2. Test the PWA installation locally
3. Deploy to production and test on mobile devices
4. Consider adding splash screens for better UX
