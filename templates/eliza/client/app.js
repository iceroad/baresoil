// Create a global instance of BaresoilClient.
var baresoil = new BaresoilClient({
  connectPolicy: 'immediate'
});

// Listen for the "conversation_history" event from the server.
baresoil.on('user_event', function(evtName, evtData) {
  if (evtName === 'addToTranscript') {
    evtData.forEach(function(convItem) {
      addToTranscript(convItem.who, convItem.text);
    });
  }
});

function say() {
  // Get user chat input.
  var textArea = document.getElementById('chat_input');
  var textInput = textArea.value;
  if (!textInput) return;

  // Remove user input and add to chat transcript.
  addToTranscript('user', textInput);
  textArea.value = '';
  textArea.focus();

  // Run the "tell_eliza" server-side function, passing it the
  // contents of the text input box. BaresoilClient handles
  // connecting (and reconnecting) to the Baresoil backend.
  baresoil.run('tell_eliza', textInput, function(err, reply) {
    // Handle errors and responses from Eliza.
    if (err) {
      addToTranscript('error', err.message);
    } else {
      addToTranscript('ELIZA', reply);
    }
  });
}

// A Javascript U.I. frame generally helps with this sort
// of DOM manipulation.
function addToTranscript(who, text) {
  var transcript = document.getElementById('chat_window');
  transcript.innerHTML += [
    '<div class="chat-message from-' + who + '">',
      '<span>' + text + '</span>',
    '</div>'
  ].join('');

  window.scrollTo(0, document.body.scrollHeight);
}
