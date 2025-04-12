TODO
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
* use wall variations throughout levels
* tooltip on Sanity and XP displays, explaining mechanics
* scroll area for combat log when needed
* change wander to only wander between 2 spaces, start and random neighbor, then can enable on all
* scrolling starfield
* in forest: put axe on ground on other side of blocker
* JD Nation bug - network disconnect, clicked "new", screen goes black, never fades up to in-game
  * likely due to loading level 1 json file never finishing - add retries and error message on this
    * should have asserted / thrown an error, it looks like?

Post-game fixes / polish
* add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
