"use client";

import { useEffect, useState } from "react";

export type PlatformStyle = "ios" | "default";

export function usePlatformStyle() {
  const [platformStyle, setPlatformStyle] = useState<PlatformStyle>("default");

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const maxTouchPoints = window.navigator.maxTouchPoints;
    const isAppleTouch =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (platform === "MacIntel" && maxTouchPoints > 1);

    setPlatformStyle(isAppleTouch ? "ios" : "default");
  }, []);

  return platformStyle;
}

