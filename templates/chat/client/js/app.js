function MainCtrl($scope) {
  var chatSetup = JSON.parse(window.localStorage.getItem('chat_setup') || '{}');
  $scope.username = chatSetup.username;
  $scope.chat_history = [];
  $scope.chat_input = '';
  this.bsClient = $scope.$baresoil = new BaresoilClient();

  $scope.$baresoil.on('connection_status', function(connStatus) {
    $scope.$apply(function() {
      $scope.connStatus = connStatus;
      if (connStatus === 'connected') {
        $scope.view = 'chat';
      } else {
        if (connStatus !== 'offline') {
          $scope.view = 'connection';
        }
      }
    });
  });

  $scope.$baresoil.on('user_event', function(evtName, evtData) {
    if (evtName === 'chat_history') {
      $scope.$apply(function() {
        $scope.chat_history = evtData;
        ScrollToBottom();
      });
    }
    if (evtName === 'channel_message') {
      $scope.$apply(function() {
        $scope.chat_history.push(evtData.value);
        ScrollToBottom();
      });
    }
  });

  setTimeout(function() {
    $('#chat-input-box').focus();
  }, 1000);

  $scope.$watch('main.username', function (username) {
    this.username = (username || '').toUpperCase().substr(0, 20);
    if (this.username.length) {
      window.localStorage.setItem('chat_setup', JSON.stringify({
        username: this.username
      }));
    }
  }.bind(this));

  if (chatSetup.username) {
    // Already have username, proceed to connection status.
    $scope.view = 'connection';
    $scope.$baresoil.setConfigParameter('sessionRequest', {
      username: chatSetup.username
    });
    $scope.$baresoil.connect();
  } else {
    // Setup up username.
    $scope.view = 'setup';
  }
}

MainCtrl.prototype.enter_chat_room = function() {
  this.bsClient.setConfigParameter('sessionRequest', {
    username: this.username
  });
  this.bsClient.connect();
};

MainCtrl.prototype.send_message = function() {
  var input = (this.chat_input || '').substr(0, 200);
  this.chat_input = '';
  this.bsClient.run('post_message', input, function (err) {
    if (err) {
      console.error(err);
    } else {
      $('#chat-input-box').focus();
    }
  }.bind(this));
};

function ScrollToBottom() {
  setTimeout(function() {
    window.scrollTo(0, document.body.scrollHeight);
  }, 50);
}

angular.
  module('app', []).
  controller('MainCtrl', MainCtrl);
