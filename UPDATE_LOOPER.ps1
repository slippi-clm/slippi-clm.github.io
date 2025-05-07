$rootDir = $PSScriptRoot
$needsUpdateJs="${rootDir}/needsUpdate.js"
$getCodesJs="${rootDir}/getCodes.js"
$updateJs="${rootDir}/update.js"

cd $rootDir

function Do-Update {
    node $updateJs
    git add -A
	git commit -m "data update via codes script"
	git push
}

while ($true) {
    git pull
    node $getCodesJs
    Write-Output "checking for update $(Get-Date)"
    node $needsUpdateJs
    if($LASTEXITCODE -eq 0) {
        Write-Output "checking for tracked codes changes"
        $ChangedFiles = $(git status --porcelain | Measure-Object | Select-Object -expand Count)
        Write-Output $ChangedFiles
        if($ChangedFiles -gt 0) {
            Write-Output "syncing tracked codes and performing update"
			git add -A
			git commit -m "codes update via script"
            # Do-Update
        }
    }
    else {
        Write-Output "performing update"
        Do-Update
    }
    Start-Sleep -Seconds 60
}