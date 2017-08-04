# baresoil

Create, develop, and deploy Baresoil applications.

See documentation at [docs.baresoil.com](https://docs.baresoil.com/).

## Summary

Install:

    npm install -g baresoil

Start a new project:

    baresoil init
    baresoil dev

Create a developer account on a remote Baresoil server. `baresoil.cloud`
is a free community server for demonstration purposes. See baresoil-server for
details on setting up your own server.

    baresoil signup --server wss://baresoil.cloud

Register your project to a subdomain or domain on the server, and then
deploy it to the server.

    baresoil register --hostname mydomain.baresoil.cloud
    baresoil deploy

Running `deploy` again will synchronize incremental changes since the last deploy to the server.

Note: when using the baresoil.cloud service, only subdomains of `baresoil.cloud` can be registered. This restriction does not apply if you run your own baresoil-server instance.
