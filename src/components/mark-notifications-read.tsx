"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/app/mi-cuenta/actions";

/** Cuando el usuario ve sus avisos, los marca como leídos (sin recargar la página). */
export function MarkNotificationsRead() {
  useEffect(() => {
    void markNotificationsRead();
  }, []);
  return null;
}
