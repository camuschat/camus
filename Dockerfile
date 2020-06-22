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

ADD requirements.txt /app/
ADD ./requirements/ /app/requirements/
RUN pip install -r /app/requirements.txt


# prod
FROM base AS prod
ADD . /app
ENV QUART_APP camus
ENV QUART_ENV production
RUN pip install -r /app/requirements/production.txt
CMD /usr/local/bin/quart run --host 0.0.0.0


# test (server)
FROM prod AS test-server
ENV QUART_ENV development
RUN pip install -r /app/requirements/test.txt


# dev
FROM test-server AS dev
RUN apt-get update && apt-get install -y \
    vim

ENV QUART_ENV development
RUN pip install -r /app/requirements/dev.txt
