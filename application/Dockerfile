FROM oven/bun:latest AS builder

WORKDIR /application

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun run build

CMD ["bun", "run", "preview", "--host", "0.0.0.0"]