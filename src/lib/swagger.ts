import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Short URL API",
        version: "1.0.0",
        description:
          "API para criação e gerenciamento de links curtos, usuários e analytics de cliques.",
      },
      components: {
        parameters: {
          LinkId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Id numérico do link",
          },
          UserId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Id numérico do usuário",
          },
        },
        schemas: {
          Link: {
            type: "object",
            properties: {
              id: { type: "integer" },
              linkOriginal: { type: "string", format: "uri" },
              linkShort: { type: "string" },
              maxTimeValid: { type: "string", format: "date-time", nullable: true },
              description: { type: "string", nullable: true },
              isActive: { type: "boolean" },
              qrCodeUrl: { type: "string", nullable: true },
              created: { type: "string", format: "date-time" },
            },
          },
          LinkClick: {
            type: "object",
            properties: {
              id: { type: "integer" },
              linkId: { type: "integer" },
              ipAddress: { type: "string", nullable: true },
              userAgent: { type: "string", nullable: true },
              browser: { type: "string", nullable: true },
              os: { type: "string", nullable: true },
              device: { type: "string", nullable: true },
              referer: { type: "string", nullable: true },
              country: { type: "string", nullable: true },
              clickedAt: { type: "string", format: "date-time" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string", nullable: true },
              email: { type: "string", format: "email" },
              image: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  });
}
