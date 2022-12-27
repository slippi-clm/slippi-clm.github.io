#!/bin/bash

while :
do
  git pull
  node getCodes.js
  if [[ `git status --porcelain` ]]; then
    git add -A
    git commit -m "codes update via script"
    node update.js
    git add -A
    git commit -m "data update via codes script"
    git push
  else
    echo "no changes"
  fi
  sleep 1m
done
