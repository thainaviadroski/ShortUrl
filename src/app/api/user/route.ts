import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { createUserSchema } from "@/lib/validations/user";
import { UserRepository } from "@/repository/UserRepository";
import { UserService } from "@/service/UserService";

const userService = new UserService(new UserRepository(db));

/**
 * @swagger
 * /api/user:
 *   post:
 *     tags: [User]
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Senha em texto puro; é hasheada antes de ser persistida e nunca retorna nas respostas.
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *   get:
 *     tags: [User]
 *     summary: Lista todos os usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const created = await userService.createUser(parsed.data);

    return NextResponse.json(created, { status: 201 });
}

export async function GET() {
    const users = await userService.listUsers();
    return NextResponse.json(users);
}
