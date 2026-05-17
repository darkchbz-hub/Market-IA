param(
  [string]$ApiBase = "https://graycshop.trade/api",
  [string]$Email = "admin@marketzone.mx",
  [string]$Password = "Admin123!",
  [int]$PauseMs = 10
)

$ErrorActionPreference = "Stop"

function Normalize-Key([string]$name, [string]$brand) {
  $safeName = if ($null -eq $name) { "" } else { $name }
  $safeBrand = if ($null -eq $brand) { "" } else { $brand }
  return ("{0}||{1}" -f $safeName.Trim().ToLowerInvariant(), $safeBrand.Trim().ToLowerInvariant())
}

function Pick([object[]]$list, [int]$seed) {
  if (-not $list -or $list.Count -eq 0) { return "" }
  return $list[[Math]::Abs($seed) % $list.Count]
}

function Build-Product([string]$category, [int]$seed) {
  $titles = @{
    juguetes = @("Bloques Creativos", "Carro RC", "Puzzle 3D", "Muñeco Articulado", "Set de Ciencia", "Piano Infantil", "Drone Mini", "Kit de Pintura", "Tren Electrico", "Casita de Juegos")
    apps = @("Suscripcion IA Plus", "Suite Productividad", "Asistente Empresarial", "Editor Profesional", "Automatizacion CRM", "Motor Analitica", "Generador de Contenido", "Plan Seguridad Cloud", "Servicio Integracion API", "Dashboard Avanzado")
    electronica = @("Monitor 27", "Teclado Mecanico", "Mouse Gamer", "SSD NVMe", "Webcam 4K", "Bocina Bluetooth", "Microfono USB", "Tablet 10", "Smart TV 50", "Audifonos Over Ear")
    tecnologia = @("Laptop Pro", "Smartphone 5G", "Reloj Inteligente", "Tablet Air", "PC Compacta", "Tarjeta Grafica", "Procesador X", "Memoria RAM", "Disco Externo", "Dock Station")
  }
  $brands = @{
    juguetes = @("ToyLab", "PlayMax", "KidWorld", "FunBox", "BrightKids")
    apps = @("Gray Cloud", "FlowSoft", "Taskline", "AIMatrix", "CoreSuite")
    electronica = @("Sony", "LG", "Samsung", "Acer", "Asus")
    tecnologia = @("Apple", "Samsung", "Xiaomi", "Motorola", "Lenovo")
  }
  $ranges = @{
    juguetes = @(149, 2999)
    apps = @(299, 4999)
    electronica = @(699, 34999)
    tecnologia = @(999, 39999)
  }

  $title = Pick $titles[$category] $seed
  $brand = Pick $brands[$category] ($seed + 5)
  $variant = Pick @("Pro", "Plus", "Max", "Lite", "Eco", "Smart") ($seed + 9)
  $serie = "{0:D5}" -f ($seed + 1)
  $min = [int]$ranges[$category][0]
  $max = [int]$ranges[$category][1]
  $price = $min + (($seed * 41) % [Math]::Max(1, ($max - $min)))
  $discount = if (($seed % 5) -eq 0) { [Math]::Round($price * 0.9) } else { 0 }
  $name = "$title $variant $serie"
  $slug = (($name + "-" + $brand + "-" + $category) -replace "[^a-zA-Z0-9]+", "-").ToLowerInvariant().Trim("-")
  $img = "https://placehold.co/1200x1200/0b1220/e2e8f0?text=$([uri]::EscapeDataString($name))"

  return @{
    nombre = $name
    slug = $slug
    descripcion = "$name de la marca $brand para categoria $category. Producto preparado para alto rendimiento y uso continuo."
    descripcionCorta = "$name disponible en Gray C Shop."
    marca = $brand
    precio = [int]$price
    precioDescuento = [int]$discount
    stock = [int](($seed % 150) + 10)
    vendidos = [int](($seed * 3) % 320)
    categoria = $category
    tags = @($category, $brand.ToLowerInvariant(), $variant.ToLowerInvariant(), "gray c shop")
    imagenes = @($img)
    caracteristicas = @(
      "Diseno optimizado para uso diario",
      "Rendimiento estable",
      "Garantia de fabrica",
      "Envio con seguimiento",
      "Soporte postventa"
    )
    disponibilidad = "Disponible"
    infoEnvio = "Envio con rastreo y entrega nacional."
    fechaEstimada = "Entrega estimada de 2 a 6 dias habiles."
    garantia = "Garantia por defectos de fabrica."
    devolucion = "Devolucion conforme a politicas vigentes."
    envioGratis = $false
    mostrarEnvioGratis = $false
  }
}

$targets = @{
  juguetes = 100
  apps = 60
  electronica = 120
  tecnologia = 120
}

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.token)" }

$all = Invoke-RestMethod -Uri "$ApiBase/admin/products" -Headers $headers
$items = @($all.items)
$currentCounts = @{}
$keys = New-Object System.Collections.Generic.HashSet[string]
foreach ($item in $items) {
  $cat = $item.categoria
  if (-not $currentCounts.ContainsKey($cat)) { $currentCounts[$cat] = 0 }
  $currentCounts[$cat]++
  [void]$keys.Add((Normalize-Key $item.nombre $item.marca))
}

$created = 0
$failed = 0
foreach ($cat in $targets.Keys) {
  $target = [int]$targets[$cat]
  $current = if ($currentCounts.ContainsKey($cat)) { [int]$currentCounts[$cat] } else { 0 }
  if ($current -ge $target) {
    Write-Host ("{0}: ya cumple ({1}/{2})" -f $cat, $current, $target)
    continue
  }
  $needed = $target - $current
  $catCreated = 0
  $tries = 0
  while ($catCreated -lt $needed -and $tries -lt ($needed * 30)) {
    $tries++
    $seed = ($tries * 97) + ($created * 11)
    $product = Build-Product -category $cat -seed $seed
    $key = Normalize-Key $product.nombre $product.marca
    if ($keys.Contains($key)) { continue }
    try {
      $body = $product | ConvertTo-Json -Depth 8
      Invoke-RestMethod -Uri "$ApiBase/admin/products" -Method Post -Headers $headers -ContentType "application/json" -Body $body | Out-Null
      [void]$keys.Add($key)
      $catCreated++
      $created++
    } catch {
      $failed++
    }
    if ($PauseMs -gt 0) { Start-Sleep -Milliseconds $PauseMs }
  }
  Write-Host ("{0}: agregados {1}, objetivo {2}" -f $cat, $catCreated, $needed)
}

$check = Invoke-RestMethod -Uri "$ApiBase/admin/products" -Headers $headers
$afterItems = @($check.items)
$dupGroups = $afterItems | Group-Object { Normalize-Key $_.nombre $_.marca } | Where-Object { $_.Count -gt 1 }
Write-Host ("Terminado. Total productos: {0} | Creados: {1} | Fallidos: {2} | Duplicados restantes: {3}" -f $afterItems.Count, $created, $failed, $dupGroups.Count)
