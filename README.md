# Q-Sys Launcher
This WSH script and registry patch will associate .qsys files with the version of Designer with which they were originally created.
(So files last saved in 5.4 will open in Designer 5.4, and so on.)
If there is no exact match, it will open the design file with the earliest possible compatible version installed.

### INSTALL

Copy `qlaunch.js` to `C:\`.

Run / merge `registry.reg`.




### Icon Fix
When using this script, all .qsys file icons will change to the WSH icon.

To get the Q-Sys icon back, extract `qsys.ico` to `C:\` from Q-Sys Designer.

(BeCyIconGraber works well for this.)

Then, run `iconfix.reg`.

(The icon file cannot be shared here due to QSC's copyright.)
