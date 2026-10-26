"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import logo from "@/public/brand/fiu-logo.png";

const LogoScene = dynamic(
  () => import("./LogoScene").then((m) => m.LogoScene),
  { ssr: false },
);

type Props = {
  /** Background still used for glass refraction when WebGL is up. */
  backdropSrc?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
};

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
  } catch {
    return false;
  }
}

/**
 * Homescreen mark: flat white PNG always (SEO / no-JS / failure), with the live
 * transmission-glass GLB layered on top when WebGL is available.
 */
export function FiuLogo({
  backdropSrc,
  className = "h-auto w-[80vw] max-w-[640px] md:w-[42vw]",
  sizes = "(min-width: 768px) 42vw, 80vw",
  priority = true,
  alt = "Fíu",
}: Props) {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setWebgl(canUseWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onSceneError = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  const showScene = webgl && !failed;

  return (
    <span className={`relative inline-block ${className}`}>
      <Image
        src={logo}
        alt={alt}
        priority={priority}
        sizes={sizes}
        className={`h-auto w-full transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {showScene ? (
        <span
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          <SceneErrorBoundary onError={onSceneError}>
            <LogoScene backdropSrc={backdropSrc} reduceMotion={reduceMotion} onReady={onReady} />
          </SceneErrorBoundary>
        </span>
      ) : null}
    </span>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { err: boolean }
> {
  state = { err: false };

  static getDerivedStateFromError() {
    return { err: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    if (this.state.err) return null;
    return this.props.children;
  }
}
