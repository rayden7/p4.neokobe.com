
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


//var faceUpCard = function() { };
//var faceDownCard = function() { };
var faceUpCard, faceDownCard = null;

var numCards = 52;  // 1 standard sized deck has 52 cards
var numPacks = 1;  // 1 standard sized deck has 52 cards

// determines how many consecutive wins before bumping up to the next prizeTier
var winningTiers = new Array(2,4,6,8,10,12,14,18,20,25);
var prizeTiers = new Array(100,300,500,1000,5000,10000,50000,100000,1000000,5000000);
var gameLevel = 0;

//var numCardsPerDeck = 52;
var numDecks = 1;

var numShuffles = 10;  // how many times to shuffle the cards when calling "shuffleDeck"


// this is used to insert a brief delay between drawing/comparing cards
// (if we don't have a delay, then the operations occur too quickly and
// the game feels less like a game and more like a computer playing
// against itself  :-)
var millisecondOperationDelay = 750;

// tracks what operations are waiting to be called by setTimeout()
// (and used so any existing timed operations can be cleared out when the game ends)
var delayOperation;


var deck = new Stack();  // a deck of cards

var cardsValid = false;



//////////
////////// main game logic
//////////

function newDeck() {
    // Create a new deck of cards and shuffle them
    deck = new Stack();
    deck.makeDeck(numDecks);
    deck.shuffle(numShuffles);
}

function drawCards(currentDeck) {

    var potentialFaceUpCard, potentialFaceDownCard;

    //alert("called drawCards(): about to select the cards...\n\ncardsValid: ["+cardsValid+"]\ncurrentDeck.cardCount(): ["+currentDeck.cardCount()+"]");
    console.log("called drawCards(): about to select the cards...\n\ncardsValid: ["+cardsValid+"]\ncurrentDeck.cardCount(): ["+currentDeck.cardCount()+"]");

    // if we don't have enough cards to go on, create a new deck and recursively
    // call drawCards() until we have drawn valid playing cards for the game
    if (currentDeck.cardCount() <= 1 ) {
        newDeck();
        drawCards(deck);
    }
    else if (currentDeck.cardCount() >= 2) {

        potentialFaceUpCard = deck.deal();
        //if (potentialFaceUpCard.rank == "A" || potentialFaceUpCard.rank == "2") drawCards(currentDeck);
        potentialFaceDownCard = deck.deal();
        //if (potentialFaceDownCard.rank == potentialFaceUpCard.rank) drawCards(currentDeck);

        if (!testCardsValid(potentialFaceUpCard,potentialFaceDownCard)) drawCards(currentDeck);

        faceUpCard = potentialFaceUpCard;
        faceDownCard = potentialFaceDownCard;
    }

    return;
}

// enforce that the FIRST card passed is not an "extreme" card on either end (e.g., not an Ace nor a 2, because then
// the other card will very obviously be higher or lower and there wouldn't be any fun/challenge to the guessing game),
// and that the cards are not of the same rank
function testCardsValid(cardOne, cardTwo) {

    if (cardOne.rank == "A" || cardOne.rank == "2")
        return false;
    if (cardOne.rank == cardTwo.rank)
        return false;

    // both conditions satisfied - cards are valid!
    return true;
}

// start up a new game
function beginNewGame() {
    //alert('starting up a new game!');
    //console.log('starting up a new game!');

    newDeck();

    //alert('just created a new deck of cards, containing: ' + deck.toString() );
    //console.log('just created a new deck of cards, containing: ' + deck.toString() );

    // draw two cards, as long as:
    //
    // - the first card, the face-up card, IS NOT an Ace, or a 2 (we can't have the face-up card not
    //       have a higher or lower card or the game doesn't work)
    // - the second card, the face-down card, IS NOT the same rank as the first card
    drawCards(deck);

    //alert("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");
    //console.log("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");

    // TODO: manipulate the templates and DOM to show cards appropriately

    setUpGameBoard();

}

function setUpGameBoard() {

    alert("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");
    // should have valid faceUpCard and faceDownCard values

    var cardNodeUp = faceUpCard.createNode();
    var cardNodeDown = faceDownCard.createNode();

    alert("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tcardNodeUp: [" + cardNodeUp + "]\n\tfaceDownCard: [" + faceDownCard.toString() + "]\n\tcardNodeDown: ["+cardNodeDown+"]");
    console.log("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tcardNodeUp: [" + cardNodeUp + "]\n\tfaceDownCard: [" + faceDownCard.toString() + "]\n\tcardNodeDown: ["+cardNodeDown+"]");

    $("#faceUpCard").children().remove();
    $("#faceUpCard").show();
    $("#faceUpCard").css('visibility','visible');
    //$("#faceUpCard").append( faceupCard.createNode() );
    $("#faceUpCard").append( cardNodeUp );
    //$("#faceUpCard").append( cardNodeUp ).slideDown( 'slow' );

    //var cardUp = $(cardNodeUp).hide();
    //cardUp.appendTo($("#faceUpCard"), function(){ cardUp.slideDown('slow'); } );


    // for the face down-card, we need to do some manipulation of the inner content to show the div classed
    // with "cardback", and hide the div classed with "cardfront" so that it appears face-down

//    <div class="cardback {{cardColor}}"></div>
//    <div class="cardfront {{cardColor}}">


//    alert('cardNodeDown BEFORE flipping face-down:\n\n' + cardNodeDown);
//    $(cardNodeDown).children('.cardfront').hide();
//    $(cardNodeDown).children('.cardback').show();
//    alert('cardNodeDown AFTER flipping face-down:\n\n' + cardNodeDown);

    $("#faceDownCard").children().remove();
    $("#faceDownCard").show();
    $("#faceDownCard").css('visibility','visible');
    //$("#faceUpCard").append( faceupCard.createNode() );
    $("#faceDownCard").append( cardNodeDown );

    //$(cardNodeDown).hide();
    //$(cardNodeDown).appendTo($("#faceDownCard")).slideDown('slow');


}


/*

Meteor.methods({
    newDeck : function() {
        // Create a new deck of cards and shuffle them
        deck = new Stack();
        deck.makeDeck(numDecks);
        deck.shuffle(numShuffles);
    },

    drawCards : function(currentDeck) {

        //var cardsValid = false;
        var potentialFaceUpCard, potentialFaceDownCard;
        //var k = numCardsPerPlayer;

        //alert("called drawCards(): about to select the cards...\n\ncardsValid: ["+cardsValid+"]\ncurrentDeck.cardCount(): ["+currentDeck.cardCount()+"]");
        console.log("called drawCards(): about to select the cards...\n\ncardsValid: ["+cardsValid+"]\ncurrentDeck.cardCount(): ["+currentDeck.cardCount()+"]");

        // if we don't have enough cards to go on, create a new deck
        if (currentDeck.cardCount() <= 1 ) {


            //newDeck();
            Meteor.call('newDeck');
            drawCards(deck);
        }

        else if (currentDeck.cardCount() >= 2) {

            // if there aren't enough cards to deal out two more,
            potentialFaceUpCard = deck.deal();
            if (potentialFaceUpCard.rank == "A" || potentialFaceUpCard.rank == "2") drawCards(currentDeck);
            potentialFaceDownCard = deck.deal();
            if (potentialFaceDownCard.rank == potentialFaceUpCard.rank) drawCards(currentDeck);

            //cardsValid = true;
            faceUpCard = potentialFaceUpCard;
            faceDownCard = potentialFaceDownCard;
        }

        //if (cardsValid) {
        //    faceUpCard = potentialFaceUpCard;
        //    faceDownCard = potentialFaceDownCard;
        //}
    },

    // start up a new game
    beginNewGame : function () {

        //alert('starting up a new game!');
        console.log('starting up a new game!');

        newDeck();

        //alert('just created a new deck of cards, containing: ' + deck.toString() );
        console.log('just created a new deck of cards, containing: ' + deck.toString() );

        // draw two cards, as long as:
        //
        // - the first card, the face-up card, IS NOT an Ace, or a 2 (we can't have the face-up card not
        //       have a higher or lower card or the game doesn't work)
        // - the second card, the face-down card, IS NOT the same rank as the first card
        drawCards(deck);

        //alert("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");
        console.log("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");

        // TODO: manipulate the templates and DOM to show cards appropriately
    }
});
*/


if (Meteor.isServer) {
    // publish all the non-idle players.
    Meteor.publish('players', function () {
        return Players.find({idle: false});
    });

}
