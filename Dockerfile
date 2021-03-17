# builder
FROM python:3.9-alpine as builder
RUN apk add make
ADD . /app
WORKDIR /app
RUN make package


# prod
FROM python:3.9-alpine as prod
ENV DATA_DIR="/var/lib/camus"
ENV DATABASE_URL="sqlite:///$DATA_DIR/camus.db"
ENV PORT=5000
RUN mkdir -p $DATA_DIR
RUN apk update && apk add postgresql-libs
COPY --from=builder /app/dist/camus*.tar.gz /root
RUN apk update && \
    apk add --virtual .build-deps build-base postgresql-dev && \
    pip install psycopg2 --no-cache-dir --no-deps --no-binary :all: && \
    pip install /root/camus*.tar.gz && \
    apk --purge del .build-deps
CMD /usr/local/bin/hypercorn "camus:create_app()" --log-file - -b 0.0.0.0:$PORT
