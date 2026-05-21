"use client";

import { useEffect, useMemo, useRef } from "react";

type PreviewShadowContentProps = {
  css: string;
  html: string;
};

export function PreviewShadowContent({ css, html }: PreviewShadowContentProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const scopedCss = useMemo(
    () =>
      css
        .replace(/:root\b/g, ":host")
        .replace(/\bbody\b/g, ":host")
        .replace(/\b100vh\b/g, "100%"),
    [css],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `<style>${scopedCss}</style>${html}`;
  }, [html, scopedCss]);

  return <div ref={hostRef} style={{ flex: 1, minHeight: 0 }} />;
}

