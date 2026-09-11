import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { updateLinkSchema } from "@/lib/validations/link-shorted";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkService } from "@/service/LinkService";
import { QrCodeService } from "@/service/QrCodeService";

const linkService = new LinkService(new LinkRepository(db), new QrCodeService());

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/link/{id}:
 *   get:
 *     tags: [Link]
 *     summary: Busca um link pelo id
 *     parameters:
 *       - $ref: '#/components/parameters/LinkId'
 *     responses:
 *       200:
 *         description: Link encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       404:
 *         description: Link não encontrado
 *   put:
 *     tags: [Link]
 *     summary: Atualiza um link
 *     parameters:
 *       - $ref: '#/components/parameters/LinkId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               linkOriginal:
 *                 type: string
 *                 format: uri
 *               linkShort:
 *                 type: string
 *               description:
 *                 type: string
 *               maxTimeValid:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Link atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Link não encontrado
 *   delete:
 *     tags: [Link]
 *     summary: Remove um link
 *     parameters:
 *       - $ref: '#/components/parameters/LinkId'
 *     responses:
 *       200:
 *         description: Link removido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       404:
 *         description: Link não encontrado
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const link = await linkService.getLinkById(Number(id));

    if (!link) {
        return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    return NextResponse.json(link);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLinkSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await linkService.updateLink(Number(id), parsed.data);

    if (!updated) {
        return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const deleted = await linkService.deleteLink(Number(id));

    if (!deleted) {
        return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    return NextResponse.json(deleted);
}
