param(
  [int]$Port = 4173,
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".webp" = "image/webp"
  ".mp3"  = "audio/mpeg"
  ".css"  = "text/css; charset=utf-8"
  ".md"   = "text/markdown; charset=utf-8"
}

$rootPath = [IO.Path]::GetFullPath($Root)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "御灵召来预览已启动：http://127.0.0.1:$Port/"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while (($line = $reader.ReadLine()) -ne "") {
        if ($null -eq $line) { break }
      }

      $parts = $requestLine -split " "
      $urlPath = if ($parts.Length -gt 1) { $parts[1].Split("?")[0] } else { "/" }
      $urlPath = [Uri]::UnescapeDataString($urlPath)
      if ($urlPath -eq "/") { $urlPath = "/index.html" }
      $relative = $urlPath.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
      $filePath = [IO.Path]::GetFullPath((Join-Path $rootPath $relative))

      if (-not $filePath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $body = [Text.Encoding]::UTF8.GetBytes("404")
        $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      } else {
        $body = [IO.File]::ReadAllBytes($filePath)
        $ext = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
        $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
      }
      $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } finally {
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
