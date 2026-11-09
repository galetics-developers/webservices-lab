# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.22.0
ARG PNPM_VERSION=10.28.0

# Etapa 1: base con el gestor de paquetes fijado a la versión del repositorio
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

# Etapa 2: dependencias. Solo se copian los manifiestos y el lockfile.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

# Etapa 3: compilación y empaquetado. pnpm deploy resuelve el enlace
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm --filter @wslab/shared build \
 && pnpm --filter @wslab/backend build \
 && pnpm --filter=@wslab/backend --prod deploy --legacy /out

# Etapa 4: ejecución. Sin gestor de paquetes, sin código fuente, sin
# herramientas de compilación y con un usuario sin privilegios.
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

RUN addgroup -S -g 10001 nodeapp && adduser -S -u 10001 -G nodeapp nodeapp

COPY --from=build --chown=nodeapp:nodeapp /out/node_modules ./node_modules
COPY --from=build --chown=nodeapp:nodeapp /out/dist ./dist
COPY --from=build --chown=nodeapp:nodeapp /out/package.json ./package.json

USER nodeapp
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "dist/main.js"]
