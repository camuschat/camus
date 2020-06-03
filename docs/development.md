# Development

Make is used to simplify and automate the build and test process.
The Makefile defines a number of commands for things like building artifacts, running server-side
and end-to-end tests, and running a development server or shell.
Run `make` or `make help` for a list of available commands:

```
$ make help
build                Build all Docker images, including for production, testing, and development
build-prod           Build Docker image for production
build-test-server    Build Docker image for testing the server
build-test-client    Build Docker image for testing the client
build-dev            Build Docker image for development environment
test                 Run all tests, both server-side and client-side
test-server          Run server tests
test-client          Run client tests
serve                Run development server
shell                Run development environment shell
clean                Remove Docker containers and images
clean-containers     Remove Docker containers
clean-images         Remove Docker images
```

> **Note:** You may have to run commands using `sudo` if your user is not in the `docker` group.
  Alternatively, [add your user][docker-non-root] to the `docker` group OR
  run Docker in [rootless mode][docker-rootless].

## Building

`make build` builds a set of Docker images, including images for production and development servers
as well as for running tests. A build should be performed initially when setting up the project,
when `requirements` change, or when an updated production image is needed.


## Testing

There are two different sets of tests: server tests, which are written in Python and use
[pytest][pytest-docs]; and end-to-end tests, which are written in JavaScript and run using
[Cypress][cypress-docs].
Each set of tests uses a different Docker image and can be run separately with `make test-server`
or `make test-client`, or all together by simply running `make test`.

Test containers mount the code from your local project directory, so you only need to rebuild the
testing images if `requirements` have changed.


## Development tools

You can run a development server available at `localhost:5000` using `make serve`. It can be useful
to tail the logs while the server is running:

```
$ make serve && docker logs -f rtc-chat-dev
```

You can run a development shell using `make shell`. This launches an interactive Docker container that
has all testing and development requirements installed.

As with testing containers, development containers mount the code from your local project directory,
so you only need to rebuild the development images if `requirements` have changed.


## Cleanup

Running `make clean` will remove all Docker containers and images that were created by `make build`
and other commands. If you only want to remove containers or images, use `make clean-containers` or
`make clean-images`, respectively.


[pytest-docs]: https://docs.pytest.org/en/latest/
[cypress-docs]: https://docs.cypress.io/
[docker-non-root]: https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
[docker-rootless]: https://docs.docker.com/engine/security/rootless/
