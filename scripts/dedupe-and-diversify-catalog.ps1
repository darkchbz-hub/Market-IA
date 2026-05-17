param(
  [string]$ApiBase = "https://graycshop.trade/api",
  [string]$Email = "admin@marketzone.mx",
  [string]$Password = "Admin123!",
  [int]$PauseMs = 20
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

function Build-CategoryProduct([string]$category, [int]$index) {
  $titles = @{
    hogar = @("Aspiradora Vertical", "Cafetera Programable", "Freidora de Aire", "Horno Electrico", "Purificador de Aire", "Dispensador de Agua", "Licuadora Pro", "Robot de Limpieza", "Set de Cocina", "Colchon Visco")
    jardin = @("Podadora Electrica", "Kit de Riego", "Silla de Exterior", "Maceta Inteligente", "Cortasetos", "Manguera Expandible", "Lampara Solar", "Invernadero Compacto", "Aspersor Giratorio", "Compostera")
    automovil = @("Camara de Reversa", "Compresor Portatil", "Cargador Dual USB", "Tapetes Premium", "Pulidora Automotriz", "Aspiradora Auto", "Kit Emergencia", "Soporte Celular", "Escaner OBD2", "Arrancador Portatil")
    empresas = @("Impresora Oficina", "Escaner Documentos", "No Break Empresarial", "Router Dual Band", "Telefonia IP", "Control de Asistencia", "Etiquetadora Pro", "Calculadora Financiera", "Micrositio Corporativo", "Pantalla Sala Juntas")
    mayoreo = @("Caja de Audifonos", "Lote de Cargadores", "Paquete de Teclados", "Set de Mouse", "Kit de Fundas", "Lote de Memorias USB", "Caja de Bocinas", "Combo de Camaras", "Pack de Lamparas LED", "Lote de Herramientas")
    importados = @("Smartwatch Edition", "Mini Proyector 4K", "Consola Retro", "Auriculares ANC", "Bateria Magnetica", "Luz Ambiental RGB", "Tablet Compacta", "Camara Mini Wifi", "Dispensador Automatico", "Sensor Inteligente")
    mascotas = @("Cama Ortopedica", "Fuente de Agua", "Comedero Automatico", "Transportadora Premium", "Arnes Ajustable", "Rascador Vertical", "Juguete Interactivo", "Filtro de Arena", "Cepillo Antipelo", "Collar GPS")
    ropa = @("Sudadera Urbana", "Playera Premium", "Pantalon Deportivo", "Chamarra Ligera", "Tenis Running", "Vestido Casual", "Camisa Slim", "Conjunto Training", "Bolso Diario", "Gorra Clasica")
    juguetes = @("Bloques Creativos", "Carro RC", "Puzzle 3D", "Muñeco Articulado", "Set de Ciencia", "Piano Infantil", "Drone Mini", "Kit de Pintura", "Tren Electrico", "Casita de Juegos")
    casa = @("Lampara Decorativa", "Espejo LED", "Organizador Modular", "Sofa Compacto", "Mesa Auxiliar", "Cortina Blackout", "Alfombra Soft", "Estante Multiuso", "Reloj de Pared", "Perchero Moderno")
    electronica = @("Monitor 27", "Teclado Mecanico", "Mouse Gamer", "SSD NVMe", "Webcam 4K", "Bocina Bluetooth", "Microfono USB", "Tablet 10", "Smart TV 50", "Audifonos Over Ear")
    productos = @("Combo Hogar", "Kit Productividad", "Pack Bienestar", "Set Oficina", "Coleccion Premium", "Solucion Completa", "Paquete Familiar", "Oferta Especial", "Combo Smart", "Edicion Limitada")
    tecnologia = @("Laptop Pro", "Smartphone 5G", "Reloj Inteligente", "Tablet Air", "PC Compacta", "Tarjeta Grafica", "Procesador X", "Memoria RAM", "Disco Externo", "Dock Station")
    apps = @("Suscripcion IA Plus", "Suite Productividad", "Asistente Empresarial", "Editor Profesional", "Automatizacion CRM", "Motor Analitica", "Generador de Contenido", "Plan Seguridad Cloud", "Servicio Integracion API", "Dashboard Avanzado")
    packs = @("Pack Marketing", "Pack Diseño", "Pack E-commerce", "Pack Ventas", "Pack Agencia", "Pack Creador", "Pack Negocio Local", "Pack Educacion", "Pack Operativo", "Pack StartUp")
    webs = @("Landing Page Pro", "Tienda Online Base", "Portal Corporativo", "Sitio de Reservas", "One Page Business", "Web Inmobiliaria", "Web Clinica", "Web Restaurante", "Web Portafolio", "Web Educativa")
    mas = @("Producto Destacado", "Seleccion Especial", "Edicion Coleccion", "Recomendado del Mes", "Lanzamiento Reciente", "Novedad Premium", "Oferta Curada", "Coleccion Elite", "Paquete Exclusivo", "Solucion Integral")
  }

  $brands = @{
    hogar = @("Oster", "Mabe", "Whirlpool", "Taurus", "Hamilton")
    jardin = @("Truper", "Black+Decker", "Makita", "GardenPro", "Pretul")
    automovil = @("Bosch", "Steren", "AutoDrive", "Michelin", "Goodyear")
    empresas = @("HP", "Brother", "Epson", "Cisco", "Dell")
    mayoreo = @("GenTech", "BulkPro", "DistribuMax", "SmartLot", "VentaPlus")
    importados = @("GlobalOne", "NeoTech", "UrbanX", "PrimeWorld", "NovaTrade")
    mascotas = @("PetZone", "DogLife", "CatHouse", "PawCare", "PetSmart")
    ropa = @("UrbanWear", "ClassicFit", "MoveOn", "StyleHub", "Nordic")
    juguetes = @("ToyLab", "PlayMax", "KidWorld", "FunBox", "BrightKids")
    casa = @("HomeLine", "Decora", "CasaNova", "LivingLab", "Armony")
    electronica = @("Sony", "LG", "Samsung", "Acer", "Asus")
    productos = @("Gray C Shop", "Selecta", "Nova", "Prime", "Union")
    tecnologia = @("Apple", "Samsung", "Xiaomi", "Motorola", "Lenovo")
    apps = @("Gray Cloud", "FlowSoft", "Taskline", "AIMatrix", "CoreSuite")
    packs = @("Gray Packs", "BundleX", "GrowthLab", "PackFlow", "OpsKit")
    webs = @("Gray Studio", "WebForge", "PixelCraft", "SiteCore", "LaunchLab")
    mas = @("Gray C Shop", "Prime House", "Select Hub", "Smart Choice", "Market Pulse")
  }

  $priceRanges = @{
    hogar = @(899, 8999)
    jardin = @(499, 6999)
    automovil = @(299, 8999)
    empresas = @(1499, 25999)
    mayoreo = @(999, 15999)
    importados = @(399, 12999)
    mascotas = @(199, 3999)
    ropa = @(199, 2999)
    juguetes = @(149, 2999)
    casa = @(299, 7999)
    electronica = @(699, 34999)
    productos = @(299, 8999)
    tecnologia = @(999, 39999)
    apps = @(299, 4999)
    packs = @(499, 9999)
    webs = @(1999, 24999)
    mas = @(299, 9999)
  }

  $catTitles = $titles[$category]
  if (-not $catTitles) { $catTitles = @("Producto General") }
  $catBrands = $brands[$category]
  if (-not $catBrands) { $catBrands = @("Gray C Shop") }
  $range = $priceRanges[$category]
  if (-not $range) { $range = @(299, 4999) }

  $title = Pick $catTitles $index
  $brand = Pick $catBrands ($index + 7)
  $serie = "{0:D4}" -f ($index + 1)
  $variant = Pick @("Pro", "Plus", "Max", "Lite", "Eco", "Smart") ($index + 13)
  $color = Pick @("Negro", "Blanco", "Azul", "Gris", "Verde", "Rojo") ($index + 17)
  $stock = (($index * 3) % 180) + 5
  $sold = ($index * 5) % 300
  $min = [int]$range[0]
  $max = [int]$range[1]
  $price = $min + (($index * 37) % [Math]::Max(1, ($max - $min)))
  $discount = if (($index % 5) -eq 0) { [Math]::Round($price * 0.9) } else { 0 }

  $name = "$title $variant $serie"
  $slug = (($name + "-" + $brand + "-" + $category) -replace "[^a-zA-Z0-9]+", "-").ToLowerInvariant().Trim("-")
  $img = "https://placehold.co/1200x1200/0b1220/e2e8f0?text=$([uri]::EscapeDataString($name))"

  return @{
    nombre = $name
    slug = $slug
    descripcion = "$name de la marca $brand para categoria $category. Producto pensado para uso diario con enfoque en calidad, rendimiento y durabilidad."
    descripcionCorta = "$name en categoria $category con disponibilidad inmediata."
    marca = $brand
    precio = [int]$price
    precioDescuento = [int]$discount
    stock = [int]$stock
    vendidos = [int]$sold
    categoria = $category
    tags = @($category, $brand.ToLowerInvariant(), $variant.ToLowerInvariant(), "gray c shop")
    imagenes = @($img)
    caracteristicas = @(
      "Diseno orientado a uso continuo",
      "Materiales de alta durabilidad",
      "Garantia y soporte postventa",
      "Empaque protegido para envio nacional",
      "Compatibilidad con necesidades actuales"
    )
    disponibilidad = "Disponible"
    infoEnvio = "Envio con rastreo y seguimiento en tiempo real."
    fechaEstimada = "Entrega estimada de 2 a 6 dias habiles."
    garantia = "Garantia por defectos de fabrica."
    devolucion = "Devolucion conforme a politicas de Gray C Shop."
    envioGratis = $false
    mostrarEnvioGratis = $false
  }
}

Write-Host "Login admin..."
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "Descargando catalogo..."
$all = Invoke-RestMethod -Uri "$ApiBase/admin/products" -Headers $headers
$items = @($all.items)
Write-Host ("Productos actuales: {0}" -f $items.Count)

$seen = @{}
$toDelete = New-Object System.Collections.Generic.List[object]

foreach ($item in $items) {
  $key = Normalize-Key $item.nombre $item.marca
  if ([string]::IsNullOrWhiteSpace($key)) { continue }
  if (-not $seen.ContainsKey($key)) {
    $seen[$key] = $item.id
  } else {
    [void]$toDelete.Add($item.id)
  }
}

Write-Host ("Duplicados detectados: {0}" -f $toDelete.Count)
$deleted = 0
$deleteFailed = 0
foreach ($productId in $toDelete) {
  try {
    Invoke-RestMethod -Uri "$ApiBase/admin/products/$productId" -Method Delete -Headers $headers | Out-Null
    $deleted++
  } catch {
    $deleteFailed++
  }
  if ((($deleted + $deleteFailed) % 250) -eq 0) {
    Write-Host ("Eliminados: {0} | Fallidos: {1}" -f $deleted, $deleteFailed)
  }
  if ($PauseMs -gt 0) { Start-Sleep -Milliseconds $PauseMs }
}
Write-Host ("Deduplicacion completada. Eliminados: {0} | Fallidos: {1}" -f $deleted, $deleteFailed)

Write-Host "Recargando catalogo actualizado..."
$after = Invoke-RestMethod -Uri "$ApiBase/admin/products" -Headers $headers
$current = @($after.items)
$existingKeys = New-Object System.Collections.Generic.HashSet[string]
foreach ($item in $current) {
  [void]$existingKeys.Add((Normalize-Key $item.nombre $item.marca))
}

$targets = @{
  hogar = 120
  jardin = 100
  automovil = 100
  empresas = 80
  mayoreo = 80
  importados = 80
  mascotas = 100
  ropa = 100
  juguetes = 100
  casa = 100
  electronica = 120
  productos = 80
  apps = 60
  packs = 60
  webs = 60
  mas = 60
}

$created = 0
$createFailed = 0

foreach ($cat in $targets.Keys) {
  $needed = [int]$targets[$cat]
  $catCreated = 0
  $attempt = 0
  while ($catCreated -lt $needed -and $attempt -lt ($needed * 20)) {
    $attempt++
    $seed = ($attempt * 97) + ($created * 3)
    $product = Build-CategoryProduct -category $cat -index $seed
    $key = Normalize-Key $product.nombre $product.marca
    if ($existingKeys.Contains($key)) {
      continue
    }
    try {
      $body = $product | ConvertTo-Json -Depth 8
      Invoke-RestMethod -Uri "$ApiBase/admin/products" -Method Post -Headers $headers -ContentType "application/json" -Body $body | Out-Null
      [void]$existingKeys.Add($key)
      $catCreated++
      $created++
    } catch {
      $createFailed++
    }
    if ($PauseMs -gt 0) { Start-Sleep -Milliseconds $PauseMs }
  }
  Write-Host ("Categoria {0}: creados {1}/{2}" -f $cat, $catCreated, $needed)
}

$final = Invoke-RestMethod -Uri "$ApiBase/products?limit=1" -Method Get
Write-Host ("Final OK. Total catalogo: {0} | Nuevos creados: {1} | Fallidos crear: {2}" -f $final.pagination.total, $created, $createFailed)
