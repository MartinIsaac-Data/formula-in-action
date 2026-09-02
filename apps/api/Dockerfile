# syntax=docker/dockerfile:1

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# ---- install + build the whole workspace ----
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @formula-in-action/api... build
# Bundle the API + its workspace deps into a self-contained dir.
RUN pnpm --filter @formula-in-action/api deploy --prod /app

# ---- runtime ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
USER node
EXPOSE 8787
CMD ["node", "dist/index.js"]
