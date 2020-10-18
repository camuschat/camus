Server configuration
====================

Secret key
---------------------

The Camus server is based on `Quart`_, which requires a secret key for signing
cookies and keeping sessions with clients secure. You can provide a secret
key by setting the ``SECRET_KEY`` environment variable. If no secret key is
provided, a new random 32 byte key is automatically generated each time the
Camus server starts.

STUN and TURN servers
---------------------

A `STUN`_ server is necessary in order for clients to be able to determine their
public IP address so that they can establish direct peer-to-peer WebRTC
connections with other clients. In a majority of cases, a `TURN`_ server is not
needed to establish a WebRTC connection, but sometimes restrictive firewalls or
network topologies can make establishing a connection impossible without TURN.
Therefore, it is recommended that at least one TURN server be configured.

The Camus server can provide clients with a list of default STUN and TURN
servers, along with any necessary credentials. If no configuration is provided
to the Camus server, only a Google STUN server at ``stun.l.google.com:19302``
is used. When running the Camus server, you can set a number of environment
variables to provide clients with available STUN and TURN servers.

If you wish to run your own TURN server, `Coturn`_ is recommended. Alternatively
(or additionally), you can use `Twilio`_.

Configuring a STUN server
~~~~~~~~~~~~~~~~~~~~~~~~~

Set the following environment variables on the server:

.. code-block:: none

   STUN_HOST  # the hostname or IP address for the STUN server
   STUN_PORT  # the port of the STUN server

Configuring a TURN server
~~~~~~~~~~~~~~~~~~~~~~~~~

Set the following environment variables on the server:

.. code-block:: none

   TURN_HOST  # the hostname or IP address for the TURN server
   TURN_PORT  # the port of the TURN server
   TURN_STATIC_AUTH_SECRET  # the static secret for your TURN server

Camus uses ``TURN_STATIC_AUTH_SECRET`` to generate unique temporary credentials
for each client. See the `Coturn documentation`_ for more information.

Using Twilio for STUN and TURN servers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

`Twilio`_ is a third-party service that can provide STUN and TURN servers. To
use the service, you must `create a (free) Twilio account`_.

Set the following environment variables on the server:

.. code-block:: none

   TWILIO_ACCOUNT_SID   # your Twilio account SID
   TWILIO_AUTH_TOKEN  # your Twilio account auth token, or if using an API key, the API key secret
   TWILIO_KEY_SID  # (optional) if using an API key, the API key SID

.. _Quart: https://gitlab.com/pgjones/quart
.. _STUN: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols#STUN
.. _TURN: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols#TURN
.. _Coturn: https://github.com/coturn/coturn
.. _Twilio: https://www.twilio.com/
.. _create a (free) Twilio account: https://www.twilio.com/try-twilio
.. _Coturn documentation: https://github.com/coturn/coturn/wiki/turnserver#turn-rest-api
