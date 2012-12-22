
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
//     currentScore: 10000,
//     maxScore: 10000,
//     streak: 3, // how many consecutive times the player guess the correct hi/lo value 
//     idle: false, 
// }


var faceUpCard, faceDownCard = null;

var numCards = 52;  // 1 standard sized deck has 52 cards
var numPacks = 1;  // 1 standard sized deck has 52 cards

//// determines how many consecutive wins before bumping up to the next prizeTier
//var winningTiers = new Array(2,4,6,8,10,12,14,18,20,25);
//var prizeTiers = new Array(100,300,500,1000,5000,10000,50000,100000,1000000,5000000);
//var gameLevel = 0;

var numDecks = 1;


var curStreak = 0;
var curScore = 0;

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

// recursive function that will draw two cards at a time, check that they are
// valid, and continue to draw more cards until two suitable ones are selected
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
        potentialFaceDownCard = deck.deal();

        //// DEBUGGING
        //potentialFaceUpCard = new Card("K", "D");
        //potentialFaceDownCard = new Card("Q", "H");

        if (!testCardsValid(potentialFaceUpCard,potentialFaceDownCard))
            drawCards(currentDeck);

        faceUpCard = potentialFaceUpCard;
        faceDownCard = potentialFaceDownCard;
    }

    return;
}

// enforce that the FIRST card passed is not an "extreme" card on either end (e.g., not an Ace nor a 2, because then
// the other card will very obviously be higher or lower and there wouldn't be any fun/challenge to the guessing game),
// and that the cards are not of the same rank
function testCardsValid(cardOne, cardTwo) {

    if (cardOne.rank == "A" || cardOne.rank == "2" || cardOne.rank == cardTwo.rank)
        return false;

    // all conditions satisfied - cards are valid!
    return true;
}

// start up a new game
function beginNewGame() {
    //alert('starting up a new game!');
    //console.log('starting up a new game!');

    newDeck();

    continueGame();

/*
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

    setUpGameBoard();
*/

}


// continue an existing game
function continueGame() {

    // draw two cards, as long as:
    //
    // - the first card, the face-up card, IS NOT an Ace, or a 2 (we can't have the face-up card not
    //       have a higher or lower card or the game doesn't work)
    // - the second card, the face-down card, IS NOT the same rank as the first card
    drawCards(deck);

    //alert("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");
    //console.log("cards selected:\n\tfaceUpCard: ["+faceUpCard.toString()+"]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");

    setUpGameBoard();
}


function setUpGameBoard() {

    //alert("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tfaceDownCard: ["+faceDownCard.toString()+"]");
    // should have valid faceUpCard and faceDownCard values

    $("#gameStatus div.gameInfo span.outcome").text('');
    $("#gameStatus").css("visibility","hidden");
    $("#winningsHeader").text('');
    $("#winningsTally").text('');
    $("#winnings").css('visibility','hidden');
    $("#winningsHeader").css('visibility','hidden');
    $("#winningsTally").css('visibility','hidden');
    $("#selectionArea").show();
    $("#higher span.arrowUp").css('visibility','visible');
    $("#lower span.arrowDown").css('visibility','visible');


    // remove any current cards them from their parent container divs so we can show the new ones
    $("#faceUpCard").children().remove();
    $("#faceDownCard").children().remove();

    var cardNodeUp = faceUpCard.createNode();
    var cardNodeDown = faceDownCard.createNode();

    //alert("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tcardNodeUp: [" + cardNodeUp + "]\n\tfaceDownCard: [" + faceDownCard.toString() + "]\n\tcardNodeDown: ["+cardNodeDown+"]");
    console.log("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tcardNodeUp: [" + cardNodeUp + "]\n\tfaceDownCard: [" + faceDownCard.toString() + "]\n\tcardNodeDown: ["+cardNodeDown+"]");

    $("#faceUpCard").children().remove();
    $("#faceUpCard").show();
    $("#faceUpCard").css('visibility','visible');


    // show the face-up card by sliding down slowly
    $("#faceUpCard").append(cardNodeUp);
    $("#faceUpCard > div.card").hide();
    $("#faceUpCard > div.card").slideDown("slow");


    // show the back of the face-down card
    $("#faceDownCard").children().remove();
    $("#faceDownCard").show();
    $("#faceDownCard").css('visibility','visible');
    $("#faceDownCard").append(cardNodeDown);
    $("#faceDownCard > div.card").hide();
    $("#faceDownCard > div.card").slideDown("slow");
}



if (Meteor.isServer) {
    // publish all the non-idle players.
    Meteor.publish('players', function () {
        return Players.find({idle: false});
    });

}
