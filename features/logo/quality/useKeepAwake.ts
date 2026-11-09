import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useRef } from "react";

/** Keeps the demand-driven loop running for `seconds` from now. */
export function useKeepAwake() {
  const invalidate = useThree((s) => s.invalidate);
  const until = useRef(0);
  const awakeRef = useRef(true);
  useFrame(() => {
    const awake = performance.now() < until.current;
    awakeRef.current = awake;
    if (awake) invalidate();
  });
  const keepAwake = useCallback(
    (seconds: number) => {
      until.current = Math.max(until.current, performance.now() + seconds * 1000);
      awakeRef.current = true;
      invalidate();
    },
    [invalidate],
  );
  return { keepAwake, awakeRef };
}
