`landscape.mp4` is a synthetic, silent 640×360 H.264 test clip: green field with four distinct corner markers. It verifies native 16:9 framing and playback without using or cropping venue material. It is never copied to `public/` or `dist/`.

Generated with FFmpeg's `color` and `drawbox` filters, 10fps, four seconds, yuv420p, faststart. Browser tests substitute it only in the intercepted media module response.
