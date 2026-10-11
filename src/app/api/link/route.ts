import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { createLinkSchema } from "@/lib/models/link-shorted";
import { getCurrentUserId } from "@/lib/session";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkService } from "@/service/LinkService";
import { QrCodeService } from "@/service/QrCodeService";

const linkService = new LinkService(new LinkRepository(db), new QrCodeService());

/**
 * @swagger
 * /api/link:
 *   post:
 *     tags: [Link]
 *     summary: Cria um novo link curto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [linkOriginal]
 *             properties:
 *               linkOriginal:
 *                 type: string
 *                 format: uri
 *               linkShort:
 *                 type: string
 *                 description: Código customizado (3 a 10 caracteres). Se omitido, é gerado automaticamente.
 *               description:
 *                 type: string
 *               maxTimeValid:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Link criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       400:
 *         description: Dados inválidos
 *   get:
 *     tags: [Link]
 *     summary: Lista os links criados pelo usuário logado
 *     responses:
 *       200:
 *         description: Lista de links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Link'
 */
export async function POST(request: NextRequest) {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLinkSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const created = await linkService.createLink(parsed.data, userId);

    return NextResponse.json(created, { status: 201 });
}

export async function GET() {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await linkService.listLinks(userId);
    return NextResponse.json(links);
}
