Camus
=====

|Build Status| |docs| |PyPI| |Docker Hub| |License|

Camus is a video chat app that uses `WebRTC`_ for direct peer-to-peer
communication. Users can create public or private rooms, optionally protected
by a password. In addition to streaming audio and video from a webcam and
microphone, Camus also provides screen sharing and text chat.

Features
--------

-  Webcam streaming
-  Desktop sharing
-  Text chat
-  Room management (public/private, password/no password, guest limits)

Demo
----

You can find a live demo at https://camus.chat.

Running
-------

Using Python
~~~~~~~~~~~~

Camus requires `Python 3.7`_ or higher since it makes use of `Quart`_ and async
syntax. As usual, it's best to use a virtual environment.

Install Camus:

::

   $ pip install camus-chat

Run Camus:

::

   $ camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Using Docker
~~~~~~~~~~~~

You can find a `pre-built Docker image`_ on Docker Hub. Use the following
command to pull the image and run a container:

::

   $ docker run -d -p 5000:5000 mrgnr/camus

Go to ``localhost:5000`` in your browser. For local testing, you can visit the
same room in multiple tabs and each tab will act as a separate client.

Using Heroku
~~~~~~~~~~~~

|Deploy to Heroku|

Simply click the button above or see the `deployment documentation`_ for
detailed instructions.

How it works
------------

See the `technical overview`_ to understand how Camus works.

Development
-----------

See the `development documentation`_ for build & test instructions.

Roadmap
-------

v0.1
~~~~

-  [x] Audio/video streaming
-  [x] Desktop sharing
-  [x] Text chat
-  [x] Cross-browser support (using `Babel`_, `Adapter`_)

   -  [x] Chromium/Chrome/Brave
   -  [x] Firefox
   -  [x] Safari

-  [x] Support `TURN`_ server

v0.2
~~~~

-  [ ] Rewrite the UI using `React`_
-  [ ] Make the UI accessible
-  [ ] Configurable TURN server in the client
-  [ ] Controls for video quality
-  [ ] Debian package

v0.3+
~~~~~

-  [ ] Persistent storage (SQLite, Redis, and/or PostgreSQL)
-  [ ] User accounts, persistent user settings
-  [ ] Support `SFU`_ for client scalability

.. |Build Status| image:: https://travis-ci.org/mrgnr/camus.svg?branch=master
   :target: https://travis-ci.org/mrgnr/camus
.. |docs| image:: https://img.shields.io/readthedocs/camus/latest
   :target: https://docs.camus.chat
.. |PyPI| image:: https://img.shields.io/pypi/v/camus-chat?color=blue
   :target: https://pypi.org/project/camus-chat
.. |Docker Hub| image:: https://img.shields.io/docker/pulls/mrgnr/camus
   :target: https://hub.docker.com/r/mrgnr/camus
.. |License| image:: https://img.shields.io/github/license/mrgnr/camus?color=green
   :target: https://github.com/mrgnr/camus/blob/master/LICENSE
.. |Deploy to Heroku| image:: https://www.herokucdn.com/deploy/button.svg
   :target: https://heroku.com/deploy?template=https://github.com/mrgnr/camus

.. _WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
.. _Python 3.7: https://docs.python.org/3.7/whatsnew/3.7.html
.. _Quart: https://gitlab.com/pgjones/quart
.. _pre-built Docker image: https://hub.docker.com/r/mrgnr/camus
.. _deployment documentation: https://docs.camus.chat/en/latest/deployment.html
.. _technical overview: https://docs.camus.chat/en/latest/technical-overview.html
.. _development documentation: https://docs.camus.chat/en/latest/development.html
.. _Babel: https://github.com/babel/babel
.. _Adapter: https://github.com/webrtcHacks/adapter
.. _TURN: https://webrtc.org/getting-started/turn-server
.. _React: https://github.com/facebook/react
.. _SFU: https://webrtcglossary.com/sfu
