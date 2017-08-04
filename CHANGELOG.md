Version 1.0.0: Aug 4, 2017

  * Breaking changes:
    - Will only work with baresoil-server 1.0.0 and above.

Version 0.2.7: May 18, 2017

  * Changes to "init":
    - Multiple built-in templates: "chat" and "martinet"
    - Support for post-init hooks, for npm install, etc.

  * Changes to "deploy":
    - Support for selective HTTP caching policies for files in client project.

  * General:
    - Integration with martinet, a Webpack-based site build engine.
    - Patches and syncs with Baresoil Cloud.


Version 0.2.6: April 12, 2017

  * Changes to "dev":
    - Less noisy console output.
    - Support for RealtimeBus presence features.
    - Sandbox stderr is now piped to console.

  * Changes to "init":
    - Default chat app now features persistent message history.


Version 0.2.5: March 22, 2017

  * Changes to "dev":
    - baresoil.json can contain a custom "dev-server" hook to start a
      custom client project dev tool (e.g., Webpack's dev server).
    - Options for quieter logging.
    - The "--extra" CLI flag allows passing options to the hooks.

  * Changes to "deploy":
    - baresoil.json can contain a custom "build" hook to generate an
      optimized production build prior to deployment.


Version 0.2.4: March 14, 2017

  * Changes to "register":
    - issues a new deploy key if the user already owns the subdomain.
    - locally validates subdomains and lists available TLDs.
    - ensures that it is run in a project directory

  * Changes to "deploy":
    - supports empty files in the server project (e.g. __init__.py).
    - correctly deletes files from the client and server.

  * Changes to "whoami":
    - changed text to indicate that session expires, not user account.


Version 0.2.3: March 12, 2017

  * Friendlier CLI messages
  * "baresoil init" now creates the Basic Chat demo
  * Fixed "missing baresoil_data directory" bug
  * Updated to Baresoil Development Environment 0.2.2
  * Updated to BaresoilClient 0.2.2
