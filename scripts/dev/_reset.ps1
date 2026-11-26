$ErrorActionPreference='SilentlyContinue'
foreach ($port in @(3000,3001)) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)"
    if ($proc) {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
      if ($proc.ParentProcessId) { Stop-Process -Id $proc.ParentProcessId -Force -ErrorAction SilentlyContinue }
    }
  }
}
Start-Sleep -Seconds 2
$l = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Output ('listeners after kill: ' + $l)