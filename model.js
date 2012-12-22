//////////
////////// Shared code (client and server) //////////
//////////

Players = new Meteor.Collection('players');
// {
//     email: 'rayden7@gmail.com', // unique identifier for player
//     currentScore: 10000,
//     currentStreak: 3,  // how many consecutive times the player guess the correct hi/lo value
//     maxScore: 10000,
//     maxStreak: 8,    // the most number of consecutive correct guesses the player has ever had
//     idle: false,
// }


var faceUpCard   = null;  // represents the currently selected, randomly chosen face-up card
var faceDownCard = null;  // represents the currently selected, randomly chosen face-down card
var numDecks     = 1;     // how many standard 52-card decks to use when selecting new cards
var curStreak    = 0;     // how many times did the player guess correctly
var curScore     = 0;     // player's current score
var numShuffles  = 10;    // how many times to shuffle the cards when calling "shuffleDeck"
var cardsValid   = false; // boolean denoting whether or not the currently selected faceUpCard and faceDownCard are valid
var deck         = new Stack(); // a standard deck of 52 cards


//////////
////////// main game logic
//////////

// Create a new deck of cards and shuffle them
function newDeck() {
    deck = new Stack();
    deck.makeDeck(numDecks);
    deck.shuffle(numShuffles);
}

// recursive function that will draw two cards at a time, check that they are
// valid, and continue to draw more cards until two suitable ones are selected
function drawCards(currentDeck) {

    var potentialFaceUpCard, potentialFaceDownCard;

    console.log("called drawCards(): about to select the cards...\n\ncardsValid: ["+cardsValid+"]\ncurrentDeck.cardCount(): ["+currentDeck.cardCount()+"]");

    // if we don't have enough cards to go on, create a new deck and recursively
    // call drawCards() until we have drawn valid playing cards for the game
    if (currentDeck.cardCount() <= 2 ) {
        newDeck();
        drawCards(deck);
    }
    else if (currentDeck.cardCount() >= 3) {
        potentialFaceUpCard = deck.deal();
        potentialFaceDownCard = deck.deal();

        if (!testCardsValid(potentialFaceUpCard,potentialFaceDownCard)) {
            drawCards(currentDeck);
        } else {
            faceUpCard = potentialFaceUpCard;
            faceDownCard = potentialFaceDownCard;
            return;
        }
    } else {
        drawCards(currentDeck);
    }
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

// start up a new game - same as calling continueGame(), but initializes a new deck of cards first
function beginNewGame() {
    newDeck();

    continueGame();
}

// continue an existing game
function continueGame() {

    // draw two cards, as long as:
    //
    // - the first card, the face-up card, IS NOT an Ace, or a 2 (we can't have the face-up card not
    //       have a higher or lower card or the game doesn't work)
    // - the second card, the face-down card, IS NOT the same rank as the first card
    drawCards(deck);

    setUpGameBoard();
}


function setUpGameBoard() {

    // when first setting up the game board, hide the divs and spans that are for
    // showing game output, and ensure that the up/down selection arrows are visible
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

    // get the HTML DIVs for the current cards
    var cardNodeUp = faceUpCard.createNode();
    var cardNodeDown = faceDownCard.createNode();

    console.log("setUpGameBoard():\n\tfaceUpCard: [" + faceUpCard.toString() + "]\n\tcardNodeUp: [" + cardNodeUp + "]\n\tfaceDownCard: [" + faceDownCard.toString() + "]\n\tcardNodeDown: ["+cardNodeDown+"]");

    ////
    //// face-Up card display
    ////
    $("#faceUpCard").children().remove();
    $("#faceUpCard").show();
    $("#faceUpCard").css('visibility','visible');
    $("#faceUpCard").append(cardNodeUp);
    $("#faceUpCard > div.card").hide();
    $("#faceUpCard > div.card").slideDown("slow");  // show the face-up card by sliding down slowly

    ////
    //// face-down card display
    ////
    $("#faceDownCard").children().remove();
    $("#faceDownCard").show();
    $("#faceDownCard").css('visibility','visible');
    $("#faceDownCard").append(cardNodeDown);
    $("#faceDownCard > div.card").hide();
    $("#faceDownCard > div.card").slideDown("slow"); // show the back of the face-down card
}


if (Meteor.isServer) {
    // publish all the non-idle players.
    Meteor.publish('players', function () {
        return Players.find({idle: false});
    });

}
