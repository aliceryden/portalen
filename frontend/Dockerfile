FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY bun.lockb* ./
RUN bun install

# Copy source code
COPY . .

EXPOSE 5174

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

