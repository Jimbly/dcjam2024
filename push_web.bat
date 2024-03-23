@SET TORTOISE_PATH=%ProgramW6432%\TortoiseSVN\bin\TortoiseProc.exe
@SET DEST=..\..\SRC2\web\dashingstrike.com\LudumDare\DCJ2024

call node build build

rd /s /q %DEST%
md %DEST%
xcopy /SY dist\game\build.prod\client %DEST%

@for /F usebackq %%a in (`git rev-parse HEAD`) do SET VER=%%a
"%TORTOISE_PATH%" /command:commit /path:%DEST%  /logmsg:"Jam update from git %VER%"

@pushd ..\..\SRC2\flightplans

@echo.
@echo.
@echo NEXT: Run `npm run web-prod` in the Node 12 shell
@node12shell