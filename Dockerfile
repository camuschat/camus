# base
FROM python:3.8-slim-buster AS base

RUN apt-get update && apt-get install -y \
    gcc \
    libavdevice-dev \
    libavfilter-dev \
    libopus-dev \
    libvpx-dev \
    pkg-config \
    python-dev

ADD . /app


# prod
FROM base AS prod
ENV QUART_APP /app/app.py
ENV QUART_ENV production
RUN pip install -r /app/requirements/production.txt
CMD /usr/local/bin/quart run --host 0.0.0.0


# test (server)
FROM prod AS test-server
ENV QUART_ENV development
RUN pip install -r /app/requirements/test.txt


# test (client)
FROM node:12.16-slim AS test-client
RUN npm install cypress


# dev
FROM test-server AS dev
ENV QUART_ENV development
RUN pip install -r /app/requirements/dev.txt
