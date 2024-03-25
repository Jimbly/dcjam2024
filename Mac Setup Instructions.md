Step 1: Install Node.js v16.20.2 from https://nodejs.org/en/download - make sure to select v16.20.2 from the drop-down before downloading.  If you already have Node.js installed (it's a common for web dev tools), and it's a newer version, let me know.

Step 2: install SmartSVN - https://www.smartsvn.com/
Run Smart SVN choose "open an existing repository" or something like that (first option on the prompt), put in a URL of svn://www.dashingstrike.com/other/dcjam2024.
Choose a new empty folder to download to ("dcjam2024" is a good name =), it should finish after a few seconds.

Step 3: In Finder, right click on the folder it just made, and choose Services -> New Terminal At Folder
Run: `npm i` in the terminal
This is a one-time install of the engine.  It should finish with some warnings which are safe to ignore.

Step 4: Run `npm start` to start the game engine, it should automatically open a browser window after a minute or two of processing.  Leave this terminal window running (it's hosting the web page that is the game, etc).

To make changes, all changes should get automatically applied when you change files on disk, so go to `src/client/sounds`, try changing rollover.mp3 (can be a .wav, .ogg, or .mp3, as long as it's named `rollover`, just delete the old file if you're changing file formats), and you should immediately be able to hear the difference =).

Finally, to commit changes, back in SmartSVN, press the Commit button, it'll list all modified files on the second page, make sure to only check the files you wish to commit (you may have changes to level files or something if you were playing in the editor), then type a commit message such as "updating UI sounds" (this shows up in the log anyone else can view in SmartSVN), then submit it.

The first time it'll ask for a username/password - use `username` / `dcjam`, click "remember password" or similar.  On the prompt after that choose "do not use master password", otherwise it'll ask you for a password each time.
