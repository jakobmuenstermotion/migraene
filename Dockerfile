FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node begleiter.html sw.js icon-180.png companion-garden.js companion-garden.css ./
COPY --chown=node:node garden-modules ./garden-modules
COPY --chown=node:node garden-assets-webp ./garden-assets-webp
COPY --chown=node:node mondgarten ./mondgarten
COPY --chown=node:node server ./server
RUN mkdir -p /data && chown node:node /data
USER node
ENV PORT=8080 SYNC_DB_PATH=/data/mondgarten.sqlite
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/sync-server.mjs"]
