var express = require('express');
var app = express();
app.use(express.static('public'));
app.use(express.static('dashboard'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 1003;
var lobbyUsers = {};
var users = {};
var message={};
var activeGames = {};
var uuid = require('uuid');
var mysql = require('mysql');
io.on('connection', function(socket) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123",
        database: "chess"
      });
    socket.on('login', function(userId) {
        con.connect(function(err){
            if(err){
                    console.log('Error connecting to Db');
                        return;
            } else { 
                        var t=  con.query('SELECT COUNT(*) AS count FROM users WHERE user_name='+userId, (err, rows) => {
                        const count = rows[0].count;
                        // const count = rows[0]['COUNT(*)']; // without alias
                        console.log(t.sql);
                        console.log(count);
                                if  (count ==0)
                                {
                            console.log('Not Exist');
                            socket.emit('login', {userId:'0', 
                                games:'0' });
                                }
                              else
                              {
                                socket.userId = userId; 
                                if (!users[userId]) {    
                                    console.log('creating new user');
                                    users[userId] = {userId: socket.userId, games:{}};
                                    console.log(users[userId]);
                                }
                         else
                          {
                           console.log('user found!');
                           Object.keys(users[userId].games).forEach(function(gameId) {
                           console.log('gameid - ' + gameId);
                         });
                          }
                                
                                socket.emit('login', {users: Object.keys(lobbyUsers), 
                                games: Object.keys(users[userId].games) });
                                lobbyUsers[userId] = socket;
                                socket.broadcast.emit('joinlobby', socket.userId);
                                console.log('exist');
                              }
                    });
                }
             
         });
       
    });
    socket.on('Reg', function( Name,Family, Uname,Pass) {
        con.connect(function(err){
            if(err){
                    console.log('Error connecting to Db');
                        return;
            } else { 
              
                            
                 
                  var t=  con.query('SELECT COUNT(*) AS count FROM users WHERE user_name='+Uname, (err, rows) => {
                        const count = rows[0].count;
                        // const count = rows[0]['COUNT(*)']; // without alias
                        console.log(t.sql);
                        console.log(count);
                        if  (count ==0)
                        {
      
                          var post  = {first_name:Name,last_name:Family,user_name:Uname,password :Pass,uniqe:uuid.v4()  };             
                          var query = con.query('INSERT INTO users SET ?', post, function(err, result) {
                              console.log('db added');
                              console.log(query.sql);
                                      });
                                  console.log('Connection established');
                                  socket.emit('Reg', { message:'1', 
                                });
                              }
                              else
                              {
                                socket.emit('Reg', { message:'0', 
                                });
                                console.log(message);
                              }
                    });
                  }
             
                });
      });
    function doLogin(socket, userId) {
           var con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "123",
            database: "chess"
          });
        con.connect(function(err){
            if(err){
                    console.log('Error connecting to Db');
                        return;
            } else { 
                          
                var query = con.query('select * from users where  user_name=', userId, function(err, result) {
                    console.log('db added');
                    console.log(result);
                            });
                         
                    }
                });
    }
    
    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);
        
        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);
      
       
        var game = {
            id:uuid.v4(), 
           // Math.floor((Math.random() * 100) + 1)
            board: null, 
            users: {white: socket.userId, black: opponentId}

        };
        var con2 = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "123",
            database: "chess"
          });
        con2.connect(function(err){
            if(err){
                    console.log('Error connecting to Db');
            
                return;
            } else { 
                var post3  = {GameId: game.id, Title: 'invite from'+socket.userId+'to'+opponentId ,SecondUser:socket.userId,FirstUser:opponentId };             
                var query = con2.query('INSERT INTO game SET ?', post3, function(err, result) {
                    console.log('db added');
                    console.log(query.sql);
                            });
                        console.log('Connection established');
                    }
                });
        socket.gameId = game.id;
        activeGames[game.id] = game;
        
        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;
      
        console.log('starting game: ' + game.id);
      
        lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
        lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
        
        delete lobbyUsers[game.users.white];
        delete lobbyUsers[game.users.black];   
        
        socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
    });
    
     socket.on('resumegame', function(gameId) {
        console.log('ready to resume game: ' + gameId);
        socket.gameId = gameId;
        var game = activeGames[gameId];
        
        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;
  
        console.log('resuming game: ' + game.id);
        if (lobbyUsers[game.users.white]) {
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            delete lobbyUsers[game.users.white];
        }
        
        if (lobbyUsers[game.users.black]) {
            lobbyUsers[game.users.black] && 
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
            delete lobbyUsers[game.users.black];  
        }
    });
   
    socket.on('move', function(msg) {
        socket.broadcast.emit('move', msg);
        console.log(msg)});
        socket.on('move2', function(a,b,c,d,e) {
        // activeGames[msg.gameId].board = msg.board;
        var con2 = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "123",
            database: "chess"
          });
        con2.connect(function(err){
            if(err){
                    console.log('Error connecting to Db');
                return;
            } else { 
                
                var post3  = {Mfrom : a, Mto :b,Color:d, GameId:c};             
                var query = con2.query('INSERT INTO moves SET ?', post3, function(err, result) {
                    console.log('db added');
                    console.log(query.sql);
                            });
                        console.log('Connection established');
                    }
                });
   
    });
    
    socket.on('resign', function(msg) {
        console.log("resign: " + msg);

        delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
        delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
        delete activeGames[msg.gameId];

        socket.broadcast.emit('resign', msg);
    });
    

    socket.on('disconnect', function(msg) {
        
      console.log(msg);
      
      if (socket && socket.userId && socket.gameId) {
        console.log(socket.userId + ' disconnected');
        console.log(socket.gameId + ' disconnected');
      }
      
      delete lobbyUsers[socket.userId];
      
      socket.broadcast.emit('logout', {
        userId: socket.userId,
        gameId: socket.gameId
      });
    });  
    /////////////////////
    // Dashboard messages 
    /////////////////////   
    socket.on('dashboardlogin', function() {
        console.log('dashboard joined');
        socket.emit('dashboardlogin', {games: activeGames}); 
    });      
});
 
http.listen(port, function() {
    console.log('listening on *: ' + port);
});