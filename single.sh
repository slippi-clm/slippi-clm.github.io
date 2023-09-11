#!/bin/bash

rootDir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
needsUpdate="$rootDir/needsUpdate.sh"
update="$rootDir/update.sh"

function doUpdate() {
	eval $update
	git add -A
	git commit -m "data update via codes script"
	git push
}


cd $rootDir

while :
do
	git pull
	node getCodes.js
	echo "checking for update"
	eval $needsUpdate
	if [ $? -eq 0 ]; then
		echo "checking for sync"
		if [[ `git status --porcelain` ]]; then
			echo "performing sync"
			git add -A
			git commit -m "codes update via script"
			doUpdate
		fi
	else
		echo "performing update"
		doUpdate
	fi
	sleep 1m
done
