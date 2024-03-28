TODO
* draft second level, play through first 2, measure time, check difficulty, put save game aside for later
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
* scale sound volume for hunter sounds based on distance

Balance Plan: conservation of XP
          level + tier that should get 1-2 deaths in some combats (2/5?) and 2-3 deaths on boss
                replacement tier (even if not L2)
Floor 1 : T0L0  T0
  T0L0/T0L1 (12 abilities leveled up +1) - (except, we start with effectively +12xp - need 4 less on this floor)
Floor 2 : T0L1  T0
  T1L2/T1L3/T2L1 (12 abilities leveled up +2 and 6 deaths @ L3) - (need 8 less on this floor)
Floor 3 : T1L0  T1
  T1L0/T1L1 (12+1)
Floor 4 : T1L1  T1
  T1L1/T1L2/T2L0 (12+2 / 6d)
Floor 5 : T2L0  T2
  T2L0/T2L1/T2L2 (12+1, 12+2)
Boss fight : T2L2

XP Cost - see doc

Playtest Feedback
* too many monsters on first floor - maybe aim for ~7 encounters per floor? or more avoidable?

Finish up
* remove dbg:kill buttons!
* title screen
* hi score list

Polish
* fill in empty space in UI with some noise at least
* show explore percent (and monster count?) on minimap
* add unlockable doors to get back to the Solitude entrances
* consistent ability icons
* more player faces
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
* tooltip width and markdown not playing correctly, probably also height

People's games to check out:
* YouDoYouBuddy - slay the spire
* Yomigael - https://surt-r.itch.io/dragon-ruins
