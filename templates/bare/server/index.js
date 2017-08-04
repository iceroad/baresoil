// A Baresoil program is a node.js package that exports an object with function
// properties that are exposed to a remote client in two ways:
//
//   * Via "rpc_request" messages over a WebSocket connection.
//   * Via HTTP POST, PUT, DELETE, and UPDATE requests. Multipart requests/
//     file uploads are supported as in-memory buffer, rather than streams.
//
// To resolve function names for "rpc_request" calls, Baresoil uses lodash's
// _.get() operator with a function path specified in the rpc_request's
// "function" field.
//
// The call context for all functions will be a global SandboxDriver instance.
//
module.exports = {
  // WebSocket authorization function. Called on new WebSocket connections with
  // a "sessionRequest" object describing. Passing an error to the callback
  // will disconnect the client with the provided error.
  $websocket(sessionRequest, cb) {
    const remoteAddress = this.getRemoteAddress();

    // Writing to stderr (as console.error does) will write to the sandbox's log.
    console.error(`New WebSocket handler for remote ${remoteAddress}`);

    // Passing values to the callback will return the object as the "userData"
    // field of the outgoing "session_request" packet. Passing the remote client's
    // public IP address back to the client is an example.
    return cb(null, {
      remoteAddress,
    });
  },

  // An example of a simple echo() function that returns its argument back to
  // the caller. This function is exposed to WebSocket clients via an
  // "rpc_request" message.
  echo(fnArg, cb) {
    return cb(null, fnArg);
  },

  // Handle HTTP POST, PUT, DELETE, and UPDATE requests. Other requests are
  // served directly from the currently deployed client-side manifest without
  // creating a sandbox, for efficiency and atomicity.
  //
  // Multipart, form, and JSON encoded bodies are parsed into the HttpRequest
  // data structure, along with request headers.
  //
  // For keep-alive HTTP connections, multiple requests on the same connection
  // will arrive in this sandbox as they arrive (i.e., one sandbox per socket
  // connection).
  $http(httpRequest, cb) {
    //
    // TODO: Process the request here, or return an error to reject the request.
    //

    // Pass an HttpResponse object back to the callback.
    return cb(null, {
      // HTTP status code is required.
      statusCode: 403, // Forbidden

      // HTTP response bodies must be provided as strings or buffers.
      body: Buffer.from('Awaiting implementation.', 'utf-8'),
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
};
