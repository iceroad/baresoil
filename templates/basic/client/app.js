$(document).ready(function() {
  var bsClient = new BaresoilClient({
    connectPolicy: 'immediate',
  });

  $('#chat-send-button').click(function() {
    var inputBox = $('#chat-input-box');
    var text = inputBox.val().replace(/^\s+|\s+$/mgi, '');
    if (!text || !text.length) {
      inputBox.focus();
      return;
    }

    bsClient.run('post_message', text, function(err) {
      if (err) {
        inputBox.addClass('text-danger');
      } else {
        inputBox.removeClass('text-danger');
      }
    });

    inputBox.val('');
    inputBox.focus();
    return;
  });

  bsClient.on('connection_status', function(connStatus, data) {
    var text, showControls;

    if (connStatus === 'connecting') {
      text = 'Connecting...';
    }

    if (connStatus === 'setup') {
      text = 'Setting up connection...';
    }

    if (connStatus === 'connected') {
      showControls = true;
    }

    if (connStatus === 'error') {
      text = 'Error: ' + data;
    }

    if (showControls) {
      $('.connection-status').hide();
      $('.chat-input-controls').show().fadeIn();
      $('#chat-input-box').focus();
    } else {
      $('.connection-status').text(text || connStatus).show();
      $('.chat-input-controls').hide();
    }
  });

  bsClient.on('user_event', function(evtName, evtData) {
    if (evtName === 'channel_message') {
      var elem = $([
        '<div class="animated slideInDown">',
        '  <div class="chat-bubble">',
        '    <div class="source"> </div>',
        '    <div class="text"> </div>',
        '  </div>',
        '</div>',
      ].join(' '));
      $('.text', elem).text(evtData.message.text);
      $('.source', elem).text(evtData.message.source);
      elem.appendTo('#channel_messages');
      setTimeout(function() {
        window.scrollTo(0, document.body.scrollHeight);
      }, 30);
      return;
    }
  });
});
