Camus
=====

|Build Status| |docs| |PyPI| |Docker Hub| |License|

Camus is a group video chat app that uses `WebRTC`_ for direct peer-to-peer
communication. Users can create and join rooms, stream audio and video with
a microphone and webcam, share their screen, and send text messages.
You can try a demo at https://camus.chat, or run your own server using
`Snap`_, `pip`_, `Docker`_, or `Heroku`_.

Features
--------

- Create public or private rooms, optionally with a password and guest limit
- Stream audio & video
- Share your desktop
- Send text messages
- Control video feeds -- set your camera resolution, toggle fullscreen or picture-in-picture, disable incoming video
- Configure custom STUN and TURN servers
- Responsive user interface that works on large or small screens

.. image:: https://raw.githubusercontent.com/camuschat/camus/master/screenshots/0.2.0.png

Installation
------------

Snap
~~~~

Make sure you have `snapd`_ installed. Install `Camus`_:

::

   $ sudo snap install camus

Once installed, Camus runs automatically as a Snap service. See the Snap
`service management`_ documentation for details on starting and stopping
services.

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Pip
~~~

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
~~~~~~

You can find a `pre-built Docker image`_ on Docker Hub. Use the following
command to pull the image and run a container:

::

   $ docker pull camuschat/camus
   $ docker run -d -p 5000:5000 camuschat/camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.


Heroku
~~~~~~

|Deploy to Heroku|

Simply click the button above or see the `deployment documentation`_ for
detailed instructions.


Documentation
-------------

See the official documentation at https://docs.camus.chat for more information
about configuring and running Camus.

Contributing
------------

If you want to make a contribution, please read the `Contributing`_ guidelines
first.

.. |Build Status| image:: https://travis-ci.com/camuschat/camus.svg?branch=master
   :target: https://travis-ci.com/camuschat/camus
.. |docs| image:: https://img.shields.io/readthedocs/camus/latest
   :target: https://docs.camus.chat
.. |PyPI| image:: https://img.shields.io/pypi/v/camus-chat?color=blue
   :target: https://pypi.org/project/camus-chat
.. |Docker Hub| image:: https://img.shields.io/docker/pulls/camuschat/camus
   :target: https://hub.docker.com/r/camuschat/camus
.. |License| image:: https://img.shields.io/github/license/camuschat/camus?color=green
   :target: https://github.com/camuschat/camus/blob/master/LICENSE
.. |Deploy to Heroku| image:: https://www.herokucdn.com/deploy/button.svg
   :target: https://heroku.com/deploy?template=https://github.com/camuschat/camus

.. _WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
.. _Snap: https://docs.camus.chat/en/latest/installation.html#snap
.. _pip: https://docs.camus.chat/en/latest/installation.html#pip
.. _Docker: https://docs.camus.chat/en/latest/installation.html#docker
.. _Heroku: https://docs.camus.chat/en/latest/deployment.html#heroku
.. _snapd: https://snapcraft.io/docs/installing-snapd
.. _Camus: https://snapcraft.io/camus
.. _service management: https://snapcraft.io/docs/service-management
.. _Python 3.7: https://docs.python.org/3.7/whatsnew/3.7.html
.. _Quart: https://gitlab.com/pgjones/quart
.. _virtual environment: https://docs.python.org/3/tutorial/venv.html
.. _pre-built Docker image: https://hub.docker.com/r/camuschat/camus
.. _deployment documentation: https://docs.camus.chat/en/latest/deployment.html
.. _technical overview: https://docs.camus.chat/en/latest/technical-overview.html
.. _development documentation: https://docs.camus.chat/en/latest/development.html
.. _TURN: https://webrtc.org/getting-started/turn-server
.. _Contributing: https://github.com/camuschat/camus/blob/master/CONTRIBUTING.rst
