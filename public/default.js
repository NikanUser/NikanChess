(function () {
    WinJS.UI.processAll().then(function () {
      var socket, serverGame;
      var username, playerColor;
      var game, board;
      var usersOnline = [];
      var myGames = []; 
      socket = io();
      //////////////////////////////
      // Socket.io handlers
      ////////////////////////////// 
      socket.on('login', function(msg) {
        if(msg.userId!='0')
        {
            usersOnline = msg.users;
            updateUserList();
            q1=$('#page-login').hide();
            q2=$('#page-lobby').show();
            myGames = msg.games;
            updateGamesList();
        }
        else 
        {
       alert("نام کاربری یا رمز عبور شما اشتباه است");
       $('#username').val="";
       $('#Pass').val="";
       location.reload();
        }
     });

     socket.on('Reg', function(msg) {
      if(msg.message=='0')
      {
        
        alert('نام کاربری و رمز عبور شما تکراری است');
        location.reload(); 
      }
      else
       {
        alert('ثبت نام شما با موفقیت انجام شد');
     
 
        location.reload(); 
      }
   });
        socket.on('joinlobby', function (msg) {
        addUser(msg);
      });
        socket.on('leavelobby', function (msg) {
        removeUser(msg);
      });
      socket.on('gameadd', function(msg) {
      });
      
      socket.on('resign', function(msg) {
            if (msg.gameId == serverGame.id) {

              socket.emit('login', username);

              $('#page-lobby').show();
              $('#page-game').hide();
            }            
      });
                  
      socket.on('joingame', function(msg) {
        console.log("joined as game id: " + msg.game.id );   
        playerColor = msg.color;
        initGame(msg.game);
                $('#page-lobby').hide();
        $('#page-game').show();
        
      });
      socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
           game.move(msg.move);
           board.position(game.fen());
        }
      });

      socket.on('logout', function (msg) {
        removeUser(msg.username);
      });
      //////////////////////////////
      //          Menus
      ////////////////////////////// 
      $('#Reg').on('click', function() {
        username1 = $('#username1').val();
        Pass1 = $('#Pass1').val();
        name = $('#Name').val();
        family = $('#Family').val();
        socket.emit('Reg', name,family,username1,Pass1);
         
        });


      $('#login').on('click', function() {
        username = $('#username').val();
      
        Pass = $('#Pass').val();
        if (username.length > 0 && Pass.length) {
            $('#userLabel').text(username).append(" عزیز  خوش آمدی  ");
            socket.emit('login', username);
         
        } 
      });
       

      $('#login1').on('click', function() {
         
        $('#page-Signin').hide();
            $('#page-login').show();
      });
      $('#Reg1').on('click', function() {
         
        $('#page-login').hide();
            $('#page-Signin').show();
      });
      $('#game-back').on('click', function() {
        socket.emit('login', username);
        
        $('#page-game').hide();
        $('#page-lobby').show();
      });
      
      $('#game-resign').on('click', function() {
        socket.emit('resign', {userId: username, gameId: serverGame.id});
        
        socket.emit('login', username);
        $('#page-game').hide();
        $('#page-lobby').show();
      });
      
      var addUser = function(userId) {
        usersOnline.push(userId);
        updateUserList();
      };
    
     var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }
         
         updateUserList();
      };
      
      var updateGamesList = function() {
        document.getElementById('gamesList').innerHTML = '';
        myGames.forEach(function(game) {
          $('#gamesList').append($('<button style="font-family:B Yekan;margin:5px;background-color:#0e8b08;cursor:pointer;">')
                        .text('#'+ game)
                        .on('click', function() {
                          socket.emit('resumegame',  game);
                        }));
        });
      };
      
      var updateUserList = function() {
        document.getElementById('userList').innerHTML = '';
        usersOnline.forEach(function(user) {
          $('#userList').append($('<button style="font-family:B Yekan;margin:5px;background-color:#0e8b08;cursor:pointer">')
                        .text(user)
                        .on('click', function() {
                          socket.emit('invite',  user);
                        }));
        });
      };
           
      //////////////////////////////
      // Chess Game
      ////////////////////////////// 
      
      var initGame = function (serverGameState) {
        serverGame = serverGameState; 
        
          var cfg = {
            draggable: true,
            showNotation: false,
            orientation: playerColor,
            position: serverGame.board ? serverGame.board : 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
          };
               
          game = serverGame.board ? new Chess(serverGame.board) : new Chess();
          board = new ChessBoard('game-board', cfg);
      }
       
      // do not pick up pieces if the game is over
      // only pick up pieces for the side to move
      var onDragStart = function(source, piece, position, orientation) {
        if (game.game_over() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
            (game.turn() !== playerColor[0])) {
          return false;
        }
      };  
      var onDrop = function(source, target) {
        // see if the move is legal
        var move = game.move({
          from: source,
          to: target,
          promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
      
        // illegal move
        if (move === null) { 
          return 'snapback';
        } else {
           socket.emit('move', {move: move,from:move.from,to:move.to,promotion:move.promotion, gameId: serverGame.id, board: game.fen()});
           socket.emit('move2', move.from,move.to, serverGame.id,move.color,move.san);
          }
      
      };

      // update the board position after the piece snap 
      // for castling, en passant, pawn promotion
      var onSnapEnd = function() {
        board.position(game.fen());
      };
    });
})();

