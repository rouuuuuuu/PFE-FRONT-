// Production environment — empty origin so nginx proxies /api/ → Django backend
// nginx.conf handles: location /api/ { proxy_pass http://host.docker.internal:8000; }
export const environment = {
  production: true,
  apiUrl: ''   // relative — nginx proxies /api/ to host.docker.internal:8000
};
