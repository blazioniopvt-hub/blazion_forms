#!/bin/sh
# Replace API URL placeholder with actual environment variable at runtime
find /app -type f -name "*.js" -exec sed -i "s|NEXT_PUBLIC_API_URL_PLACEHOLDER|${NEXT_PUBLIC_API_URL}|g" {} +
exec "$@"
