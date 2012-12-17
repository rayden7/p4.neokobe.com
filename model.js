
////////// Shared code (client and server) //////////

//Games = new Meteor.Collection('games');
// { board: ['A','I',...], clock: 60,
//   players: [{player_id, name}], winners: [player_id] }
//
//   player: [{player_id, name}], num_consecutive_wins: 4, face_up_card: Card, face_down_card: Card, }

//Words = new Meteor.Collection('words');
//// {player_id: 10, game_id: 123, word: 'hello', state: 'good', score: 4}

Players = new Meteor.Collection('players');
// {
//     email: 'rayden7@gmail.com', 
//     game_id: 123, 
//     score: 10000, 
//     streak: 3, // how many consecutive times the player guess the correct hi/lo value 
//     idle: false, 
// }


var faceUpCard = function() {

};

var faceDownCard = function() {

};


Meteor.methods({

    // TODO: insert main Meteor server-side methods here    

});


if (Meteor.isServer) {
    // publish all the non-idle players.
    Meteor.publish('players', function () {
        return Players.find({idle: false});
    });

}
