$ErrorActionPreference = "Stop"
$instance = "MSSQL16.SQLEXPRESS"
$serviceName = "MSSQL`$SQLEXPRESS"

# 1. Enable mixed mode authentication (Windows + SQL logins)
$regBase = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instance\MSSQLServer"
Set-ItemProperty -Path $regBase -Name LoginMode -Value 2

# 2. Enable TCP/IP protocol on a fixed port
$tcpPath = "$regBase\SuperSocketNetLib\Tcp"
Set-ItemProperty -Path $tcpPath -Name Enabled -Value 1
Get-ChildItem $tcpPath | ForEach-Object {
    $ipPath = $_.PSPath
    Set-ItemProperty -Path $ipPath -Name TcpDynamicPorts -Value "" -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $ipPath -Name TcpPort -Value "1433" -ErrorAction SilentlyContinue
}

# 3. Restart the SQL Server service to apply changes
Restart-Service -Name $serviceName -Force

# 4. Also ensure the Windows Firewall allows local TCP 1433 (loopback-safe, no-op if rule exists)
if (-not (Get-NetFirewallRule -DisplayName "SQL Server Express (artispay)" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "SQL Server Express (artispay)" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow | Out-Null
}

Write-Output "DONE"
