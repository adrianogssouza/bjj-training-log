"use client";

import { useEffect, useMemo, useState } from "react";

type VideoModalProps = {
  title: string;
  videoUrl: string;
  onClose: () => void;
};

function getYoutubeVideoId(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? "";
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? "";
      }

      return url.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

function getVideoSource(videoUrl: string) {
  const trimmedUrl = videoUrl.trim();
  const youtubeId = getYoutubeVideoId(trimmedUrl);

  if (youtubeId) {
    return {
      kind: "youtube" as const,
      src: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`,
      externalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  return {
    kind: "file" as const,
    src: trimmedUrl,
    externalUrl: trimmedUrl,
  };
}

export function VideoModal({ title, videoUrl, onClose }: VideoModalProps) {
  const videoSource = useMemo(() => getVideoSource(videoUrl), [videoUrl]);
  const [hasError, setHasError] = useState(!videoSource.src);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/80 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
              Vídeo
            </p>
            <h2 className="mt-1 break-words text-lg font-black leading-6 text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-100 transition-colors hover:border-zinc-500"
          >
            Fechar
          </button>
        </div>

        <div className="aspect-video max-h-[40vh] w-full bg-black">
          {hasError ? (
            <div className="flex h-full min-h-48 items-center justify-center px-4 text-center">
              <p className="text-sm font-bold text-zinc-300">
                Vídeo indisponível
              </p>
            </div>
          ) : videoSource.kind === "youtube" ? (
            <iframe
              key={videoSource.src}
              title={title}
              src={videoSource.src}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setHasError(true)}
            />
          ) : (
            <video
              key={videoSource.src}
              src={videoSource.src}
              className="h-full w-full bg-black"
              controls
              playsInline
              onError={() => setHasError(true)}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-5 text-zinc-300">
            Se o vídeo não carregar, abra no YouTube.
          </p>
          {videoSource.externalUrl ? (
            <a
              href={videoSource.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-center rounded-lg border border-red-400 bg-red-500 px-4 text-sm font-bold text-white transition-colors hover:bg-red-400"
            >
              Abrir no YouTube
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
