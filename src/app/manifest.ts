import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dieter HQ",
    short_name: "Dieter",
    description: "Homebase for Greg + Dieter (chat, tasks, calendar).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#172D6C",
    orientation: "portrait-primary",
    categories: ["productivity", "lifestyle"],
    lang: "de",
    dir: "ltr",
    
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    screenshots: [
      {
        src: "/screenshots/chat.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
        label: "Chat interface"
      },
      {
        src: "/screenshots/calendar.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
        label: "Calendar view"
      },
      {
        src: "/screenshots/desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Desktop dashboard"
      }
    ],

    shortcuts: [
      {
        name: "Chat",
        short_name: "Chat",
        description: "Open chat interface",
        url: "/chat",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "View calendar",
        url: "/calendar",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Tasks",
        short_name: "Tasks",
        description: "Manage tasks",
        url: "/kanban",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],

    prefer_related_applications: false,
    
    // iOS-specific features
    display_override: ["window-controls-overlay", "standalone"],
    
    // Protocol handlers (optional, for future use)
    // protocol_handlers: [
    //   {
    //     protocol: "web+dieter",
    //     url: "/?handler=%s"
    //   }
    // ],

    // Share target (allows sharing to the app)
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "file",
            accept: ["image/*", "video/*", "audio/*", "application/pdf"],
          },
        ],
      },
    },
  };
}
