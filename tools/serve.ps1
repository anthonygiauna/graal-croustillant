# Petit serveur local (sans Node) pour jouer et lancer les tests :
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1   puis ouvrir http://localhost:8790/
# POST /__save?f=data/xxx.json écrit un fichier (réservé aux dossiers data/ et icons/, utilisé par les outils).
param([int]$Port = 8790)
$root = Split-Path $PSScriptRoot -Parent
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json; charset=utf-8'; '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.md' = 'text/plain; charset=utf-8' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serveur prêt : http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $res.Headers.Add('Cache-Control', 'no-store')
  try {
    if ($req.HttpMethod -eq 'POST' -and $req.Url.AbsolutePath -eq '/__save') {
      $f = $req.QueryString['f']
      $full = [IO.Path]::GetFullPath((Join-Path $root $f))
      if ($f -match '^(data|icons)/[\w.\-]+$' -and $full.StartsWith($root)) {
        $ms = New-Object IO.MemoryStream
        $req.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes($full, $ms.ToArray())
        $res.StatusCode = 204
      } else { $res.StatusCode = 403 }
    } else {
      $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel = $rel + 'index.html' }
      $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($full)
        $ext = [IO.Path]::GetExtension($full)
        $res.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else { $res.StatusCode = 404 }
    }
  } catch { $res.StatusCode = 500 }
  $res.Close()
}
