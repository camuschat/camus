How to deploy Camus on Raspberry Pi with Ubuntu Server
======================================================

You can run Camus on a `Raspberry Pi`_, which is useful if you want to set up a
private Camus server on your local network. This is a step-by-step guide to
help you install and configure all the necessary software.

If you haven't already, the first thing to do is install `Ubuntu Server`_ on
your Raspberry Pi. It's recommended to use 20.04, which is the latest Long Term
Support release. You can `follow this tutorial`_ to guide you through flashing
your SD card and configuring Ubuntu for network access.

Install Camus
-------------

SSH into your Raspberry Pi, or open a terminal there, and install the `Camus
Snap package`_ from the Snap Store:

::

   $ sudo snap install camus

You can check the logs to verify that the Camus server is running:

::

   $ sudo snap logs camus

      2021-02-04T18:39:28Z systemd[1]: Started Service for snap application camus.camus.
      2021-02-04T18:39:30Z camus.camus[55076]: [2021-02-04 18:39:30 +0000] [55076] [INFO] Running on http://127.0.0.1:5000 (CTRL + C to quit)
      2021-02-04T18:39:30Z camus.camus[55076]: [INFO] in logging info 87: Running on http://127.0.0.1:5000 (CTRL + C to quit)


Change the hostname (optional)
------------------------------

Later, we will use the hostname as part of the URL to access Camus from a web
browser. For a clean Ubuntu Server installation the hostname is ``ubuntu``.
While it's fine to keep the default, you'll probably want to use a custom name
to make it easier for users to remember the server URL.

In this tutorial, we will set our hostname to ``camus``, which can be done with
the ``hostnamectl`` command:

::

   $ sudo hostnamectl set-hostname camus

Reboot the Pi for the change to take effect:

::

   $ sudo shutdown -r now

|

   **Note:** Depending on your local network configuration and DNS settings,
   you may need to add an entry to the `/etc/hosts`_ file on other machines
   which use the hostname to communicate with the Camus server.


Install and configure Nginx
---------------------------

`Nginx`_ is a reverse-proxy that will allow us to forward connections from a
public port on the Raspberry Pi to the Camus server.

Install Nginx on the Pi:

::

   $ sudo apt install nginx


Next, we need to add some configuration to tell Nginx to act as a proxy for
Camus. Create a new file at ``/etc/nginx/conf.d/camus.conf`` and open it with
your preferred editor:

::

   $ sudo touch /etc/nginx/conf.d/camus.conf
   $ sudo nano /etc/nginx/conf.d/camus.conf

Copy the following into the file and save it. Note that the value for
``server_name`` should match the hostname of the Pi.

::

   upstream camus_upstream {
      ip_hash;  # websocket connections need a constant server
      server localhost:5000;
   }

   server {
      server_name camus;
      listen 80;

      location / {
         proxy_pass http://camus_upstream;
         proxy_http_version 1.1;
      }

      # Settings required for websockets
      location ~ ^/room/(?<room_id>.+)/ws {
         proxy_pass http://camus_upstream/room/$room_id/ws;
         proxy_http_version 1.1;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header Host $host;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_read_timeout 300;
         proxy_send_timeout 300;
      }
   }

After saving the file, it's a good idea to check the configuration for errors:

::

   $ sudo nginx -t

      nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
      nginx: configuration file /etc/nginx/nginx.conf test is successful


After validating the configuration, restart Nginx and check that it is running
successfully:

::

   $ sudo service nginx restart
   $ sudo service nginx status


If everything went as planned, you should now be able to access the Camus
server from the network. Open a web browser from another machine on the same
network as the Pi and navigate to ``http://camus/`` (or ``http://<hostname>/``
where ``<hostname>`` is your Pi's hostname). The Camus landing page should load.

Generate SSL certificates
-------------------------

At this point, the Camus server should be running on your Pi and accessible
from other machines on the network. However, most web browsers require sites to
use `HTTPS for webcam and microphone access`_. To satisfy this requirement,
we'll need to obtain an SSL certificate and configure Nginx to use it.

Since our server should be exposed only to the local network (and not
available publicly on the Internet), we'll create our own self-signed
certificates. This will consist of several steps, namely:

- Create our own Certificate Authority (CA). Later we can add our CA's public
  certificate to a web browser so that the browser trusts any certificates
  signed by our CA.
- Create a Certificate Signing Request (CSR) and private key for our server.
- Use our CA to generate and sign a server certificate based on the CSR.

Create a self-signed CA certificate and private key:

::

   $ openssl req \
      -x509 \
      -newkey rsa:4096 -nodes -keyout ca.key \
      -new -out ca.crt

Create a server CSR and private key (replace "camus" with your hostname):

::

   $ openssl req \
      -subj "/CN=camus" \
      -addext "subjectAltName = DNS:camus" \
      -newkey rsa:2048 -nodes -keyout camus.key \
      -out camus.csr

Create a server certificate and sign it with our CA (replace "camus" with your
hostname):

::

   $ openssl x509 -req \
      -days 365 \
      -extfile <(printf "subjectAltName=DNS:camus") \
      -CA ca.crt -CAkey ca.key -CAcreateserial \
      -in camus.csr \
      -out camus.crt

Move the server certificate and key:

::

   $ sudo mv camus.crt /etc/ssl/certs/camus.crt
   $ sudo mv camus.key /etc/ssl/private/camus.key

|

   **Security warning**: Keep your private keys safe and don't share them
   with anyone. If an attacker gains access to your CA private key, they could
   use it to sign SSL certificates and trick any browser that trusts your CA to
   also trust a malicious website.


   **Security warning**: This section only provides the minimal setup necessary to
   get your Camus server up and running. For best practices around managing CA
   and SSL certificates, see a more complete guide such as `OpenSSL Certificate
   Authority`_ or the `OpenSSL PKI Tutorial`_.

Configure Nginx to use SSL
--------------------------

Now that we have SSL certificates, we need to configure Nginx to use them to
establish secure HTTPS connections. Update ``/etc/nginx/conf.d/camus.conf``
(again, the value for ``server_name`` should be the Pi's hostname):

::

   upstream camus_upstream {
      ip_hash;  # websocket connections need a constant server
      server localhost:5000;
   }

   server {
      server_name camus;
      listen 80;

      location / {
         # Redirect to use HTTPS
         return 301 https://$host$request_uri;
      }
   }

   server {
      server_name camus;
      listen 443 ssl;

      # SSL configuration
      ssl_certificate /etc/ssl/certs/camus.crt;
      ssl_certificate_key /etc/ssl/private/camus.key;
      ssl_protocols TLSv1.2 TLSv1.3;

      location / {
         proxy_pass http://camus_upstream;
         proxy_http_version 1.1;
      }

      # Settings required for websockets
      location ~ ^/chat/(?<room_id>.+)/ws {
         # These settings are needed for websockets
         proxy_pass http://camus_upstream/chat/$room_id/ws;
         proxy_http_version 1.1;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header Host $host;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_read_timeout 300;
         proxy_send_timeout 300;
      }
   }

After saving the file, validate the configuration and restart nginx:

::

   $ sudo nginx -t
   $ sudo service nginx restart

Configure the firewall (optional)
---------------------------------

For security, it's a good idea to set up a firewall so that only the necessary
ports from your Pi are exposed to the network. For a basic Camus server, we'll
want to make ports 22, 80, and 443 available for SSH, HTTP, and HTTPS traffic,
respectively:

::

   $ sudo ufw allow 22,80,443/tcp
   $ sudo ufw enable

Verify that the firewall is configured correctly:

::

   $ sudo ufw status

Install the CA certificate in your web browser
----------------------------------------------

The final step is to add the CA public certificate to any web browsers that you
want to access Camus with. Adding a CA certificate tells the browser to trust
certificates signed by that CA (in our case, the server certificate used by
Nginx). In your web browser settings, import the ``ca.crt`` file created earlier
and restart your browser. You should then be able to access your Camus site
and use your camera and microphone without security errors.

- In Chromium-family browsers:

  - Settings > Privacy and security > Security > Manage certificates > Authorities > Import 

- In Firefox:

  - Preferences > Privacy & Security > View Certificates > Authorities > Import

Other resources
---------------

- `Camus Discussions`_: for questions and general discussion about Camus
- `OpenSSL Essentials`_ (DigitalOcean)
- `OpenSSL Certificate Authority`_
- `OpenSSL PKI Tutorial`_
- `Configuring HTTPS Servers`_ (Nginx)
- `Server Side TLS`_ (Mozilla)


.. _Raspberry Pi: https://www.raspberrypi.org/products/
.. _Ubuntu Server: https://ubuntu.com/download/raspberry-pi
.. _follow this tutorial: https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi
.. _Camus Snap package: https://snapcraft.io/camus
.. _Nginx: https://nginx.org/en/
.. _/etc/hosts: https://tldp.org/LDP/solrhe/Securing-Optimizing-Linux-RH-Edition-v1.3/chap9sec95.html
.. _HTTPS for webcam and microphone access: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security
.. _OpenSSL Certificate Authority: https://jamielinux.com/docs/openssl-certificate-authority/
.. _OpenSSL PKI Tutorial: https://pki-tutorial.readthedocs.io
.. _Camus Discussions: https://github.com/camuschat/camus/discussions
.. _OpenSSL Essentials: https://www.digitalocean.com/community/tutorials/openssl-essentials-working-with-ssl-certificates-private-keys-and-csrs
.. _Configuring HTTPS Servers: https://nginx.org/en/docs/http/configuring_https_servers.html
.. _Server Side TLS: https://wiki.mozilla.org/Security/Server_Side_TLS
