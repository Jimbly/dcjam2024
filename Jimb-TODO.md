TODO
* start balancing combat encounters
* placeholder one-time world events that display one of your characters in dialog (just hard-coded index in the event, not even random!)
* Insanity view
  * party portraits to change to monsters - silhouettes
  * ghosts moving through the level
  * dark/postprocess - 16-bit color crunch? - dither?
* final battle
  * no bamf after final battle
  * no sanity loss? only lose condition is all heroes are dead?
* more humanoid choices for front1, since the player picks that!
* dungeon event that tiers-up your leader if still T1 on end of floor 4?
* lose people in rooms of solitude to be replaced
* bamf - if player has only 2 attackers in party, give only attack options (if possible)
* integrate footsteps

Balance Plan: conservation of XP
          level + tier that should get 1-2 deaths in some combats (2/5?) and 2-3 deaths on boss
                replacement tier (even if not L3)
Floor 1 : T1L1  T1
Floor 2 : T1L3  T1
Floor 3 : T2L1  T2
Floor 4 : T2L3  T2
Floor 5 : T3L1  T3
Boss fight : T3L3

XP Cost
T1 0 / 1 / 3   (+1/2)
T2 3 / 5 / 9   (+2/4)
T3 9 / 13 / 21 (+4/8)


Playtest Feedback
* too many monsters on first floor - maybe aim for ~7 encounters per floor? or more avoidable?

Finish up
* remove dbg:kill buttons!
* title screen
* hi score list

Polish
* consistent ability icons
* tooltip on Sanity and XP displays, explaining mechanics
* add sanity icon to spritesheet and use in dialogs
* scroll area for combat log when needed
* change wander to only wander between 2 spaces, start and random neighbor, then can enable on all
* moving on full map?
* darken read notes on the minimap
* animate monsters
* shake things when people get hit
* long-press on ability is not focusing and showing preview
  * also, make sure it all works well with controller
* scrolling starfield

Post-game fixes / polish
* bias features for simple billboard details
* reorganize all of the example entities to use a spritesheet
* add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* tooltip width and markdown not playing correctly, probably also H