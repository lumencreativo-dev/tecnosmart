/**
 * Motor Inteligente de Reconocimiento de Marcas y Categorías por SKU / Modelo
 * Diseñado específicamente para catálogos de seguridad electrónica, redes, telecomunicaciones y energía.
 */

export interface MatchResult {
  marca: string;
  categoria: string;
}

export function inferirMarcaPorSKU(skuRaw: string, descripcionRaw: string = ""): MatchResult {
  const s = (skuRaw || "").trim().toUpperCase();
  const d = (descripcionRaw || "").trim().toUpperCase();
  const comb = `${s} ${d}`;

  // 1. EZVIZ (Cámaras WiFi, cerraduras inteligentes, domótica, robots aspiradora)
  // Prácticamente todos los modelos de EZVIZ comienzan con CS-
  if (
    s.startsWith("CS-") ||
    comb.includes("EZVIZ") ||
    s.startsWith("EZ-")
  ) {
    let cat = "Cámaras WiFi / PTZ";
    if (s.includes("-DL") || s.includes("-L2S") || comb.includes("CERRADURA") || comb.includes("LOCK")) {
      cat = "Cerraduras y Control de Acceso";
    } else if (s.includes("-CARD") || s.includes("MICRO-SD") || s.includes("MICROSD")) {
      cat = "Memorias RAM y MicroSD";
    } else if (s.includes("-SOLAR") || s.includes("-PBC") || comb.includes("SOLAR PANEL") || comb.includes("BATERIA")) {
      cat = "Inversores y Baterías";
    } else if (s.includes("-SD7") || s.includes("-HP7") || comb.includes("PORTERO") || comb.includes("TIMBRE") || comb.includes("PANTALLA")) {
      cat = "Video Porteros y Pantallas";
    } else if (s.includes("-RE4") || s.includes("-RC3") || s.includes("-RA-KIT") || s.includes("-T30") || comb.includes("ASPIRADORA") || comb.includes("ROBOT") || comb.includes("ENCHUFE")) {
      cat = "Domótica y Smart Home";
    } else if (s.includes("-T9C") || s.includes("-A3") || comb.includes("SIREN") || comb.includes("SENSOR")) {
      cat = "Alarmas y Sensores";
    } else if (s.includes("-RT1") || s.includes("AX3000") || comb.includes("ROUTER")) {
      cat = "Redes, Routers y OLT/ONT";
    } else if (s.includes("-BW") || s.includes("-X5S") || comb.includes("NVR")) {
      cat = "Cámaras IP y NVR";
    }
    return { marca: "EZVIZ", categoria: cat };
  }

  // 2. HIKVISION & HILOOK
  // HiLook (Serie THC, THD, THB, PTZ HiLook)
  if (
    s.startsWith("THC-") ||
    s.startsWith("THD-") ||
    s.startsWith("THB-") ||
    s.startsWith("HL-") ||
    comb.includes("HILOOK")
  ) {
    let cat = "Cámaras Analógicas y Domos";
    if (s.includes("PTZ") || s.includes("WIFI")) cat = "Cámaras WiFi / PTZ";
    return { marca: "HiLook", categoria: cat };
  }

  // Hikvision (DS-, IDS-, HKF, HKV)
  if (
    s.startsWith("DS-") ||
    s.startsWith("IDS-") ||
    s.startsWith("HKF") ||
    s.startsWith("HKV") ||
    comb.includes("HIKVISION") ||
    comb.includes("ACUSENSE") ||
    comb.includes("COLORVU")
  ) {
    let cat = "Cámaras Analógicas y Domos";
    if (s.includes("DS-2CD") || s.includes("DS-76") || s.includes("DS-77") || s.includes("NVR")) {
      cat = "Cámaras IP y NVR";
    } else if (s.includes("DS-2CV") || s.includes("LIDWF") || s.includes("WIFI") || s.includes("EASY LINK")) {
      cat = "Cámaras WiFi / PTZ";
    } else if (s.includes("HKF") || s.includes("FUENTE")) {
      cat = "Fuentes de Poder / UPS";
    } else if (s.includes("HKVB") || s.includes("BALUM") || s.includes("BALUN")) {
      cat = "Accesorios y Varios";
    } else if (s.includes("HGHI") || s.includes("HQHI") || s.includes("HUHI") || s.includes("XVR")) {
      cat = "Cámaras Analógicas y Domos";
    }
    return { marca: "Hikvision", categoria: cat };
  }

  // 3. DAHUA
  if (
    s.startsWith("DH-") ||
    s.startsWith("DHI-") ||
    s.startsWith("HAC-") ||
    comb.includes("DAHUA")
  ) {
    let cat = "Cámaras Analógicas y Domos";
    if (s.includes("PFM") && comb.includes("CABLE")) {
      cat = "Conectividad y Fibra Óptica";
    } else if (s.includes("IPC") || s.includes("NVR")) {
      cat = "Cámaras IP y NVR";
    } else if (s.includes("XVR") || s.includes("HCVR")) {
      cat = "Cámaras Analógicas y Domos";
    }
    return { marca: "Dahua", categoria: cat };
  }

  // 4. MIKROTIK
  if (
    s.startsWith("RB") ||
    s.startsWith("CRS") ||
    s.startsWith("CCR") ||
    s.startsWith("CAP") ||
    s.startsWith("HEX") ||
    comb.includes("MIKROTIK") ||
    comb.includes("ROUTEROS")
  ) {
    let cat = "Redes, Routers y OLT/ONT";
    if (s.startsWith("CRS") || comb.includes("SWITCH")) {
      cat = "Switches Empresariales";
    }
    return { marca: "MikroTik", categoria: cat };
  }

  // 5. RUIJIE / REYEE
  if (
    s.startsWith("RG-") ||
    comb.includes("REYEE") ||
    comb.includes("RUIJIE")
  ) {
    let cat = "Switches Empresariales";
    if (s.includes("RAP") || s.includes("EW") || comb.includes("ROUTER") || comb.includes("ACCESS POINT")) {
      cat = "Redes, Routers y OLT/ONT";
    }
    return { marca: "Reyee", categoria: cat };
  }

  // 6. GRANDSTREAM (Telefonía IP, Centrales UCM, Teléfonos Inalámbricos DP/GRP/GXP, Access Points GWN)
  if (
    s.startsWith("DP7") ||
    s.startsWith("DP") ||
    s.startsWith("GXP") ||
    s.startsWith("GRP") ||
    s.startsWith("GXV") ||
    s.startsWith("WP8") ||
    s.startsWith("UCM") ||
    s.startsWith("HT8") ||
    s.startsWith("GWN") ||
    s.startsWith("GSC") ||
    comb.includes("GRANDSTREAM")
  ) {
    let cat = "Accesorios y Varios";
    if (s.startsWith("GWN") || comb.includes("ACCESS POINT") || comb.includes("ROUTER")) {
      cat = "Redes, Routers y OLT/ONT";
    } else if (comb.includes("SWITCH")) {
      cat = "Switches Empresariales";
    } else {
      cat = "Accesorios y Varios"; // o Telefonía IP
    }
    return { marca: "Grandstream", categoria: cat };
  }

  // 7. UBIQUITI / UNIFI
  if (
    s.startsWith("U6-") ||
    s.startsWith("UAP-") ||
    s.startsWith("USW-") ||
    s.startsWith("UDM-") ||
    s.startsWith("ER-") ||
    s.startsWith("ES-") ||
    s.startsWith("AF-") ||
    s.startsWith("NBE-") ||
    s.startsWith("PBE-") ||
    s.startsWith("LBE-") ||
    comb.includes("UBIQUITI") ||
    comb.includes("UNIFI")
  ) {
    let cat = "Redes, Routers y OLT/ONT";
    if (s.startsWith("USW-") || comb.includes("SWITCH")) cat = "Switches Empresariales";
    return { marca: "Ubiquiti", categoria: cat };
  }

  // 8. CDP (Chicago Digital Power) & FUENTES DE PODER
  if (
    s.startsWith("CF18") ||
    s.startsWith("CF9") ||
    s.startsWith("B-UPR") ||
    s.startsWith("R-UPR") ||
    s.startsWith("UPO") ||
    s.startsWith("EP5A") ||
    s.startsWith("F1A") ||
    s.startsWith("F20A") ||
    s.startsWith("F3A") ||
    s.startsWith("F5A") ||
    comb.includes("CENTRAL DE PODER") ||
    comb.includes("FUENTE DE PODER") ||
    comb.includes("CDP") ||
    s.startsWith("UPS ")
  ) {
    return { marca: "CDP", categoria: "Fuentes de Poder / UPS" };
  }

  // 9. STARLINK
  if (
    s.includes("STARLINK") ||
    s === "REGION" ||
    s === "RES" ||
    comb.includes("STARLINK")
  ) {
    return { marca: "Starlink", categoria: "Servicios" };
  }

  // 8. DISCOS DUROS & ALMACENAMIENTO (Seagate / Western Digital / Kingston)
  if (
    s === "DDR" ||
    s.startsWith("ST") ||
    s.startsWith("WD") ||
    comb.includes("DISCO DURO") ||
    comb.includes("SAEGATE") ||
    comb.includes("SEAGATE") ||
    comb.includes("SKYHAWK") ||
    comb.includes("WESTERN DIGITAL") ||
    comb.includes("PURPLE")
  ) {
    const marca = comb.includes("WESTERN") || comb.includes("WD") ? "Western Digital" : "Seagate";
    return { marca, categoria: "Discos Duros y SSD" };
  }

  // 9. FIBRA ÓPTICA Y CABLEADO (Cablix, LinkedPro, STC, Genérico)
  if (
    s.startsWith("CAT-5") ||
    s.startsWith("CAT-6") ||
    s.startsWith("CANALETAS") ||
    s.startsWith("CAJ-PLAS") ||
    s.startsWith("HDMI") ||
    s.startsWith("SPLITTER") ||
    s.startsWith("PA 1M") ||
    s === "CH" ||
    s === "CM" ||
    s.startsWith("VBB") ||
    comb.includes("FIBRA") ||
    comb.includes("BOBINA") ||
    comb.includes("PATCH CORD")
  ) {
    let marca = "Genérico";
    if (comb.includes("CABLIX")) marca = "Cablix";
    else if (comb.includes("LINKEDPRO")) marca = "LinkedPro";
    else if (comb.includes("STC")) marca = "STC";
    return { marca, categoria: "Conectividad y Fibra Óptica" };
  }

  // 10. HUAWEI (FTTH, OLT, ONT, Switches S series, IdeaHub)
  if (
    s.startsWith("HG8") ||
    s.startsWith("EG8") ||
    s.startsWith("MA58") ||
    s.startsWith("S57") ||
    s.startsWith("S67") ||
    s.startsWith("S220") ||
    s.startsWith("S310") ||
    s.startsWith("AR6") ||
    comb.includes("HUAWEI") ||
    comb.includes("ECHOLIFE") ||
    comb.includes("IDEAHUB") ||
    comb.includes("CLOUDENGINE")
  ) {
    let cat = "Redes, Routers y OLT/ONT";
    if (s.startsWith("S57") || s.startsWith("S67") || s.startsWith("S220") || s.startsWith("S310") || comb.includes("SWITCH")) {
      cat = "Switches Empresariales";
    }
    return { marca: "Huawei", categoria: cat };
  }

  // 11. ZKTECO (Control de acceso, cerraduras biométricas, asistencia)
  if (
    s.startsWith("ZK") ||
    s.startsWith("K1-") ||
    s.startsWith("F22") ||
    s.startsWith("MB") ||
    comb.includes("ZKTECO") ||
    comb.includes("BIOMETRIC")
  ) {
    return { marca: "ZKTeco", categoria: "Cerraduras y Control de Acceso" };
  }

  // 12. TAPO / TP-LINK
  if (s.startsWith("TAPO") || s.startsWith("TL-") || comb.includes("TP-LINK")) {
    return { marca: "TP-Link", categoria: "Cámaras WiFi / PTZ" };
  }

  // Default: Otra / Accesorios y Varios
  return { marca: "Otra", categoria: "Accesorios y Varios" };
}
