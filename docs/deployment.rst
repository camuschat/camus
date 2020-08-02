Deployment
==========

Heroku
------

You can easily deploy Camus on `Heroku`_ with just a few commands. The Camus
repository contains the necessary configuration files to enable this, namely
`app.json`_, `Procfile`_, and `runtime.txt`_.

To get started, create a Heroku account and `install the Heroku CLI tool`_.
Clone the Camus repo if you haven't already, login to Heroku, and create a new
Heroku project:

::

   $ git clone https://github.com/mrgnr/camus.git && cd camus
   $ heroku login -i
   $ heroku create

The ``heroku create`` command automatically configures a new git remote called
``heroku`` (which you can verify by running ``git remote -v``). To deploy Camus
to Heroku, simply push the master branch to the heroku remote:

::

   $ git push heroku master

You should now be able to see Camus running in your browser:

::

   $ heroku open

Configuration
~~~~~~~~~~~~~

You can use the ``heroku config`` command to set environment variables that are
used to `configure`_ Camus. For example, set the SECRET_KEY and specify a TURN
server:

::

   $ heroku config:set SECRET_KEY=aVerySecretKey
   $ heroku config:set TURN_HOST=turn.example.com
   $ heroku config:set TURN_PORT=3478
   $ heroku config:set TURN_STATIC_AUTH_SECRET=mySuperSecretSecret

For more information, see Heroku's `configuration documentation`_.

Limitations
~~~~~~~~~~~

- You should *not* use horizontal scaling (i.e. runnning Camus across multiple
  dynos using the ``heroku ps:scale`` command). Camus currently stores all room
  and client data in memory and has no backend storage, so there is no way to
  synchronize data across multiple dynos. If you need to scale (which is
  probably not necessary unless you have hundreds or thousands of simultaneous
  users), use vertical scaling with the ``heroku ps:resize`` command instead.
- Any time you restart the Camus app on Heroku, room and client data will be
  lost, since Camus currently stores this data in memory.
- By default, no TURN server is configured when you deploy Camus on Heroku. If
  you want to minimize the risk of users experiencing WebRTC connection issues,
  you should configure a TURN server, such as `Coturn`_.

.. _Heroku: https://www.heroku.com/
.. _app.json: https://github.com/mrgnr/camus/blob/master/app.json
.. _Procfile: https://github.com/mrgnr/camus/blob/master/Procfile
.. _runtime.txt: https://github.com/mrgnr/camus/blob/master/runtime.txt
.. _install the Heroku CLI tool: https://devcenter.heroku.com/articles/heroku-cli#download-and-install
.. _configure: https://github.com/mrgnr/camus/blob/master/camus/config.py
.. _configuration documentation: https://devcenter.heroku.com/articles/config-vars
.. _Coturn: https://github.com/coturn/coturn
