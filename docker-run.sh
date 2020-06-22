#!/usr/bin/env bash

set -x

docker-run () {
    if [[ $(docker ps -a | grep camus) ]]; then
        docker stop camus && docker rm camus
    fi

    # Run in development mode
    docker run -d \
        --name camus \
        --mount type=bind,source="$(pwd)",target="/opt/camus"\
        -e QUART_APP=/opt/camus/app.py \
        -e QUART_ENV=development \
        -p 5000:5000 \
        camus \
        /usr/local/bin/quart run --host 0.0.0.0
}

docker-run
