Development
===========

Prerequisites
-------------

For development, you should have `Python`_ 3.7+, `Node.js`_, `Docker`_, and
`Make`_ installed.

Next, clone the project repo:

::

   $ git clone https://github.com/camuschat/camus.git

For Python development, it is best to set up a `virtual environment`_.

   **Note:** You can use a tool such as `Pipenv`_ or `virtualenvwrapper`_
   to make working with virtual environments easier.

Once your virtual environment is set up, install the Python development
requirements:

::

   $ pip install -r requirements/dev.txt

The client code is located in ``camus/static``.
Enter the directory and install dependencies using ``npm``:

::

   $ cd camus/static && npm install

Building static assets
----------------------

Camus uses `Babel`_ and `Webpack`_ for transpiling and packaging TypeScript
files. These tools are installed via ``npm`` in the Prerequisites step above.
Whenever TypeScript files located in ``camus/static/js`` are changed, they
must be re-packaged, which produces an output file in ``camus/static/dist``.
Fortunately, this can be done with a single command from the
``camus/static`` directory:

::

   $ cd camus/static && npm run build

To avoid having to run ``npm run build`` every time you make changes,
you can instead run the following, which will watch files for changes
and automatically rebuild them as needed:

::

   $ cd camus/static && npm run watch

Running client tests
--------------------

Tests for the client can be run with `Cypress`_. Open Cypress with:

::

   $ cd camus/static && npx cypress open

Running server tests
--------------------

Server tests use `pytest`_. From the project root directory, run:

::

   $ python -m pytest test

Using Make
----------

Make is used to simplify and automate the build and test process. The
`Makefile`_ defines a number of commands for things like building artifacts,
running server-side and end-to-end tests, and running a development server or
shell. Run ``make`` or ``make help`` for a list of available commands:

::

   $ make help
   build                Build all Docker images, including for production, testing, and development
   build-prod           Build Docker image for production
   build-test-server    Build Docker image for testing the server
   build-dev            Build Docker image for development environment
   test                 Run all tests, both server-side and client-side
   test-server          Run server tests
   test-client          Run client tests
   serve                Run development server
   shell                Run development environment shell
   package              Build Python source and wheel packages
   clean                Remove Docker containers & images and other files
   clean-containers     Remove Docker containers
   clean-images         Remove Docker images
   clean-files          Remove __pycache__ and files produced by packaging

..

   **Note:** You may have to run commands using ``sudo`` if your user is
   not in the ``docker`` group. Alternatively, `add your user`_
   to the ``docker`` group OR run Docker in `rootless mode`_.

Building
~~~~~~~~

``make build`` builds a set of Docker images, including images for
production and development servers as well as for running tests. A build
should be performed initially when setting up the project, when
``requirements`` change, or when an updated production image is needed.

Testing
~~~~~~~

There are two different sets of tests: server tests, which are written in
Python and use `pytest`_; and end-to-end tests, which are written in
TypeScript and run using `Cypress`_. Each set of tests uses a different Docker
image and can be run separately with ``make test-server`` or
``make test-client``, or all together by simply running ``make test``.

Test containers mount the code from your local project directory, so you only
need to rebuild the testing images if ``requirements`` have changed.

Development tools
~~~~~~~~~~~~~~~~~

You can run a development server available at ``localhost:5000`` using
``make serve``. It can be useful to tail the logs while the server is
running:

::

   $ make serve && docker logs -f camus-dev

You can run a development shell using ``make shell``. This launches an
interactive Docker container that has all testing and development
requirements installed.

As with testing containers, development containers mount the code from your
local project directory, so you only need to rebuild the development images if
``requirements`` have changed.

Cleanup
~~~~~~~

Running ``make clean`` will remove all Docker containers and images that were
created by ``make build`` and other commands. If you only want to remove
containers or images, use ``make clean-containers`` or ``make clean-images``,
respectively.

.. _Python: https://www.python.org/
.. _Node.js: https://nodejs.org/
.. _Docker: https://www.docker.com/
.. _Make: https://www.gnu.org/software/make/
.. _virtual environment: https://docs.python.org/3/tutorial/venv.html
.. _Pipenv: https://pipenv.pypa.io/en/latest/
.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/
.. _Babel: https://babeljs.io/
.. _Webpack: https://webpack.js.org/
.. _Cypress: https://docs.cypress.io/
.. _pytest: https://docs.pytest.org/en/latest/
.. _Makefile: https://github.com/camuschat/camus/blob/master/Makefile
.. _add your user: https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
.. _rootless mode: https://docs.docker.com/engine/security/rootless/
