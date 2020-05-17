.DEFAULT_GOAL := help

images = rtc-chat:prod rtc-chat:latest rtc-chat:test-server rtc-chat:test-client rtc-chat:dev
containers = rtc-chat-dev

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: build
build: build-prod build-test-server build-test-client build-dev  ## Build all Docker images, including for production, testing, and development

.PHONY: build-prod
build-prod:  ## Build Docker image for production
	docker build --target prod -t rtc-chat:prod -t rtc-chat:latest .

.PHONY: build-test-server
build-test-server:  ## Build Docker image for testing the server
	docker build --target test-server -t rtc-chat:test-server -t rtc-chat:latest .

.PHONY: build-test-client
build-test-client:  ## Build Docker image for testing the client
	sudo docker build --target test-client -t rtc-chat:test-client .

.PHONY: build-dev
build-dev:  ## Build Docker image for development environment
	docker build --target dev -t rtc-chat:dev .

.PHONY: test
test: test-server test-client  ## Run all tests, both server-side and client-side

.PHONY: test-server
test-server:  ## Run server tests
	docker run --rm -d \
        --name rtc-chat-test \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
		rtc-chat:test-server \
        /bin/bash -c "pip install -e /opt/rtc-chat && python -m pytest /opt/rtc-chat" \
    && docker logs -f rtc-chat-test

.PHONY: test-client
test-client: clean-containers serve  ## Run client tests
	docker run --rm -it \
        --mount type=bind,source="$(CURDIR)/test",target="/e2e" \
		--net host \
		-w /e2e \
		cypress/included:4.5.0

.PHONY: serve
serve: clean-containers  ## Run development server
	docker run --rm -d \
        --name rtc-chat-dev \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
        -p 5000:5000 \
        rtc-chat:dev \
        /usr/local/bin/quart run --host 0.0.0.0

.PHONY: shell
shell:  ## Run development environment shell
	docker run --rm -it \
        --mount type=bind,source="$(CURDIR)",target="/opt/rtc-chat"\
        -w /opt/rtc-chat \
        -e QUART_APP=/opt/rtc-chat/app.py \
        -e QUART_ENV=development \
		rtc-chat:dev \
        /bin/bash

.PHONY: clean
clean: clean-containers clean-images  ## Remove Docker containers and images

.PHONY: clean-containers
clean-containers:  ## Remove Docker containers
	- docker stop $(containers)
	- docker container rm $(containers)

.PHONY: clean-images
clean-images:  ## Remove Docker images
	- docker image rm $(images)
