"""Make full mobile derivatives of the existing public MP4s without touching them."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess


CLIPS = ("food-classic", "food-mid", "food-high", "food-memorial", "hall-light", "hall-evening")


def run(command):
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise RuntimeError(result.stderr[-5000:])
    return result.stderr


def inspect(ffmpeg, path):
    result = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise RuntimeError(f"Cannot read duration: {path}")
    hours, minutes, seconds = map(float, match.groups())
    return hours * 3600 + minutes * 60 + seconds, result.stderr


def sha256(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def prepare(name, args):
    source = args.video_dir / f"{name}.mp4"
    target = args.video_dir / f"{name}-mobile.mp4"
    source_hash = sha256(source)
    source_seconds, _ = inspect(args.ffmpeg, source)
    options = ["-map", "0:v:0", "-map", "0:a:0", "-vf", "scale=720:1280:flags=lanczos,setsar=1,format=yuv420p",
               "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-profile:v", "high", "-level:v", "3.1",
               "-maxrate", "1150k", "-bufsize", "1150k", "-g", "60", "-keyint_min", "60", "-sc_threshold", "0",
               "-threads", "2", "-c:a", "aac", "-b:a", "96k", "-map_metadata", "-1", "-map_chapters", "-1",
               "-movflags", "+faststart"]
    print(f"Encoding {name}...", flush=True)
    run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), *options, str(target)])
    seconds, info = inspect(args.ffmpeg, target)
    assert abs(seconds - source_seconds) < 0.05, (name, seconds, source_seconds)
    assert all(value in info for value in ("h264 (High)", "720x1280", "yuv420p", "30 fps", "Audio: aac")), info
    assert not re.search(r"creation_time|location|com.apple", info), info
    run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-xerror", "-i", str(target), "-f", "null", "-"])
    # Compare the entire decoded sequence after scaling the reference to the same size.
    quality = run([args.ffmpeg, "-hide_banner", "-i", str(source), "-i", str(target), "-lavfi",
                   "[0:v]scale=720:1280:flags=lanczos,setsar=1[ref];[ref][1:v]ssim", "-an", "-f", "null", "-"])
    ssim = float(re.findall(r"All:([\d.]+)", quality)[-1])
    atoms = []
    with target.open("rb") as file:
        while header := file.read(8):
            size, atom = struct.unpack(">I4s", header)
            assert size >= 8, (name, size)
            atoms.append(atom.decode("ascii"))
            file.seek(size - 8, 1)
    assert atoms.index("moov") < atoms.index("mdat"), atoms
    assert sha256(source) == source_hash, "Source changed"
    assert target.stat().st_size < source.stat().st_size * 0.5, name
    average_bps = round(target.stat().st_size * 8 / seconds)
    assert average_bps < 1_350_000, (name, average_bps)
    entry = {"id": name, "source": str(source.as_posix()), "source_sha256": source_hash,
             "output": str(target.as_posix()), "output_sha256": sha256(target), "full_source": True,
             "source_bytes": source.stat().st_size, "bytes": target.stat().st_size,
             "source_duration_seconds": source_seconds, "duration_seconds": seconds,
             "size": [720, 1280], "average_total_bps": average_bps, "ssim_all_frames": ssim,
             "faststart_atoms": atoms, "full_decode_passed": True, "ffmpeg_output_options": options}
    print(f"Ready {name}: {seconds:.2f}s, {entry['bytes']:,} bytes, SSIM {ssim:.4f}", flush=True)
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--video-dir", type=Path, default=Path("public/assets/videos"))
    parser.add_argument("--work-dir", type=Path, default=Path("output/deep-fixes/video"))
    args = parser.parse_args()
    args.work_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        clips = list(pool.map(lambda name: prepare(name, args), CLIPS))
    manifest = {"source_note": "Second-generation derivatives from the existing complete 1080x1920 H264/AAC public MP4s; supplied originals and posters were not changed.",
                "encoding": "H264 High 3.1, 720x1280, original 30fps/full duration; CRF25, slow, video VBV1150k/1150k, AAC96k, 2s GOP, faststart; source metadata and chapters removed.",
                "ffmpeg": subprocess.check_output([args.ffmpeg, "-version"], text=True).splitlines()[0],
                "clips": clips}
    (args.work_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
