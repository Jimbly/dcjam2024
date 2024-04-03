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

* Itch page
  * 3-5 screenshots

Watching JK
* maybe force spending all XP the first time you're in solitude
* forest: add a "maybe we should go back and level up?" dialog hint
* add shield reducing split damage to combat log (need scroll window!)

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

Post-game fixes / polish
* big, flashy "tier up!"
* if sanity < 50% -> 'Hey, let's rest here a while before leavin, 'kay?
* pathfinding does not use unlocked doors
* bias features for simple billboard details
* reorganize all of the example entities to use a spritesheet
* add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* tooltip width and markdown not playing correctly, probably also height
* origin in entdef depends heavily on aspect ratio of image, but it shouldn't?
* Nilo "face wilts" dialog is not markdownTruncating correctly
* Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* controller alternate mode to just do instant step and lerping, feels so good in other games and would work perfect in the editor

People's games to check out:
* YouDoYouBuddy - slay the spire - https://itch.io/jam/dcjam2024/rate/2617392
* Yomigael - https://surt-r.itch.io/dragon-ruins
* Cuprite - The Reaper of the Depths - https://cupritegames.itch.io/the-reaper-of-the-depths
* SteamPunkProgrammer - Nether Whisper
* Batisdark & co - https://apoly.itch.io/tomb-of-aeon
* tjm - Recluse and the Relic
* David York
* Captain Coder - Cosmic Encounter - https://captaincoder.itch.io/cosmic-encounter
* Disastrophism - https://disastrophism.itch.io/broccoli-pentad
* CallMeAdam - Bleak Harbor - https://adamstrange.itch.io/bleakharbor
* starside - https://climberjosh.itch.io/dungeonruga
* bonebrah - https://realmsruins.itch.io/escaping-the-cosmic-abyss
* Frib - https://frib.itch.io/the-monstrous-maw-and-the-veiled-cube
* Rubikow - https://rubikow.itch.io/those-without-names
* MagnusFurcifer
* Lejund - https://itch.io/jam/dcjam2024/rate/2616761
* tiny/simple - https://urbandrei.itch.io/basic-dungeon-crawler
* mass - https://steamknight.itch.io/void-protocol
Stretch
* JD Nation - https://jd-nation.itch.io/the-endless-adventure-the-cursed-caverns