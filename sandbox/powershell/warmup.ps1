# Run once at image build time so pwsh records its startup JIT profile
# (StartupProfileData-NonInteractive in $XDG_CACHE_HOME/powershell). Later runs
# replay it on background threads, which cuts cold-start time by about a third.
# It touches what typical snippets use: functions, classes, switch, operators,
# string formatting and the Core and Utility pipeline cmdlets.
function Get-Square([int] $n) { $n * $n }

class Item {
    [string] $Name
    [int] $Size
    Item([string] $name, [int] $size) { $this.Name = $name; $this.Size = $size }
    [string] ToString() { return '{0}={1}' -f $this.Name, $this.Size }
}

$items = foreach ($i in 1..20) { [Item]::new("item$i", (Get-Square $i) % 7) }
$rows = $items | Where-Object Size -gt 1 | Sort-Object Size, Name -Descending |
    Select-Object -First 5 Name, Size, @{ Name = 'Half'; Expression = { $_.Size / 2 } }
$groups = $items | Group-Object Size | ForEach-Object { '{0}:{1}' -f $_.Name, $_.Count }
$stats = $items | Measure-Object Size -Sum -Average -Minimum -Maximum
$records = 1..5 | ForEach-Object { [pscustomobject]@{ N = $_; Even = $_ % 2 -eq 0 } }
$labels = switch (1..15) { { $_ % 3 -eq 0 } { 'Fizz'; continue } default { "$_" } }
$text = ('a,b;c d' -split '[,; ]') -join '|' -replace 'b', 'B'
$matched = 'x=42' -match '(\w)=(\d+)'
$hash = @{ one = 1; two = 2 }; $hash['three'] = 3
$list = [System.Collections.Generic.List[int]]::new(); $list.Add(1)
try { throw [System.InvalidOperationException]::new('boom') } catch { $caught = $_.Exception.Message }

Write-Output ($rows | Out-String), ($groups -join ' '), $stats.Sum, $records.Count, $labels.Count,
    $text, $matched, $Matches[2], $hash.Count, $list.Count, $caught, ([math]::Round(2.5)), ([string]::Join(',', 1, 2))
$records | Format-Table | Out-String | Write-Output
$records | ConvertTo-Json -Compress | ConvertFrom-Json | Select-Object -Last 1 | Out-String | Write-Output
Write-Host 'warm-up done'
