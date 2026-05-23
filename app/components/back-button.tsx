"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function BackButton({
  fallbackHref = "/dashboard-preview",
  label = "Volver",
}: BackButtonProps) {
  const router = useRouter();

  function onBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button type="button" className="btn btn-secondary back-button" onClick={onBack}>
      {label}
    </button>
  );
}

