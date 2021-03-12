# builder
FROM python:3.9-alpine as builder
RUN apk update && \
    apk add --virtual .build-deps gcc musl-dev postgresql-dev && \
    pip install psycopg2 --no-cache-dir --no-deps --no-binary :all: && \
    apk --purge del .build-deps
RUN apk add make
ADD . /app
WORKDIR /app
RUN make package


# prod
FROM python:3.9-alpine as prod
ENV DATA_DIR="/var/lib/camus"
ENV DATABASE_URL="sqlite:///$DATA_DIR/camus.db"
ENV PORT=5000
RUN apk add postgresql-libs
COPY --from=builder /usr/local/lib/python3.9/site-packages/psycopg2 /usr/local/lib/python3.9/site-packages/psycopg2
RUN mkdir -p $DATA_DIR
COPY --from=builder /app/dist/camus*.tar.gz /root
RUN pip install /root/camus*.tar.gz
CMD /usr/local/bin/hypercorn "camus:create_app()" --log-file - -b 0.0.0.0:$PORT
