TODO
* Insanity view
  * just ramp this from 0-50 throughout the 5 levels, plus sanity damage
  * party portraits to change to monsters - silhouettes
  * ghosts moving through the level
  * dark/postprocess - 16-bit color crunch? - dither?
  * change fog colors and backdrop
  * outlines of tentacles in space backdrop
* lighting flicker l3 (after insanity)
* roll credits after finale
* allow saving anywhere

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
* too many monsters on first floor - maybe aim for ~7 encounters per floor? or more avoidable?
* playtest 1
  * way too easy second level with ~4 upgrades; was about 30min with some fixes - slot 3!
  * only had ~3 deaths, max sanity restore totally unneeded
* playtest 2
  * second level still slightly too easy, not sure I lost anyone?
  * third level, lost 2 in one fight, so far, otherwise fine
  * forth level, without nerfing aoe4, would have lost 2
    * didn't lose anyone though, bump balanced damage by 1, sponge by a couple more HP
  * last level, lost 2 getting to solitude
    * was underleveled due to wrong XP values!  ended T2L1

Finish up
* remove dbg:kill buttons!
* title screen
* hi score list

Polish
* final level could use a bunch of unlockable shortcuts
* bigger/nicer bridge level
* use wall variations throughout levels
* bug: when emeny dies to poison damage, the floater moves down halfway through the anim
* enemy plays blocked sound and does shield floater if 0 damage
* controller: can't level up: hit Y to open a dedicated screen?
* add "cheat" to the menu - sets everyone to T2L2 and 100 max sanity and enables the "kill enemy" buttons
* adjust fog colors and settings of all levels - backdrops too
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
* physopolis cat

Post-game fixes / polish
* bias features for simple billboard details
* reorganize all of the example entities to use a spritesheet
* add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* tooltip width and markdown not playing correctly, probably also height
* origin in entdef depends heavily on aspect ratio of image, but it shouldn't?
* Nilo "face wilts" dialog is not markdownTruncating correctly

People's games to check out:
* YouDoYouBuddy - slay the spire
* Yomigael - https://surt-r.itch.io/dragon-ruins
* Cuprite - The Reaper of the Depths
