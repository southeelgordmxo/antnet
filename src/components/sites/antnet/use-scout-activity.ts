"use client";
import { useEffect, useState } from "react";
import type { Colony } from "./antnet";
import { scoutActivity } from "../../../lib/scout-activity";

export function useScoutActivity(colony: Colony, antId = "") {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return { ...scoutActivity(colony, now, antId), now };
}
