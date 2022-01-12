FROM node:alpine

ENV KIEBITZ_APPOINTMENTS_ENDPOINT=http://127.0.0.1:22222/jsonrpc
ENV KIEBITZ_STORAGE_ENDPOINT=http://127.0.0.1:11111/jsonrpc
ENV KIEBITZ_SETTINGS=/settings

WORKDIR /app

COPY . .

RUN npm ci --prefer-offline

ENTRYPOINT [ "npm" ]
CMD [ "test" ]

