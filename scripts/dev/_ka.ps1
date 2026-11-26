$ErrorActionPreference='SilentlyContinue'
foreach ($port in @(3000,3001)) { foreach ($c in Get-NetTCPConnection -LocalPort $port -State Listen) { $p = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)"; if ($p) { Stop-Process -Id $p.ProcessId -Force; if ($p.ParentProcessId) { Stop-Process -Id $p.ParentProcessId -Force } } } }
Start-Sleep -Seconds 2