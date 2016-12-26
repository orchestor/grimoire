# Grimoire

This is a project I have been working on in private for a couple of months, but I cleaned out my .git folder as it had some private notes in there. 

![screenshot](Screenshot (3).png)

![screenshot](Screenshot (5).png)

## NOTE: This is a work in progress. 

## NOTE: this is meant to be run locally, not over the interweb (at least without some additional security).  

## General installation instructions:
### install npm and node
Easiest way is to visit the website [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
but you may also be able to use a package manager, via some commands like the following (likely incorrect): 

osx
```
brew install npm nodejs
```
ubuntu
```
sudo apt install npm nodejs
```  
windows
```
choco install npm nodejs
```
## install packages
clone the repository into some directory and go there on command line and use the command
```
npm i
```
**Note:**
On windows (possibly other systems) it seems that the dev dependencies (listed in package.json) need to be manually installed. At least I had to do this on a fresh install. 

E.g. something like:
```
npm i babel-preset-stage-1
```
## starting
```
npm start 
```
If that doesn't work, try first using the command 
```
webpack
```
from the directory where you cloned the project. This should complete with a success message. If not something else is wrong, and please open a github issue. 

**Note:** 
Currently you must add at least one topic upon start to get things working. 

## Now add topics / items and enjoy

**Note:** 
Currently you must add at least one topic upon start to get things working. 

## hotkeys: 
In viewing mode "e" will go to edit mode. 
In edit mode: "ctrl+alt+s" will save
In edit mode: paste will paste an image that is currently in clipboard and add a url to bottom of edit (working on getting it to paste at cursor, but only have so much time / effort)

# Recommendations
I recommend keeping your private notes on here and not adding them to a git thing (unless it is reasonably well secured), alternatively, add things you don't care about keeping private. All the info / notes / pictures will be stored in src/grimoire/ directory which should currently be under gitignore
