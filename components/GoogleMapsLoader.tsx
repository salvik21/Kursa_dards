"use client";

import { useEffect } from "react";
import { loadGoogleMaps } from "@/lib/maps";


export default function GoogleMapsLoader() {
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        window.dispatchEvent(new Event("google-maps-loaded"));
      })
      .catch((error) => {
        console.error("Failed to load Google Maps", error);
      });
  }, []);

  return null;
}