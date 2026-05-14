FROM node:22-slim AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# Bake a cardano-dev-skills snapshot into the image so the container is
# self-contained for local `docker run` use and so MCP-server pods can
# serve get_skill / prompts without an init container.
# In K8s, the weekly CronJob uses an init container to clone a fresher
# checkout into a per-job emptyDir — see k8s/cronjob-ingest.yaml.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/easy1staking-com/cardano-dev-skills.git /skills-snapshot

FROM node:22-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist dist/
COPY --from=builder /skills-snapshot /app/skills

ENV SKILLS_PATH=/app/skills

RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
