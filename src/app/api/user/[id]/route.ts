import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { updateUserSchema } from "@/lib/models/user";
import { UserRepository } from "@/repository/UserRepository";
import { UserService } from "@/service/UserService";

const userService = new UserService(new UserRepository(db));

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     tags: [User]
 *     summary: Busca um usuário pelo id
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *   put:
 *     tags: [User]
 *     summary: Atualiza um usuário
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *   delete:
 *     tags: [User]
 *     summary: Remove um usuário
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     responses:
 *       200:
 *         description: Usuário removido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const user = await userService.getUserById(Number(id));

    if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await userService.updateUser(Number(id), parsed.data);

    if (!updated) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const deleted = await userService.deleteUser(Number(id));

    if (!deleted) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(deleted);
}
