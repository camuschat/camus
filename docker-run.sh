#!/usr/bin/env bash

set -x

docker-run () {
    if [[ $(docker ps -a | grep rtc-chat) ]]; then
        docker stop rtc-chat && docker rm rtc-chat
    fi

    # Run in development mode
    docker run -d \
        --name rtc-chat \
        --mount type=bind,source="$(pwd)",target="/opt/rtc-chat"\
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
        -p 5000:5000 \
        rtc-chat \
        /usr/local/bin/quart run --host 0.0.0.0
}

docker-run
