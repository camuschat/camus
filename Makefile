.PHONY: build-prod
build-prod:
	docker build --target prod -t rtc-chat:prod -t rtc-chat:latest .

.PHONY: build-test-server
build-test-server:
	docker build --target test-server -t rtc-chat:test-server -t rtc-chat:latest .

.PHONY: build-test-client
build-test-client:
	sudo docker build --target test-client -t rtc-chat:test-client .

.PHONY: build-dev
build-dev:
	docker build --target dev -t rtc-chat:dev .

.PHONY: test-server
test-server:
	docker run --rm -d \
        --name rtc-chat-test \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
		rtc-chat:test-server \
        /bin/bash -c "pip install -e /opt/rtc-chat && python -m pytest /opt/rtc-chat" \
    && docker logs -f rtc-chat-test

.PHONY: test-client
test-client:
	docker run --rm -it \
        --mount type=bind,source="$(CURDIR)/test",target="/e2e" \
		--net host \
		-w /e2e \
		cypress/included:4.5.0

.PHONY: serve-dev
serve-dev:
	docker run --rm -d \
        --name rtc-chat-dev \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
        -p 5000:5000 \
        rtc-chat:dev \
        /usr/local/bin/quart run --host 0.0.0.0

.PHONY: shell
shell:
	docker run --rm -it \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -w /opt/rtc-chat \
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
		rtc-chat:dev \
        /bin/bash

.PHONY: clean
clean:
	- docker stop rtc-chat-dev
