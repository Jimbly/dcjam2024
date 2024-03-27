TODO
* medicine cabinet
  * one-time
  * restores max sanity after a choice
  * flavor text
* placeholder one-time world events that displays flavor text and damages or heals sanity
* placeholder one-time world events that display one of your characters in dialog (just hard-coded index in the event, not even random!)
* placeholder journal entries on a computer
* combat - maybe add log for enemy turn explaining what happened, press button to Roll! when done reading
  * probably don't need as much help text then?
* start balancing combat encounters
* spend XP to level up skills or heroes
  * only in Rooms of Solitude
* rework ship2 -> default; secret door for default
* add sanity icon to spritesheet and use in dialogs
* Insanity view
  * party portraits to change to monsters - silhouettes
  * ghosts moving through the level
  * dark/postprocess - 16-bit color crunch? - dither?
* combat: unwinnable/losable combat: scale up damage of everyone after X turns, +1 damage per round
* final battle
  * no bamf after final battle
  * no sanity loss? only lose condition is all heroes are dead?

Balance Plan: conservation of XP
          level + tier that should get 1-2 deaths in some combats (2/5?) and 2-3 deaths on boss
                replacement tier (even if not L3)
Floor 1 : T1L1  T1
Floor 2 : T2L1  T1
Floor 3 : T2L3  T2
Floor 4 : T3L1  T2
Floor 5 : T3L3  T3

XP Cost
T1 0 / 1 / 3   (+1/2)
T2 3 / 5 / 9   (+2/4)
T3 9 / 13 / 21 (+4/8)

Polish
* door/stairs in fade is covering up the menu button
* Enemy stay at target position for ~10 seconds if they lost their target
* Minimap graphics
* animate monsters
* Add a [help] button on the combat screen that explains the basic mechanics
  * and/or just use the help area for "tooltips" during combat
  * explain hero ability icons: front/all/back
  * explain monster attack icons and aggro:
    * [img=attack_front_enemy] targets highest [img=aggro]AGGRO, divided by ties, rounded down
  * shields, aggro decay
* long-press on ability is not focusing and showing preview
  * also, make sure it all works well with controller
* scrolling starfield
