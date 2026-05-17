param(
  [string]$ApiBase = "https://graycshop.trade/api",
  [string]$Email = "admin@marketzone.mx",
  [string]$Password = "Admin123!",
  [int]$Total = 10000,
  [int]$StartIndex = 0,
  [int]$PauseMs = 25
)

$ErrorActionPreference = "Stop"

function Normalize-Slug([string]$value) {
  $normalized = $value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }
  $slug = $builder.ToString().ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-+|-+$", ""
  if ($slug.Length -gt 80) { $slug = $slug.Substring(0, 80) }
  return $slug
}

function Build-Product([int]$i) {
  $brands = @(
    @{ marca = "Apple"; modelos = @("iPhone 16", "iPhone 15", "iPhone 14", "iPhone 13") },
    @{ marca = "Samsung"; modelos = @("Galaxy S25", "Galaxy S24", "Galaxy A56", "Galaxy A36") },
    @{ marca = "Xiaomi"; modelos = @("Redmi Note 14", "Redmi Note 13", "Poco X7", "Poco M7") },
    @{ marca = "Motorola"; modelos = @("Moto G85", "Moto G75", "Edge 60", "Edge 50 Neo") },
    @{ marca = "Infinix"; modelos = @("Note 50 Pro", "Hot 70", "GT 20", "Smart 9") },
    @{ marca = "Honor"; modelos = @("Honor 200", "Honor X8b", "Honor Magic 7 Lite", "Honor 90") },
    @{ marca = "Huawei"; modelos = @("Nova 13", "Pura 70", "Mate 60", "Nova 12i") },
    @{ marca = "Realme"; modelos = @("Realme 12", "Realme C67", "Realme GT Neo", "Narzo 70") },
    @{ marca = "Nokia"; modelos = @("Nokia G42", "Nokia X30", "Nokia C32", "Nokia G22") },
    @{ marca = "ZTE"; modelos = @("Blade V60", "Nubia Neo", "Axon 50", "Blade A75") }
  )

  $categories = @("tecnologia", "electronica", "productos", "importados")
  $colors = @("Negro", "Azul", "Gris", "Verde", "Blanco", "Plata", "Rosa")
  $storages = @(64, 128, 256, 512)
  $rams = @(4, 6, 8, 12, 16)
  $screens = @("6.1", "6.5", "6.67", "6.7", "6.78")
  $baseByBrand = @{
    "Apple" = 14500
    "Samsung" = 7800
    "Xiaomi" = 4300
    "Motorola" = 4700
    "Infinix" = 3600
    "Honor" = 6200
    "Huawei" = 7400
    "Realme" = 4100
    "Nokia" = 3500
    "ZTE" = 3300
  }

  $brand = $brands[$i % $brands.Count]
  $model = $brand.modelos[$i % $brand.modelos.Count]
  $storage = $storages[$i % $storages.Count]
  $ram = $rams[$i % $rams.Count]
  $color = $colors[$i % $colors.Count]
  $category = $categories[$i % $categories.Count]
  $screen = $screens[$i % $screens.Count]
  $basePrice = $baseByBrand[$brand.marca]
  $price = [int][Math]::Max(2299, [Math]::Round($basePrice + ($ram * 180) + ($storage * 9) + (($i * 13) % 1100)))
  $discount = if (($i % 4) -eq 0) { [int][Math]::Round($price * 0.88) } else { 0 }
  $stock = ($i % 120) + 1
  $sold = $i % 300
  $slug = Normalize-Slug("$($brand.marca)-$model-$storage" + "gb-$ram" + "gb-$color-$([int](100000 + $i))")
  $label = [uri]::EscapeDataString("$model $storage" + "GB $color")
  $imageUrl = "https://placehold.co/1200x1200/0b1220/e2e8f0?text=$label"
  $etaMin = ($i % 4) + 2
  $etaMax = ($i % 4) + 4

  return @{
    nombre = "$model $storage" + "GB $ram" + "GB RAM $color"
    slug = $slug
    descripcion = "$($brand.marca) $model con almacenamiento de $storage" + "GB y memoria RAM de $ram" + "GB. Equipo equilibrado para productividad, contenido multimedia, compras y uso diario."
    descripcionCorta = "$model con $storage" + "GB, $ram" + "GB RAM y pantalla de $screen pulgadas."
    marca = $brand.marca
    precio = $price
    precioDescuento = $discount
    stock = $stock
    vendidos = $sold
    categoria = $category
    tags = @($brand.marca.ToLowerInvariant(), $model.ToLowerInvariant(), "$storage" + "gb", "$ram" + "gb ram", "smartphone", $category)
    imagenes = @($imageUrl)
    caracteristicas = @(
      "Pantalla de $screen pulgadas",
      "Almacenamiento interno de $storage" + "GB",
      "Memoria RAM de $ram" + "GB",
      "Bluetooth y GPS integrados",
      "Bateria de larga duracion",
      "Equipo compatible con uso diario y entretenimiento"
    )
    disponibilidad = "Disponible"
    infoEnvio = "Envio seguro con rastreo en cada etapa del pedido."
    fechaEstimada = "Entrega estimada de $etaMin a $etaMax dias habiles."
    garantia = "Garantia por defectos de fabrica."
    devolucion = "Aplica conforme a politicas vigentes de la tienda."
    envioGratis = $false
    mostrarEnvioGratis = $false
  }
}

Write-Host "Iniciando carga masiva..."

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.token)" }

$created = 0
$failed = 0

for ($index = $StartIndex; $index -lt ($StartIndex + $Total); $index++) {
  $payload = Build-Product -i $index | ConvertTo-Json -Depth 8
  try {
    Invoke-RestMethod -Uri "$ApiBase/admin/products" -Method Post -Headers $headers -ContentType "application/json" -Body $payload | Out-Null
    $created++
  } catch {
    $failed++
  }

  if ((($index - $StartIndex + 1) % 100) -eq 0) {
    $processed = $index - $StartIndex + 1
    Write-Host "Progreso: $processed / $Total | Creados: $created | Fallidos: $failed"
  }

  if ($PauseMs -gt 0) {
    Start-Sleep -Milliseconds $PauseMs
  }
}

Write-Host "Carga terminada. Creados: $created | Fallidos: $failed"
