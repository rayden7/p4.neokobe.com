p4.neokobe.com
==============

code repo for Assignment 4 of CSCI-E 75 Dynamic Web Applications class

This project will be an implementation of the card game "Hi-Lo", which is essentially a mini-game that I have seem
played on Zynga Poker.  What is unique about this project is that I will be using the Meteor (www.meteor.com)
JavaScript framework to make this a dynamic client/server application where updates will be pushed to other people's
browsers to see updates (e.g., they won't need to refresh their browsers to see changes made at the data layer).

This project is served up from a free demo Meteor website which the Meteor development team is offering for
free: the code is at:

    http://dkilleffer-cscie75-p4-app.meteor.com/

Note that http://p4.neokobe.com will redirect to http://dkilleffer-cscie75-p4-app.meteor.com/ (this is because my
current hosting account at A Small Orange will not allow you to install/run Meteor, and I don't have enough to pay
for a VPS).

To run this project, you must first have Meteor installed on your local machine.
Follow the steps listed here to install Meteor locally:

    http://docs.meteor.com/#quickstart

Once you've installed Meter, try out some of the examples to ensure that your installation is working properly -
you can download and try out the examples here:

    http://www.meteor.com/examples/

Now that you've downloaded and installed Meteor, and gotten one of the samples to run, you can download and install
this Hi-Lo application.  Download all the source files from Github, and unzip them in a directory called "hilo".
Then run these commands from a terminal:

    $ meteor create hilo

    $ cp -R [directory_where_you_unzipped_sources] hilo/

    $ cd hilo

    $ meteor
    Runnong on: http://localhost:3000/

Now open up a local browser and navigate to http://localhost:3000/.  Go ahead, open up TWO browsers!  When you enter
your email address and start a game, you will begin to see the email and your high score show up in both browser
windows - no refresh of the window necessary!  Meteor is automatically pushing updates to the Players collection
(see model.js) down to all browsers that are connected to the running Meteor server on http://localhost:3000/.



// TODO: enter more explanation here...



