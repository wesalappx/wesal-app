# Sound Files Setup Guide

This app uses sound effects. Add the following MP3 files to `/public/sounds/`:

## Required Sound Files

1. **click.mp3** - Subtle tap sound for button clicks (50-100ms)
2. **success.mp3** - Pleasant ding for successful actions (200-300ms)
3. **error.mp3** - Gentle error sound (150-250ms)
4. **swipe.mp3** - Smooth whoosh for transitions (200ms)
5. **notification.mp3** - Notification alert sound (300-500ms)

## Recommended Sources

### Free Sound Libraries (Royalty-Free)
- **Freesound.org** - https://freesound.org (CC0 license)
  - Search for: "ui click", "success", "error beep", "whoosh"
  
- **Zapsplat.com** - https://www.zapsplat.com (Free tier available)
  - UI Sounds section
  
- **Mixkit.co** - https://mixkit.co/free-sound-effects/
  - UI & Click Sounds

### Sound Specifications
- **Format**: MP3
- **Length**: Under 1 second (except notification)
- **Volume**: Normalized to -6dB (we control volume inCode)
- **File Size**: Under 50KB each

## Installation

1. Create folder: `/public/sounds/`
2. Download sound files from sources above
3. Rename files to match required names
4. Place in `/public/sounds/` folder

The sound system will automatically load these files and allow users to toggle them on/off in Settings.

## Alternative: Generate Placeholder Sounds

If you want to test without downloading sounds, you can use free online tools to generate simple tones:
- https://www.freesoundeffectsgenerator.com/
- Create short beep sounds for testing
