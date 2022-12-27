#!/bin/bash

while :
do
	node update.js
	git add -A
	git commit -m "data update via script"
	git push
	sleep 50m
done
