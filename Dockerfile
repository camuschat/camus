# builder
FROM python:3.9-alpine as builder
RUN apk add make
ADD . /app
WORKDIR /app
RUN make package


# prod
FROM python:3.9-alpine as prod
COPY --from=builder /app/dist/camus*.tar.gz /root
RUN pip install /root/camus*.tar.gz
CMD /usr/local/bin/hypercorn "camus:create_app()" --log-file - -b 0.0.0.0:5000
