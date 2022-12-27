#!/bin/bash

while :
do
	git pull
	node update.js
	git add -A
	git commit -m "data update via script"
	git push
	sleep 50m
done
