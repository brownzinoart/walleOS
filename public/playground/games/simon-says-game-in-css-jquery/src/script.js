const b = ["#green", "#red", "#blue", "#yellow"], // our button IDs

// our sounds, added using Buzz.js
// sounds were made using http://www.bfxr.net/
// most mobile devices will only load sounds after user presses button - simon can't play them until the user has
      vol = 30,
      green = new buzz.sound("https://s3-us-west-2.amazonaws.com/s.cdpn.io/507450/A.wav", {volume: vol}),
      red = new buzz.sound("https://s3-us-west-2.amazonaws.com/s.cdpn.io/507450/B.wav", {volume: vol}),
      blue = new buzz.sound("https://s3-us-west-2.amazonaws.com/s.cdpn.io/507450/D.wav", {volume: vol}),
      yellow = new buzz.sound("https://s3-us-west-2.amazonaws.com/s.cdpn.io/507450/E.wav", {volume: vol}),
      failSound = new buzz.sound("https://s3-us-west-2.amazonaws.com/s.cdpn.io/507450/Fail.wav", {volume: vol});

$("[name='switch']").bootstrapSwitch(); // on-off switch using http://bootstrap-switch.org
$('input[name="switch"]').on('switchChange.bootstrapSwitch', function(_, s) {
  p = s; // power is a global variable linked to power button state
  if (p) { // if power turned on
    $("#number").addClass("on").html("---"); // turn on display and add dashes
    uSay = sSays = []; // empty user/Simon arrays
    str = 0; // strict mode is global and off by default
  } else { // if power turned off
    $("#number").html("888"); // display LCD off effect
    t = 0; // prevent user from playing when off
    $("#strictlight,#number").removeClass("on"); // turn display & strict light off
  }
});

$("#strict").click(function() { //strict on/off
  if (str) { // if strict is on
    str = 0; // turn it off
    $("#strictlight").removeClass("on"); // turn off strict light
  } else if (p) { // if strict is off but power still on
    str = 1; // turn it on
    $("#strictlight").addClass("on"); // turn on strict light
  }
});

clrLight = function() { // clear all lights/sounds
  $(b.join(", ")).removeClass("active"); // turn off all button lights
  buzz.all().stop(); // stop all sounds
};

const simonTurn = function() { //simon's turn
  t = 0; // block user from pressing buttons
  clrLight(); // stop any active lights/sounds
  uSay = []; // clear user presses
  let s = 450, //set game speed
      x = 1.8; //speed multiplier for game

  if (nR || sSays.length === 0) { // add random button to sequence
    sSays.push(Math.floor((Math.random() * 4))); // generate random number and add to Simon's sequence
  }

  if (sSays.length > 9) { //very fast when user reaches level 10
    x = 1.15;
    $("#number").html(sSays.length); // put number on display
  } else if (sSays.length < 10)
    $("#number").html("0" + sSays.length); // add a 0 in front on display
  if (sSays.length > 4) { //faster when user reaches level 5
    x = 1.25;
  }

  setTimeout(function() { // when Simon's turn is over
    t = 1; // let the user play
  }, sSays.length * (x * s) - 100); // calculated by length of Simon's sequence times the current game speed, minus a little
  for (i in sSays) { // for length of Simon's sequence
    sPlay(i); // play a note
  }
  function sPlay(i) { // Simon plays a note in the tune
    setTimeout(function() { // put some time Between Simon's notes*
      if (p) { // if power is still on
        $(b[sSays[i]]).addClass("active"); // light up the relevant button
        eval((b[sSays[i]].substring(1))).play(); // play the note for that color button
        setTimeout(clrLight, s); // then stop playing note after delay
      }
    }, i * (x * s)); // time between notes
   }
  };

$("#start").click(function() { // Start a game
  clrLight(); // turn off button light/sounds
  uSay = sSays = []; // empty user/Simon arrays
  nR = 1; // start a new round
  if (p) blink();setTimeout(simonTurn, 1000); // start a game if power is on
});

$(b.join(", ")).mousedown(function() { // when user presses button
  if (t && p) { //only work if user's turn & power is on
    uSay.push(b.indexOf("#" + this.id)); // log pressed button to uSay array
    $(this).addClass("active"); // light up pressed button
    let place = uSay.length; // store user array length for use below
    if (uSay[place - 1]^sSays[place - 1]) { // if mistake
      $("#number").html("!!!"); // display exclamation marks
      failSound.play(); // play fail sound
      blink(); // blink the display
      t = nR = 0; // end user turn & do not continue to next round
      setTimeout(clrLight, 1000); // clear buttons
      if (str) uSay = sSays = []; // empty user/Simon arrays on mistake in strict mode
      setTimeout(simonTurn, 2800); // longer delay on failure
    } else if (place === 20) { // if user completes level 20
      $(b.join(", ")).addClass("active"); // turn on all the button lights
      $("#number").html("WIN"); //write 'WIN' on display
      blink(); //blink the display
      setTimeout(blink, 800); // blink it again
      sSays = []; // clear tune ready to start again
      t = 0; // end user turn
      setTimeout(simonTurn, 4000); // extra long delay so user can bask in glory
    } else { // correct
      eval(this.id).play(); // play the sound of button
      if (place === sSays.length) { // & if the sequence is complete
        t = 0; // end user turn
        blink(); // blink display to let user know they've got it right
        setTimeout(clrLight, 1000); // clear buttons
        nR = 1; // proceed to next level
        setTimeout(simonTurn, 1500); // after short delay
      }
    }
  }
}).mouseup(function() { //stop sound/light when user lets go of button
  if (t) setTimeout(clrLight, 200); //add short delay to simulate real button
});

blink = function() { //blink display for start/win/lose events
  let b = 200; // display blink speed
  $("#number").fadeOut(b).fadeIn(b).fadeOut(b).fadeIn(b); // display off on off on
};