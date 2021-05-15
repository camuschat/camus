Installation
============

Snap
----

Make sure you have `snapd`_ installed. Install `Camus`_:

::

   $ sudo snap install camus

Once installed, Camus runs automatically as a Snap service. See the Snap
`service management`_ documentation for details on starting and stopping
services.

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Pip
---

Camus requires `Python 3.7`_ or higher since it makes use of `Quart`_ and async
syntax. As usual, it's best to use a `virtual environment`_.

Install Camus:

::

   $ pip install camus-chat

Run Camus:

::

   $ camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Docker
------

You can find a `pre-built Docker image`_ on Docker Hub. Use the following
command to pull the image and run a container:

::

   $ docker run -d -p 5000:5000 camuschat/camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

.. _snapd: https://snapcraft.io/docs/installing-snapd
.. _Camus: https://snapcraft.io/camus
.. _service management: https://snapcraft.io/docs/service-management
.. _Python 3.7: https://docs.python.org/3.7/whatsnew/3.7.html
.. _Quart: https://gitlab.com/pgjones/quart
.. _virtual environment: https://docs.python.org/3/tutorial/venv.html
.. _pre-built Docker image: https://hub.docker.com/r/camuschat/camus
