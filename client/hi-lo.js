
////////// Main client application logic //////////

//////
////// Utility functions
//////

var player = function () {
    return Players.findOne(Session.get('email'));
};


var emailEntryError = "Email address is invalid, please re-enter.";

function validateEmail(email) {
    if (email == null || email == '')
        return false;

    // email validation regex borrowed from: http://so.devilmaycode.it/jquery-validate-e-mail-address-regex/
    var emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/;
    if (emailRegex.test(email))
        return true;

    return false;
}


function getPlayerEmail() {
    if (Session.get('playerEmail'))
        return Session.get('playerEmail');
    if ($.cookie('playerEmail'))
        return $.cookie('playerEmail');
    if (Modernizr.localStorage && localStorage.getItem('playerEmail'))
        return localStorage.getItem('playerEmail');

    return null;
}

function setPlayerEmail(email) {
    Session.set('playerEmail',email);        
    if ($.cookie) {
        $.cookie('playerEmail', email);
        return true;
    }
    if (Modernizr.localStorage) {
        localStorage.setItem('playerEmail', email);
        return true;
    }

    // cookie support and localStorage support both fail - can't let player play the game
    return false;
}

function closeCurrentPlayerSession() {
    Session.set('playerEmail',null);
    if ($.cookie)
        $.cookie('playerEmail', null);
    if (Modernizr.localStorage)
        localStorage.setItem('playerEmail', null);
}

function showNewPlayerModal() {
    // destroy any currently-registered email address from the session / cookie / localStorage 
    closeCurrentPlayerSession();

    $("#gameStatus div.gameInfo span.outcome").text(null);
    $("#gameStatus").css('visibility','hidden');
    $("#outcome").text(null);
    $("#winnings").css('visibility','hidden');
    $("#winningsHeader").text(null);
    $("#winningsTally").text(null);
    $("#playingAreaCards .leftColumn").css('visibility','hidden');
    $("#playingAreaCards .centerColumn").css('visibility','hidden');
    $("#playingAreaCards .rightColumn").css('visibility','hidden');

    if ( $('#playerStatus').is(':visible') )
        $('#playerStatus').slideUp('slow');

    // show the modal to allow the user to enter a new email and play the game
    $("#dialog-modal").show();
    $("#dialog-modal").dialog({
        height: 200, 
        width: 500, 
        modal: true, 
        closeOnEscape: true, 
        autoOpen: true 
    });
}

function hideNewPlayerModal() {
    $("#currentPlayer").text( getPlayerEmail() );
    if ( !$('#playerStatus').is(':visible') ) {
        $("#playerStatus").css('visibility','visible');
        $('#playerStatus').slideDown('slow');
    }
    $("#playerStatus").css('visibility','visible');
    $("#playingAreaCards").css('visibility','visible');
    $("#gameStatus div.gameInfo span.outcome").text(null);
    $("#gameStatus").css('visibility','hidden');
    $("#outcome").text('');
    $("#winnings").css('visibility','hidden');
    $("#winningsHeader").text(null);
    $("#winningsTally").text(null);
    $("#playingAreaCards .leftColumn").css('visibility','visible');
    $("#playingAreaCards .centerColumn").css('visibility','visible');
    $("#playingAreaCards .rightColumn").css('visibility','visible');

    $("#dialog-modal").dialog("close"); // close the modal, begin the game
}


function testGuess() {
    return faceUpCard.compareTo(faceDownCard);
}


//////
////// client-side display and game functionality logic
//////
if (Meteor.isClient) {

    // once we have rendered the new player dialog box, display it 
    // as a modal if there is no playerEmail found in the Session
    Template.newPlayerDialogTemplate.rendered = function() {
        var foundEmail = getPlayerEmail();
        var isEmailValid = validateEmail(foundEmail);
        if ( foundEmail === null || typeof(foundEmail) === undefined || !isEmailValid )
            showNewPlayerModal();
    };

    // when a player submits their email to start a new hame, register and save their email address
    Template.newPlayerDialogTemplate.events({
        // respond to submit events, and also to the user clicking the "Play" button
        'click #play, submit' : function(evt) {
            var alreadyTestedEmail = false;
            var email = $("#userEmail").val().trim();
            // hide sections and prompt for correct email if value was invalid
            if (!validateEmail(email)) {                
                $("#error").show();
                $("#error").text(emailEntryError);                
                // focus on the email entry field
                $("#userEmail").select();
                $("#userEmail").focus();
            }
            // email is valid, register email and close dialog box, begin game
            else {
                var player_id = null;

                // check if there is an existing player with the same email address already in the database
                var priorPlayersMatchingEmail = Players.find({"email": email}).fetch();

                // update the player if we found one already
                if (priorPlayersMatchingEmail != null && priorPlayersMatchingEmail.length > 0) {
                    var priorPlayer = priorPlayersMatchingEmail[0];
                    //player_id = Players.update(priorPlayer, {$set: {maxScore: priorPlayer.maxScore+1, currentScore: 0, streak: 0, idle: false}});
                    player_id = Players.update(priorPlayer, {$set: {currentScore: 0, streak: 0, idle: false}});
                }
                // otherwise add a new player with the specified email to the database
                else {
                    var newPlayer = { "email": email, currentScore: 0, maxScore: 0, streak: 0, idle: false };
                    player_id = Players.insert(newPlayer);
                }
                Session.set('email',email);

                if ( !setPlayerEmail(email) ) {
                    alert('Sorry, your browser either does not support cookies or localStorage; can\'t let you play. Please try a newer browser.');
                    exit();                
                }
                $("#error").hide();
                $("#error").text('');
                hideNewPlayerModal();

                // start up a new game
                beginNewGame();
            }
            // don't actually perform an HTTP POST/GET submission
            evt.preventDefault();
            evt.stopPropagation();
        },
    });


    Template.playingAreaCardsTemplate.events({
        'click span.arrowUp, click span.arrowDown' : function(evt) {
            // when we compare the cards to determine if the player wins or not, we are comparing the faceUpCard
            // to the faceDownCard, and we need to set the win/lose comparator based on whether the player
            // guessed higher or lower
            var greaterComparator = 1;
            var lesserComparator = -1;

            if (evt.currentTarget.className == "arrowUp") {
                greaterComparator = 1;
                lesserComparator = -1;
            }
            else if (evt.currentTarget.className == "arrowDown") {
                greaterComparator = -1;
                lesserComparator = 1;
            }

            // fade in the face-down card's front side so we can see it's rank
            $("#faceDownCard > div.card > div.cardback").css('visibility','hidden');
            $("#faceDownCard > div.card > div.cardfront").css('visibility','visible');
            $("#faceDownCard > div.card > div.cardfront").fadeIn("slow");

            var justWon = 0;
            var game_status_summary = "";
            var amount_won_text = "";
            var amount_won = "";

            // perform the comparison of the faceUpCard and the faceDownCard
            var cardComparisonResult = testGuess();

            // player lost - faceUpCard is of a higher rank than faceDownCard, but the player guessed that the faceDownCard was higher than faceUpCard
            if (cardComparisonResult == greaterComparator) {
                curStreak = 0;
                game_status_summary = "You lost!";
            }
            // player wins - faceUpCard is of a lower rank than faceDownCard, and the player guessed that the faceDownCard was higher than faceUpCard
            else if (cardComparisonResult == lesserComparator) {
                curStreak++;
                if (curStreak == 1) {
                    justWon = 100;
                } else if (curStreak > 1) {
                    justWon = (curScore * 2);
                }
                curScore += justWon;
                game_status_summary = "You win!";
                amount_won_text = "You just won: ";
                amount_won = "$"+ justWon;
            }

            // get a cursor to the current player in the Minimongo DB so we can update them with the round results
            //
            // (NOTE: we should be able to directly update a user without first obtaining a DB cursor, but
            // I was unable to get this to work despite several different attempts/methods tried at doing do)
            var priorPlayersMatchingEmail = Players.find({"email": Session.get('email')}).fetch();

            // update the player in the Minimongo DB with the results of the last round
            if (priorPlayersMatchingEmail != null && priorPlayersMatchingEmail.length > 0) {
                var priorPlayer = priorPlayersMatchingEmail[0];
                Players.update({'email': Session.get('email')},
                               {$set:
                                    {'currentScore'  : curScore,
                                     'currentStreak' : curStreak,
                                     'maxScore'      : Math.max(curScore, priorPlayer.maxScore),
                                     'maxStreak'     : Math.max(curStreak, priorPlayer.maxStreak)
                                    }
                               },
                               {multi: false} // just update a single document record in the DB
                              );
            }

            // show the game status summary, and then show/hide all the other game outcome details
            $("#gameStatus").css('visibility','visible');
            $("#gameStatus div.gameInfo span.outcome").fadeIn("slow", function(){ $(this).text(game_status_summary); });
            $("#higher span.arrowUp").css('visibility','hidden');
            $("#lower span.arrowDown").css('visibility','hidden');
            $("#winnings").css('visibility','visible');
            $("#winningsHeader").css('visibility','visible');
            $("#winningsTally").css('visibility','visible');
            $("#winningsHeader").text(amount_won_text).fadeIn("slow");
            $("#winningsTally").text(amount_won).fadeIn("slow");

            // remove the current cards, and automatically start a new round after a short delay
            window.setTimeout(function(){

                alert('drawing new cards to start the next round...');

                // show a little div informing the player that the next round is about to begin...


                // fade out the current shown cards, remove them from their parent container divs, hide the up/down arrows, update the scoreboard
                $("#faceUpCard").children().remove();
                $("#faceDownCard").children().remove();
                continueGame();
            }, 2500);
        },
    });

    // when showing the playerStatus div, look up and display the email that the user is currently playing as
    Template.playerStatusTemplate.helpers({
        player_email: function() {
            return getPlayerEmail();
        },
    });
    
    // if the user clicks the "change player" text, destroy the Session/localStorage/cookie 
    // for the current player, and re-trigger the pop-up new player modal 
    Template.playerStatusTemplate.events({        
        'click a#playerChange' : function() {
            showNewPlayerModal();
        },
    });

    // show or hide the player status div based on whether 
    // or not we have a playerEmail found in the Session
    Template.playerStatusTemplate.rendered = function() {
        var playerEmail = getPlayerEmail();
        var isValidEmail = validateEmail(playerEmail);
        if (!isValidEmail) {
            if ( $('#playerStatus').is(':visible') ) {
                $('#playerStatus').slideUp('slow');
            }            
        } else {
            $('#playerStatus').slideDown('slow');
        }
    };

    // click event to roll up/down the header description div, and adjust the toggle chevron up/down direction
    Template.headerTemplate.events({
        'click #header-toggle' : function () {
            if ( $('#header-description').is(":visible") ) {
                $('#header-description').slideUp('slow', function() {
                    $('#header-toggle').toggleClass('expanded-down','expanded-up');
                });
            } else {
                $('#header-description').slideDown('slow', function() {
                    $('#header-toggle').toggleClass('expanded-down','expanded-up');
                });
            }
        }, 
    });

}



Template.scoreboardTemplate.players = function() {
    // unfortunately Minimongo doesn't support limiting query result sets, so we need 
    // to query for and return ALL of the players in the sorted order that we want 
    // (highest score to lowest score), and then return just the top 15 scores to the 
    // template by slicing off the top of the query result
    //
    //   see: http://stackoverflow.com/questions/10157454/meteor-cannot-observe-queries-with-skip-or-limit

    // fetch array of all the players sorted from highest score to lowest score, 
    // then by email (in case multiple players have the same score)
    var players = Players.find({}, {sort: {maxScore: -1, email: 1}} ).fetch();

    // return only the first 15 players to the template
    return players.slice(0,15);
};



//////
////// Initialization
//////
Meteor.startup(function () {

    // subscribe to all the players
    Meteor.autosubscribe(function () {
        Meteor.subscribe('players');
    });

    // send keepalives so the server can tell when we go away.
    //
    // XXX this is not a great idiom. meteor server does not yet have a
    // way to expose connection status to user code. Once it does, this
    // code can go away.
    Meteor.setInterval(function() {
        if (Meteor.status().connected) 
            Meteor.call('keepalive', Session.get('email'));
    }, 20*1000);

});
