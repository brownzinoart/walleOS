# Simon Says Game in CSS & jQuery

A Pen created on CodePen.

Original URL: [https://codepen.io/kristarling/pen/mPdoON](https://codepen.io/kristarling/pen/mPdoON).

Fully-functioning Simon game based on the 1978 original.

Defeat level 20 by repeating the tunes to win.
Play on 'strict' mode for an added challenge - no mistakes allowed!
Game speed increases at levels 5 and 10.

#Version 1.1

###gameplay
- fixed bug with strict mode
- added more information to digital display
- altered user lockout time to allow speedier button presses
- button effects stop on mouseup (after very short delay to simulate a physical button)
- added copious annotation & explanation to code

#Version 1.2

### improved graphics:
- game now positioned in center of window
- added subtle lightbulb glow inside buttons
- added border detail to brand area
- buttons now move when pressed
- altered ON/OFF switch appearance
- various shadow/border alterations for realism
- altered 'm' in the branding to lower case

###gameplay
- overall game speed increased
- game speed now increments at higher levels
- fixed bug which allowed user to mess with Simon's turn
- display now flashes to indicate if response sequence was correct

#Version 1.3

### optimizations
- small improvements for mobile devices - more to come

###audio
- reduced the volume of all the sounds

### annotation insanity
- All the JS/CSS annotations you could possibly hope for

#Version 1.3.1

- ditched Haml in favor of Jade/Pug (Jade is actually officially now called 'pug' just not on codepen yet)
- fixed minor bug which allowed strict mode light to come on when game was off
- subsetted fonts for slightly less page weight

#Hotfix 1.3.1.1

- fixed start switch not displaying correctly in Chrome on OSX 10.11

#Wishlist for Future Updates

- audio toggle switch
- display '888' LED effect all the time, even when on.
- flash STR to display when Strict mode is enabled
- add 'cheat' mode which displays the color sequence
- log high score
- improve mobile and browser compatibility
- free play mode - allow user to play to 999 
- scale game for mobile devices
- add more background atmosphere for retro charm
- some kind of logo might be nice

#Known Issues

###minor issues:
- display will show '01' if game is turned off immediately after start
- on/off switch displays incorrectly in some instances of chrome on OSX
- you can cheat your way to level 5+ by rapidly mashing the start button
- the display blink has no cleartimeout to prevent odd behaviour


#More Info
- if you find any bugs, please leave a comment and I will fix it.
- if you have suggestions for improving code, please tell me, I'm still learning