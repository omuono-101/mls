$content = Get-Content 'c:/Users/Administrator/OneDrive/Desktop/restapi/mls-main/frontend/src/dashboards/StudentDashboard.tsx' -Raw
$newContent = $content -replace 'await api\.post\(ssessments///\)', 'await api.post(`assessments/${assessmentId}/${!currentStatus ? ''complete'' : ''incomplete''}/`)'
Set-Content -Path 'c:/Users/Administrator/OneDrive/Desktop/restapi/mls-main/frontend/src/dashboards/StudentDashboard.tsx' -Value $newContent
Write-Host "Fixed!"
