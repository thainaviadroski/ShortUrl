import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { AnalyticsRepository } from "@/repository/AnalyticsRepository";
import { AnalyticsService } from "@/service/AnalyticsService";

const analyticsService = new AnalyticsService(new AnalyticsRepository(db));

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Retorna um resumo de analytics de cliques
 *     parameters:
 *       - name: days
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Janela de dias considerada no gráfico de cliques por dia
 *       - name: months
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Janela de meses considerada no gráfico de cliques por mês
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Quantidade de links no ranking de top links
 *     responses:
 *       200:
 *         description: Resumo de analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                 totalLinks:
 *                   type: integer
 *                 clicksByDay:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 clicksByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 topLinks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linkId:
 *                         type: integer
 *                       linkShort:
 *                         type: string
 *                       linkOriginal:
 *                         type: string
 *                       clicks:
 *                         type: integer
 *                 topCities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 breakdown:
 *                   type: object
 *                   properties:
 *                     browser:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     os:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     device:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     country:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 */
export async function GET(request: NextRequest) {
    const days = Number(request.nextUrl.searchParams.get("days") ?? 30);
    const months = Number(request.nextUrl.searchParams.get("months") ?? 12);
    const topLinksLimit = Number(request.nextUrl.searchParams.get("limit") ?? 5);

    const overview = await analyticsService.getOverview({ days, months, topLinksLimit });

    return NextResponse.json(overview);
}
