Installation
============

Using Snap
----------

Make sure you have `snapd`_ installed. Install `Camus`_:

::

   $ sudo snap install camus

Run Camus:

::

   $ camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Using Python
------------

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

Using Docker
------------

You can find a `pre-built Docker image`_ on Docker Hub. Use the following
command to pull the image and run a container:

::

   $ docker run -d -p 5000:5000 mrgnr/camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

.. _snapd: https://snapcraft.io/docs/installing-snapd
.. _Camus: https://snapcraft.io/camus
.. _Python 3.7: https://docs.python.org/3.7/whatsnew/3.7.html
.. _Quart: https://gitlab.com/pgjones/quart
.. _virtual environment: https://docs.python.org/3/tutorial/venv.html
.. _pre-built Docker image: https://hub.docker.com/r/mrgnr/camus
