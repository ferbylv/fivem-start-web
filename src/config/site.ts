export const siteConfig = {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "Home Land",
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "FiveM Server Management System",
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
        adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "/admin/dashboard",
    },
    social: {
        qq: {
            groupId: process.env.NEXT_PUBLIC_QQ_GROUP_ID || "952088232",
            link: process.env.NEXT_PUBLIC_QQ_LINK || "",
        },
        kook: {
            link: process.env.NEXT_PUBLIC_KOOK_LINK || "",
        }
    },
    links: {
        fivemDownload: process.env.NEXT_PUBLIC_FIVEM_DOWNLOAD_URL || "https://fivem.net/",
        mustWatch: process.env.NEXT_PUBLIC_MUST_WATCH_URL || "https://example.com/must-watch", // TODO: Replace with actual URL
        rules: process.env.NEXT_PUBLIC_RULES_URL || "https://example.com/rules", // TODO: Replace with actual URL
    },
    game: {
        serverUrl: process.env.NEXT_PUBLIC_FIVEM_SERVER || "fivem://connect/localhost:30120",
    }
} as const;
