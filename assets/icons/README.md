# Extension Icons

To add proper icons, replace these placeholder files with actual PNG images:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

For now, you can use any blue square icon with "AF" text or a magnifying glass symbol.

Quick generation with ImageMagick (if available):
```bash
convert -size 128x128 xc:#007bff -gravity center -pointsize 48 -fill white -annotate +0+0 "AF" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png
```
