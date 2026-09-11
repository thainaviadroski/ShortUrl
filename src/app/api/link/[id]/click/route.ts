import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { LinkClickRepository } from "@/repository/LinkClickRepository";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkClickService } from "@/service/LinkClickService";

const linkClickService = new LinkClickService(
    new LinkClickRepository(db),
    new LinkRepository(db),
);

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/link/{id}/click:
 *   get:
 *     tags: [LinkClick]
 *     summary: Lista os cliques de um link
 *     parameters:
 *       - $ref: '#/components/parameters/LinkId'
 *     responses:
 *       200:
 *         description: Lista de cliques
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LinkClick'
 *   post:
 *     tags: [LinkClick]
 *     summary: Registra um clique em um link
 *     description: User agent, IP e referer são lidos automaticamente dos headers da requisição.
 *     parameters:
 *       - $ref: '#/components/parameters/LinkId'
 *     responses:
 *       201:
 *         description: Clique registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkClick'
 *       404:
 *         description: Link não encontrado
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const clicks = await linkClickService.listClicksByLink(Number(id));
    return NextResponse.json(clicks);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;

    const forwardedFor = request.headers.get("x-forwarded-for");

    const created = await linkClickService.registerClick({
        linkId: Number(id),
        userAgent: request.headers.get("user-agent"),
        ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
        referer: request.headers.get("referer"),
        country: request.headers.get("x-vercel-ip-country"),
        city: request.headers.get("x-vercel-ip-city"),
    });

    if (!created) {
        return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    return NextResponse.json(created, { status: 201 });
}
