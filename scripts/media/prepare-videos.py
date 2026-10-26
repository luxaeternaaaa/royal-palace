"""Prepare the complete supplied videos; originals are never modified."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess


# The user explicitly approved complete videos, including scenes with people.
CLIPS = [
    ("food-high", "0914(1).mp4", 5.0),
    ("food-mid", "0322 (2)(1).mp4", 3.0),
    ("food-classic", "0411 (1)(3).mp4", 3.7),
    ("food-memorial", "0531 (1).mp4", 2.0),
    ("hall-light", "IMG_8901.MOV", 4.8),
    ("hall-evening", "0820 (1).mp4", 14.0),
]


def run(command):
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise RuntimeError(result.stderr[-5000:])
    return result


def duration(ffmpeg, path):
    result = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise RuntimeError(f"Cannot read duration: {path}")
    hours, minutes, seconds = map(float, match.groups())
    return hours * 3600 + minutes * 60 + seconds, result.stderr


def prepare(clip, args):
    name, filename, poster_time = clip
    source = args.source_dir / filename
    video = args.work_dir / f"{name}.mp4"
    poster = args.work_dir / f"{name}.webp"
    source_duration, _ = duration(args.ffmpeg, source)
    assert 0 <= poster_time < source_duration, name
    print(f"Encoding {name}...", flush=True)
    run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         "-map", "0:v:0", "-map", "0:a:0", "-vf", "fps=30,setsar=1,format=yuv420p",
         "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-profile:v", "high",
         "-level:v", "4.0", "-maxrate", "5M", "-bufsize", "5M", "-threads", "2",
         "-c:a", "aac", "-b:a", "128k", "-map_metadata", "-1", "-map_chapters", "-1",
         "-movflags", "+faststart", str(video)])
    run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(poster_time),
         "-i", str(source), "-frames:v", "1", "-vf", "scale=720:1280:flags=lanczos,setsar=1",
         "-c:v", "libwebp", "-quality", "90", "-map_metadata", "-1", str(poster)])
    seconds, info = duration(args.ffmpeg, video)
    assert abs(seconds - source_duration) < 0.15, (name, seconds, source_duration)
    assert "h264 (High)" in info and "1080x1920" in info and "yuv420p" in info, info
    assert "30 fps" in info and "Audio: aac" in info, info
    assert "creation_time" not in info and "location" not in info, "Private source metadata must not be published"
    # A complete decode catches corrupt exports before they reach public/.
    run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(video), "-f", "null", "-"])
    print(f"Ready {name}: {seconds:.2f}s, {video.stat().st_size:,} bytes", flush=True)
    with source.open("rb") as original:
        source_hash = hashlib.file_digest(original, "sha256").hexdigest()
    return {"id": name, "source": filename, "source_sha256": source_hash,
            "full_source": True, "source_duration_seconds": source_duration,
            "poster_source_seconds": poster_time, "duration_seconds": seconds,
            "video_bytes": video.stat().st_size, "poster_bytes": poster.stat().st_size,
            "video_size": [1080, 1920], "poster_size": [720, 1280]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--work-dir", type=Path, required=True, help="Ignored staging directory for proofs and manifest")
    args = parser.parse_args()
    args.work_dir.mkdir(parents=True, exist_ok=True)
    assert args.source_dir.resolve() != args.output_dir.resolve(), "Do not overwrite original videos"
    with ThreadPoolExecutor(max_workers=2) as pool:
        manifest = list(pool.map(lambda clip: prepare(clip, args), CLIPS))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for entry in manifest:
        for extension in ("mp4", "webp"):
            filename = f"{entry['id']}.{extension}"
            shutil.copy2(args.work_dir / filename, args.output_dir / filename)
    (args.work_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Published {len(manifest)} reviewed clips and posters.", flush=True)


if __name__ == "__main__":
    main()
