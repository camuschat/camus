Version 0.3.2
-------------

Released 2021-05-16

- Fix bugs around database transactions

Version 0.3.1
-------------

Released 2021-04-20

- Add TypeScript to the frontend

Version 0.3.0
-------------

Released 2021-04-04

- Major refactoring of the server and the WebRTC client
- Add support for a database (SQLite or Postgresql) on the server
- Add support for multiple audio/video tracks to the WebRTC client
- Improve support for screenreaders and keyboard-based navigation
- Automatically reconnect websocket on failure/disconnection
- Update the Snap package for database support
- Add tutorial for deploying on Raspberry Pi

Breaking changes
~~~~~~~~~~~~~~~~

- Rename the `/chat` route to `/room`

Version 0.2.3
-------------

Released 2021-01-27

- Add invitation link and hang-up button

Version 0.2.2
-------------

Released 2020-11-01

- Improve styling for the landing page

Version 0.2.1
-------------

Released 2020-10-24

- Fix video preview to use the selected device when entering a room
- Decrease time between server pings to the client to prevent the websocket from timing out
- Provide a logo for Heroku

Version 0.2.0
-------------

Released 2020-10-20

- Rewrite the UI using React
- Add video feed controls (fullscreen, picture-in-picture, resolution, audio level, visibility)
- Support STUN/TURN server configuration in the client
- Add Snap package

Version 0.1.1
-------------

Released 2020-08-26

- Support deployment on Heroku
- Use Hypercorn for production

Version 0.1
-----------

Released 2020-07-28

- Initial release
- Audio & video streaming
- Screensharing
- Text chat
- Support Coturn TURN server
- Cross-browser support for Chromium, Firefox, and Safari
