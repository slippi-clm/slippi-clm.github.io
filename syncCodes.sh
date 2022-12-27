#!/bin/bash

git pull
node getCodes.js
if [[ `git status --porcelain` ]]; then
  git add -A
  git commit -m "codes update via script"
  node update.js
  git commit -m "data update via codes script"
  git push
else
  echo "no changes"
fi

# while :
# do
# 	git pull
# 	node update.js
# 	git add -A
# 	git commit -m "data update via script"
# 	git push
# 	sleep 50m
# done