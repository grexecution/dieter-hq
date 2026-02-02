import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dieter HQ",
    short_name: "Dieter",
    description: "Homebase for Greg + Dieter (chat, tasks, calendar).",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#172D6C",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
