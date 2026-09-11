import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { QrCodeService } from "@/service/QrCodeService";

if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the demo seed against a production environment.");
}

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });
const qrCodeService = new QrCodeService();

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
    return new Date(Date.now() - days * DAY_MS);
}

function daysFromNow(days: number) {
    return new Date(Date.now() + days * DAY_MS);
}

function randomBetween(fromDaysAgo: number, toDaysAgo: number) {
    const from = daysAgo(fromDaysAgo).getTime();
    const to = daysAgo(toDaysAgo).getTime();
    return new Date(from + Math.random() * (to - from));
}

function pick<T>(items: readonly T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

const DEMO_USERS = [
    { name: "Admin", email: "admin@shorturl.dev", password: "Str0ng!DevPassw0rd" },
    { name: "Ana Souza", email: "ana.souza@shortly.dev", password: "Demo@1234" },
    { name: "Bruno Lima", email: "bruno.lima@shortly.dev", password: "Demo@1234" },
    { name: "Marketing Team", email: "marketing@shortly.dev", password: "Demo@1234" },
];

const AUDIENCES = [
    { browser: "Chrome", os: "Windows", device: "desktop" },
    { browser: "Chrome", os: "Android", device: "mobile" },
    { browser: "Safari", os: "iOS", device: "mobile" },
    { browser: "Safari", os: "macOS", device: "desktop" },
    { browser: "Firefox", os: "Linux", device: "desktop" },
    { browser: "Edge", os: "Windows", device: "desktop" },
    { browser: "Samsung Internet", os: "Android", device: "mobile" },
] as const;

const LOCATIONS = [
    { country: "BR", city: "São Paulo" },
    { country: "BR", city: "Rio de Janeiro" },
    { country: "BR", city: "Curitiba" },
    { country: "PT", city: "Lisboa" },
    { country: "US", city: "New York" },
    { country: "AR", city: "Buenos Aires" },
] as const;

const REFERERS = [
    "https://www.instagram.com/",
    "https://www.facebook.com/",
    "https://www.google.com/",
    "https://www.newsletter.shortly.dev/",
    null,
] as const;

type DemoLink = {
    linkShort: string;
    linkOriginal: string;
    description: string;
    isActive: boolean;
    maxTimeValid: Date | null;
    clicks: number;
    clickWindow: [number, number];
};

const DEMO_LINKS: DemoLink[] = [
    {
        linkShort: "verao25",
        linkOriginal: "https://loja.exemplo.com/promocao-verao",
        description: "Campanha Verão 2025",
        isActive: true,
        maxTimeValid: null,
        clicks: 120,
        clickWindow: [45, 0],
    },
    {
        linkShort: "blackfri",
        linkOriginal: "https://loja.exemplo.com/black-friday",
        description: "Black Friday",
        isActive: true,
        maxTimeValid: daysFromNow(60),
        clicks: 95,
        clickWindow: [30, 0],
    },
    {
        linkShort: "insta-bio",
        linkOriginal: "https://loja.exemplo.com/linkbio",
        description: "Link da bio do Instagram",
        isActive: true,
        maxTimeValid: null,
        clicks: 60,
        clickWindow: [60, 0],
    },
    {
        linkShort: "youtube1",
        linkOriginal: "https://loja.exemplo.com/video-lancamento",
        description: "Descrição do vídeo de lançamento no YouTube",
        isActive: true,
        maxTimeValid: null,
        clicks: 40,
        clickWindow: [90, 0],
    },
    {
        linkShort: "outdoor1",
        linkOriginal: "https://loja.exemplo.com/outdoor-centro",
        description: "Outdoor Centro da cidade",
        isActive: true,
        maxTimeValid: null,
        clicks: 25,
        clickWindow: [120, 0],
    },
    {
        linkShort: "email-nl",
        linkOriginal: "https://loja.exemplo.com/newsletter",
        description: "Newsletter mensal",
        isActive: true,
        maxTimeValid: null,
        clicks: 15,
        clickWindow: [180, 0],
    },
    {
        linkShort: "natal24",
        linkOriginal: "https://loja.exemplo.com/natal-2024",
        description: "Campanha Natal (encerrada)",
        isActive: true,
        maxTimeValid: daysAgo(10),
        clicks: 18,
        clickWindow: [70, 11],
    },
    {
        linkShort: "pausado1",
        linkOriginal: "https://loja.exemplo.com/oferta-antiga",
        description: "Oferta pausada manualmente",
        isActive: false,
        maxTimeValid: null,
        clicks: 3,
        clickWindow: [150, 100],
    },
];

async function main() {
    console.log("Seeding demo data...");

    await db.delete(schema.linkClicks);
    await db.delete(schema.linksShorted);
    await db.delete(schema.users);

    const insertedUsers = await db
        .insert(schema.users)
        .values(
            await Promise.all(
                DEMO_USERS.map(async (user) => ({
                    name: user.name,
                    email: user.email,
                    passwordHash: hashPassword(user.password),
                })),
            ),
        )
        .returning();

    console.log(`Created ${insertedUsers.length} users.`);

    const insertedLinks = [];

    for (const link of DEMO_LINKS) {
        const qrCodeUrl = await qrCodeService.generateForShortCode(link.linkShort);

        const [created] = await db
            .insert(schema.linksShorted)
            .values({
                linkShort: link.linkShort,
                linkOriginal: link.linkOriginal,
                description: link.description,
                isActive: link.isActive,
                maxTimeValid: link.maxTimeValid,
                qrCodeUrl,
            })
            .returning();

        insertedLinks.push({ ...created, clicks: link.clicks, clickWindow: link.clickWindow });
    }

    console.log(`Created ${insertedLinks.length} links.`);

    const clickRows = insertedLinks.flatMap((link) =>
        Array.from({ length: link.clicks }, () => {
            const audience = pick(AUDIENCES);
            const location = pick(LOCATIONS);

            return {
                linkId: link.id,
                ipAddress: `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
                userAgent: `${audience.browser}/${audience.os}`,
                browser: audience.browser,
                os: audience.os,
                device: audience.device,
                referer: pick(REFERERS),
                country: location.country,
                city: location.city,
                clickedAt: randomBetween(link.clickWindow[0], link.clickWindow[1]),
            };
        }),
    );

    if (clickRows.length > 0) {
        await db.insert(schema.linkClicks).values(clickRows);
    }

    console.log(`Created ${clickRows.length} link clicks.`);
    console.log("Done.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await client.end();
    });
