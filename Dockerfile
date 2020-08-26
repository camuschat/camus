# builder
FROM python:3.8-alpine as builder
RUN apk add make
ADD . /app
WORKDIR /app
RUN make package


# prod
FROM python:3.8-alpine as prod
ENV QUART_APP camus
ENV QUART_ENV production
COPY --from=builder /app/dist/camus*.tar.gz /root
RUN pip install /root/camus*.tar.gz
CMD /usr/local/bin/hypercorn camus --log-file - -b 0.0.0.0:5000
