FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y \
    gcc \
    libavdevice-dev \
    libavfilter-dev \
    libopus-dev \
    libvpx-dev \
    pkg-config \
    python-dev

ADD . /app

RUN pip install -r /app/requirements.txt
