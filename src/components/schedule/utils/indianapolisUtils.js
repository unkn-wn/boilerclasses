// https://www.purdue.edu/campus-map/graphics/indycampusmap.pdf, last updated 2026-04-14
const INDIANAPOLIS_BUILDING_CODES = new Set([
    "AD",
    "AMP",
    "ASB", // "Future Site of Academic Success Building"
    "BS",
    "CA",
    "CE",
    "DAL",
    "EL",
    "ES",
    "ET",
    "HAPI",
    "HO",
    "HR",
    "IF",
    "IH",
    "IO",
    "IP",
    "IT",
    "LD",
    "LE",
    "LUX",
    "MT",
    "NH",
    "NU",
    "OT",
    "PE",
    "RG",
    "SL",
    "UC",
    "UH",
    "UL"    
]);

export const isIndianapolisRoom = (room = '') => {
  const buildingCode = room.trim().replace(/\s+/g, ' ').split(' ')[0].toUpperCase();
  //console.log(`room: ${room}, code: ${buildingCode}, isIndy: ${INDIANAPOLIS_BUILDING_CODES.has(buildingCode)}`);
  return INDIANAPOLIS_BUILDING_CODES.has(buildingCode);
};
