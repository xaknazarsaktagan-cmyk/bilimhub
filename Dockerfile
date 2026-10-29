# Статический сайт (Firebase — в облаке), раздаётся через nginx без root-прав.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend /usr/share/nginx/html
EXPOSE 8084
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q --spider http://127.0.0.1:8084/ || exit 1
