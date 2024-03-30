TODO
* title screen - ship & dice?
* favicon
* fix window title to not have | "local" in it
* bigger/nicer bridge level
  * fullscreen F11 hint
  * need some space to learn controls before the second popup
  * need some point of interest so you know which way is the front (windows on just one side?)
* lighting flicker l3 (after insanity)
  * maybe height noise thingy?

* Insanity view
  * just ramp this from 0-50 throughout the 5 levels, plus sanity damage
  * party portraits to change to monsters - silhouettes
  * ghosts moving through the level
  * dark/postprocess - 16-bit color crunch? - dither?
  * change fog colors and backdrop
  * outlines of tentacles in space backdrop


Watching JK
* maybe force spending all XP the first time you're in solitude
* forest: add a "maybe we should go back and level up?" dialog hint
* add shield reducing split damage to combat log (need scroll window!)
* preview player healing just like monster damage

Balance Plan: conservation of XP
          level + tier that should get 1-2 deaths in some combats (2/5?) and 2-3 deaths on boss
                replacement tier (even if not L2)
Floor 1 : T0L0  T0
  T0L0/T0L1 (12 abilities leveled up +1) - (except, we start with effectively +12xp - need 4 less on this floor)
Floor 2 : T0L1  T0
  T0L1/T0L2/T1L0 (12 abilities leveled up +2 and 6 deaths @ L3) - (need 8 less on this floor)
Floor 3 : T1L0  T1
  T1L0/T1L1 (12+1)
Floor 4 : T1L1  T1
  T1L1/T1L2/T2L0 (12+2 / 6d)
Floor 5 : T2L0  T2
  T2L0/T2L1/T2L2 (12+1, 12+2)
Boss fight : T2L2

XP Cost - see doc

Playtest Feedback
* playtest 2
  * second level still slightly too easy, not sure I lost anyone?
  * third level, lost 2 in one fight, so far, otherwise fine
  * forth level, without nerfing aoe4, would have lost 2
    * didn't lose anyone though, bump balanced damage by 1, sponge by a couple more HP
  * last level, lost 2 getting to solitude
    * was underleveled due to wrong XP values!  ended T2L1

Polish
* controller issue: don't see initial hint in combat
* adjust fog colors and settings of all levels - backdrops too
* fill in empty space in UI with some noise at least
* use wall variations throughout levels
* add unlockable doors to get back to the Solitude entrances
* more player faces
* tooltip on Sanity and XP displays, explaining mechanics
* add sanity icon to spritesheet and use in dialogs
* scroll area for combat log when needed
* change wander to only wander between 2 spaces, start and random neighbor, then can enable on all
* darken read notes on the minimap
* animate monsters
* shake things when people get hit
* long-press on ability is not focusing and showing preview
  * also, make sure it all works well with controller
* scrolling starfield
* physopolis cat
* in forest: put axe on ground on other side of blocker

Post-game fixes / polish
* bias features for simple billboard details
* reorganize all of the example entities to use a spritesheet
* add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* tooltip width and markdown not playing correctly, probably also height
* origin in entdef depends heavily on aspect ratio of image, but it shouldn't?
* Nilo "face wilts" dialog is not markdownTruncating correctly
* Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog

People's games to check out:
* YouDoYouBuddy - slay the spire
* Yomigael - https://surt-r.itch.io/dragon-ruins
* Cuprite - The Reaper of the Depths
