import * as XLSX from "xlsx";

export const MARCAS_CATALOGO = [
  "EZVIZ", "Hikvision", "HiLook", "Dahua", "CDP", "MikroTik", "Grandstream",
  "Reyee", "Ubiquiti", "Starlink", "Huawei", "Cablix", "STC", "LinkedPro",
  "Hiksemi", "Adata", "Acer", "Tapo", "TP-Link", "Nexxt",
  "ZKTeco", "Must", "Western Digital", "Seagate", "Genérico", "Otra"
];

export const CATEGORIAS_CATALOGO = [
  "Fuentes de Poder / UPS",
  "Reguladores de Voltaje / AVR",
  "Inversores y Baterías",
  "Cámaras WiFi / PTZ",
  "Cámaras Analógicas y Domos",
  "Cámaras IP y NVR",
  "Conectividad y Fibra Óptica",
  "Cajas de Empalme y ODF",
  "Carretes de Fibra y Cables",
  "Herrajes y Fijación",
  "Herramientas y Limpiadores",
  "Switches Empresariales",
  "Redes, Routers y OLT/ONT",
  "Discos Duros y SSD",
  "Memorias RAM y MicroSD",
  "Video Porteros y Pantallas",
  "Cerraduras y Control de Acceso",
  "Alarmas y Sensores",
  "Domótica y Smart Home",
  "Accesorios y Varios"
];

/**
 * Genera el Workbook de Excel oficial con 3 hojas:
 * 1. PRODUCTOS (con ejemplos reales listos para reemplazar)
 * 2. INSTRUCCIONES (reglas, tips de Google Sheets / Excel)
 * 3. MARCAS_Y_CATEGORIAS (referencia de catálogo)
 */
export function generarWorkbookPlantilla(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── HOJA 1: PRODUCTOS ──
  const datosProductos = [
    {
      codigo_sku: "CS-H6C-R101-2G3WF",
      nombre: "Cámara WiFi EZVIZ H6c 2MP 1080p 360 Pan/Tilt Audio Bi-direccional",
      marca: "EZVIZ",
      categoria: "Cámaras WiFi / PTZ",
      precio_costo: 24.50,
      precio_venta: 34.03,
      precio_bcv: 39.52,
      precio_tecnico: 28.93,
      margen_bloqueado: "NO",
      stock: 15,
      estatus: "DISPONIBLE",
      notas: "Cámara para interior, seguimiento inteligente"
    },
    {
      codigo_sku: "DS-7104HQHI-K1",
      nombre: "DVR Hikvision Turbo HD 4 Canales 1080p Lite H.265+",
      marca: "Hikvision",
      categoria: "Cámaras Analógicas y Domos",
      precio_costo: 38.00,
      precio_venta: 52.78,
      precio_bcv: 61.29,
      precio_tecnico: 44.86,
      margen_bloqueado: "NO",
      stock: 8,
      estatus: "DISPONIBLE",
      notas: "Soporta 1 HDD hasta 6TB"
    },
    {
      codigo_sku: "RB750Gr3",
      nombre: "Routerboard MikroTik hEX 5x Gigabit Ethernet Dual Core 880MHz",
      marca: "MikroTik",
      categoria: "Redes, Routers y OLT/ONT",
      precio_costo: 52.00,
      precio_venta: 72.22,
      precio_bcv: 83.87,
      precio_tecnico: 61.39,
      margen_bloqueado: "SI",
      stock: 5,
      estatus: "DISPONIBLE",
      notas: "Router balanceador / firewall (Margen bloqueado)"
    },
    {
      codigo_sku: "CAB-DROP-1H-1KM",
      nombre: "Bobina Cable Fibra Óptica Drop Figura 8 G657A1 1 Hilo 1000m",
      marca: "Cablix",
      categoria: "Carretes de Fibra y Cables",
      precio_costo: 45.00,
      precio_venta: 62.50,
      precio_bcv: 72.58,
      precio_tecnico: 53.13,
      margen_bloqueado: "NO",
      stock: 20,
      estatus: "DISPONIBLE",
      notas: "Mensajero de acero, uso exterior"
    },
    {
      codigo_sku: "CF18-1200",
      nombre: "UPS CDP Interactiva 1200VA / 720W 8 Tomas RJ45/RJ11",
      marca: "CDP",
      categoria: "Fuentes de Poder / UPS",
      precio_costo: 68.00,
      precio_venta: 94.44,
      precio_bcv: 109.68,
      precio_tecnico: 80.27,
      margen_bloqueado: "NO",
      stock: 10,
      estatus: "EN TRANSITO",
      notas: "Llegada estimada próxima semana"
    }
  ];

  const wsProductos = XLSX.utils.json_to_sheet(datosProductos, {
    header: [
      "codigo_sku",
      "nombre",
      "marca",
      "categoria",
      "precio_costo",
      "precio_venta",
      "precio_bcv",
      "precio_tecnico",
      "margen_bloqueado",
      "stock",
      "estatus",
      "notas"
    ]
  });

  // Configuración de anchos de columna para visualización cómoda
  wsProductos["!cols"] = [
    { wch: 22 }, // codigo_sku
    { wch: 55 }, // nombre
    { wch: 18 }, // marca
    { wch: 30 }, // categoria
    { wch: 16 }, // precio_costo
    { wch: 16 }, // precio_venta (Divisas)
    { wch: 16 }, // precio_bcv (BCV)
    { wch: 16 }, // precio_tecnico
    { wch: 18 }, // margen_bloqueado
    { wch: 12 }, // stock
    { wch: 16 }, // estatus
    { wch: 45 }, // notas
  ];

  XLSX.utils.book_append_sheet(wb, wsProductos, "PRODUCTOS");

  // ── HOJA 2: INSTRUCCIONES ──
  const datosInstrucciones = [
    ["TECNOSMART ERP - GUÍA DE LLENADO PARA CARGA MASIVA"],
    [""],
    ["REGLAS ESENCIALES PARA EVITAR ERRORES:"],
    ["1. No modifiques ni borres la primera fila (los encabezados) de la hoja 'PRODUCTOS'."],
    ["2. Las columnas obligatorias son 'codigo_sku' y 'nombre'."],
    ["3. El 'codigo_sku' debe ser único para cada producto (ej: CS-C6N-2MP, RB750Gr3). No repetir."],
    ["4. La 'marca' y 'categoria' son OPCIONALES: si las dejas vacías, el sistema TecnoSmart las inferirá de forma inteligente por el SKU."],
    ["5. En 'precio_costo' ingresa únicamente números con punto decimal (ej: 45.50 o 12.00). NO coloques el símbolo $ ni Bs."],
    ["6. 'precio_venta' (Divisas) y 'precio_bcv' (Oficial BCV) son OPCIONALES: si los dejas en 0 o vacíos, el sistema los calculará automáticamente con los márgenes globales (Divisas 28%, BCV 38%)."],
    ["7. En 'margen_bloqueado' coloca 'SI' si deseas proteger el margen individual de este producto contra ajustes masivos (Candado 🔒). De lo contrario, coloca 'NO'."],
    ["8. Si un producto no tiene precio o costo aún, déjalo en blanco o en 0. El sistema lo cargará con costo $0 para que no se pierda."],
    ["9. En 'stock' ingresa números enteros (ej: 10, 0, 50)."],
    ["10. En 'estatus' puedes colocar: DISPONIBLE, EN TRANSITO, o NO DISPONIBLE."],
    ["11. No combines celdas ni agregues filas de subtotales o banners decorativos."],
    [""],
    ["CÓMO USAR DESDE GOOGLE SHEETS:"],
    ["1. Llena tus productos en Google Sheets siguiendo estas mismas columnas."],
    ["2. Ve a: Archivo > Descargar > Microsoft Excel (.xlsx)"],
    ["3. Sube el archivo .xlsx descargado directamente al módulo de Carga Masiva."],
    [""],
    ["CÓMO USAR DESDE EXCEL:"],
    ["1. Llena tus productos en la hoja 'PRODUCTOS' de este mismo archivo."],
    ["2. Guarda los cambios (Ctrl + G o Archivo > Guardar)."],
    ["3. Sube este archivo en el módulo de Carga Masiva de TecnoSmart."]
  ];

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(datosInstrucciones);
  wsInstrucciones["!cols"] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, "INSTRUCCIONES");

  // ── HOJA 3: MARCAS Y CATEGORIAS ──
  const maxLen = Math.max(MARCAS_CATALOGO.length, CATEGORIAS_CATALOGO.length);
  const datosReferencias: any[] = [
    { MARCAS_VALIDAS: "MARCAS RECOMENDADAS", CATEGORIAS_VALIDAS: "CATEGORIAS RECOMENDADAS" }
  ];

  for (let i = 0; i < maxLen; i++) {
    datosReferencias.push({
      MARCAS_VALIDAS: MARCAS_CATALOGO[i] || "",
      CATEGORIAS_VALIDAS: CATEGORIAS_CATALOGO[i] || ""
    });
  }

  const wsReferencias = XLSX.utils.json_to_sheet(datosReferencias);
  wsReferencias["!cols"] = [{ wch: 26 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsReferencias, "MARCAS_Y_CATEGORIAS");

  return wb;
}

/**
 * Descarga en el navegador el archivo Excel oficial .xlsx
 */
export function descargarPlantillaExcel(): void {
  const wb = generarWorkbookPlantilla();
  XLSX.writeFile(wb, "TecnoSmart_Plantilla_Carga_Masiva.xlsx");
}

/**
 * Descarga en el navegador la versión CSV UTF-8 básica
 */
export function descargarPlantillaCSV(): void {
  const contenidoCSV = [
    "codigo_sku,nombre,marca,categoria,precio_costo,precio_venta,precio_bcv,precio_tecnico,margen_bloqueado,stock,estatus,notas",
    'CS-H6C-R101-2G3WF,"Cámara WiFi EZVIZ H6c 2MP 1080p 360 Pan/Tilt Audio Bi-direccional",EZVIZ,"Cámaras WiFi / PTZ",24.50,34.03,39.52,28.93,NO,15,DISPONIBLE,"Cámara interior"',
    'DS-7104HQHI-K1,"DVR Hikvision Turbo HD 4 Canales 1080p Lite H.265+",Hikvision,"Cámaras Analógicas y Domos",38.00,52.78,61.29,44.86,NO,8,DISPONIBLE,"Soporta 1 HDD"',
    'RB750Gr3,"Routerboard MikroTik hEX 5x Gigabit Ethernet Dual Core",MikroTik,"Redes, Routers y OLT/ONT",52.00,72.22,83.87,61.39,SI,5,DISPONIBLE,"Router balanceador"',
    'CAB-DROP-1H-1KM,"Bobina Cable Fibra Óptica Drop Figura 8 1 Hilo 1000m",Cablix,"Carretes de Fibra y Cables",45.00,62.50,72.58,53.13,NO,20,DISPONIBLE,"Mensajero acero"'
  ].join("\n");

  const blob = new Blob(["\uFEFF" + contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "TecnoSmart_Plantilla_Carga_Masiva.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta los productos actuales de la base de datos a un archivo Excel (.xlsx)
 * para que el usuario pueda modificarlos o usarlos como base.
 */
export function exportarProductosAExcel(productos: any[]): void {
  const wb = XLSX.utils.book_new();

  const filas = productos.map(p => ({
    codigo_sku: p.codigo_sku || "",
    nombre: p.nombre || "",
    marca: p.marca || "",
    categoria: p.categoria || "",
    precio_costo: Number(p.precio_costo || 0),
    precio_venta: Number(p.precio_venta || 0),
    precio_bcv: Number(p.precio_bcv || 0),
    precio_tecnico: Number(p.precio_tecnico || 0),
    margen_bloqueado: p.margen_bloqueado ? "SI" : "NO",
    margen_individual: p.margen_individual !== undefined && p.margen_individual !== null ? Number(p.margen_individual) : "",
    stock: Number(p.stock || 0),
    estatus: p.stock > 0 ? "DISPONIBLE" : "NO DISPONIBLE",
    notas: p.especificaciones_json?.notas || ""
  }));

  const ws = XLSX.utils.json_to_sheet(filas, {
    header: [
      "codigo_sku",
      "nombre",
      "marca",
      "categoria",
      "precio_costo",
      "precio_venta",
      "precio_bcv",
      "precio_tecnico",
      "margen_bloqueado",
      "margen_individual",
      "stock",
      "estatus",
      "notas"
    ]
  });

  ws["!cols"] = [
    { wch: 22 },
    { wch: 55 },
    { wch: 18 },
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "PRODUCTOS");
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `TecnoSmart_Catalogo_Exportado_${fecha}.xlsx`);
}
