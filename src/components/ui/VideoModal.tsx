"use client";

import { useMemo, useState } from "react";
import { AppModal } from "./AppModal";
import { AppButton } from "./AppButton";

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

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={title}
      description="Demonstração do exercício"
      maxWidth="max-w-[640px]"
    >
      <div className="space-y-4">
        <div className="aspect-video w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-black">
          {hasError ? (
            <div className="flex h-full min-h-48 items-center justify-center p-4 text-center">
              <p className="text-[14px] font-medium leading-[21px] text-[var(--muted)]">
                O vídeo integrado não carregou. Use a opção de abrir no YouTube.
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--muted)]">
            Se o vídeo demorar a carregar, abra diretamente no YouTube.
          </p>
          {videoSource.externalUrl ? (
            <a
              href={videoSource.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-2 text-[14px] font-bold text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            >
              Abrir no YouTube
            </a>
          ) : null}
        </div>

        <div className="pt-2">
          <AppButton variant="secondary" onClick={onClose} fullWidth>
            Fechar
          </AppButton>
        </div>
      </div>
    </AppModal>
  );
}
