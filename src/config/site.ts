export const siteConfig = {
    name: "Home Land",
    description: "FiveM Server Management System",
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
        adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "/admin/dashboard",
    },
    social: {
        qq: {
            groupId: "952088232", // Updated from the URL found in code, formerly placeholder "12345678"
            link: "https://qun.qq.com/universal-share/share?ac=1&authKey=nvXhEH9tRp%2FUv62sCh3wRJl2st%2BpfEDClvn74m9ehcAMdvHd67%2Bx%2FChFweAQpeQp&busi_data=eyJncm91cENvZGUiOiI5NTIwODgyMzIiLCJ0b2tlbiI6ImdvSVdzcC9McnVveFY0YXBoSkk0OUVSUkJ1dHI4UlluMEg1eDEwVzh3OHluVFFCU1RNTDBFV0Y5Z2wrZGlaejAiLCJ1aW4iOiIxNTQ5NDI0MTkyIn0%3D&data=xW5PSMoCaFTqEt9j9u9HDmxR6FhBZn258c8vytqm3Lbq_5M5xfsxdO1NcHKhCcdxMRzEJ7r99Tor3-0kwbrBiw&svctype=4&tempid=h5_group_info",
        },
        kook: {
            link: "https://kook.vip/isBnUx",
        }
    },
    links: {
        fivemDownload: "https://fivem.net/",
    },
    game: {
        serverUrl: process.env.NEXT_PUBLIC_FIVEM_SERVER || "fivem://connect/localhost:30120",
    }
} as const;
