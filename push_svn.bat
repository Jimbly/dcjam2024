@SET TORTOISE_PATH=%ProgramW6432%\TortoiseSVN\bin\TortoiseProc.exe

git archive HEAD --output=../dcjam2024.tar
rd /s /q ..\dcjam2024svn\src
rd /s /q ..\dcjam2024svn\build
@pushd ..\dcjam2024svn
tar xf ../dcjam2024.tar
del ..\dcjam2024.tar
call npm i --no-audit --no-fund
@popd
@for /F usebackq %%a in (`git rev-parse HEAD`) do SET VER=%%a
"%TORTOISE_PATH%" /command:commit /path:..\dcjam2024svn\  /logmsg:"Update from git %VER%"
