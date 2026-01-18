FROM nginx:latest

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates
COPY certs/ /etc/nginx/certs/

# Expose ports
EXPOSE 80 443