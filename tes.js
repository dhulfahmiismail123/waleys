import { Impit } from "impit";

const impit = new Impit({ browser: "chrome" });

const res = await impit.fetch('https://m.rivalregions.com/parliament/offer?c=6c4429fcbdb88ecd734725da37aed312', { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; itel P661N Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.143 Mobile Safari/537.36', 'Cookie': 'rr=c1198226f2a4d47bb79481e9d9f3b700; rr_id=2001665726; rr_add=96a7d6936710f64d0b3620da52b4c2e2; rr_f=68a00b099b4d26a078e081d7f95aea48; PHPSESSID=1p1stp80sivhkf8rgp64902egc' } });

// ISI DENGAN KONTEN DARI FILE HTTP-RESPONSE.TXT ANDA
const data = await res.text();

// Fungsi untuk membersihkan dan mengurai JSON dari string
function cleanAndParseJson(jsonString) {
    if (!jsonString) return null;
    let validJson = jsonString.replace(/'/g, '"').replace(/\n\s*/g, '');
    validJson = validJson.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
    try {
        return JSON.parse(validJson);
    } catch (e) {
        return null;
    }
}

// Regex untuk menemukan semua variabel ddData_ dan ddnow_
const ddDataRegex = /var\s+(ddData_[a-zA-Z_]+|ddnow_[a-zA-Z_]+)\s*=\s*(\[[^;]+\]|{[^;]+}|.+?);/g;
let match;
const dataObjects = {};
while ((match = ddDataRegex.exec(data)) !== null) {
    const varName = match[1];
    let varValue = match[2];
    if (varValue.startsWith('[') || varValue.startsWith('{')) {
      dataObjects[varName] = cleanAndParseJson(varValue);
    } else {
        dataObjects[varName] = varValue.trim().replace(/;$/, '');
    }
}

// Regex untuk menemukan semua div dengan atribut url dan teksnya
const actionDivRegex = /<div\s+url="(\d+)"[^>]*>([\s\S]*?)<\/div>/g;
const uniqueActions = new Map();
while ((match = actionDivRegex.exec(data)) !== null) {
    const urlId = match[1];
    const divContent = match[2];
    const nameMatch = divContent.match(/<div class="offer_l1[^>]*>([\s\S]*?)<\/div>/);
    const actionName = nameMatch ? nameMatch[1].trim() : 'Nama tidak ditemukan';
    
    // Perbaikan: Mencari nama aksi dari elemen dd-option-selected
    if (actionName === 'Nama tidak ditemukan' && divContent.includes('dd-option-selected')) {
        const ddOptionNameMatch = divContent.match(/<span class="dd-option-text">([\s\S]*?)<\/span>/);
        if (ddOptionNameMatch) {
            uniqueActions.set(urlId, ddOptionNameMatch[1].trim());
        }
    } else {
        uniqueActions.set(urlId, actionName);
    }
}

// Cari dan kumpulkan semua data aksi yang relevan
const allResources = dataObjects.ddData_resources || [];
const allRegions = dataObjects.ddData_state_regions || [];
const allCountries = dataObjects.ddData_countries || [];
const allAutonomies = dataObjects.ddData_state_autonomies || [];
const allGovs = dataObjects.ddData_state_govs ? Object.values(dataObjects.ddData_state_govs).flat() : [];

// Fungsi untuk membuat objek "where" berdasarkan jenis aksi
function getWhereObject(actionId) {
    const commonTargets = {
        regions: allRegions.map(r => ({ name: r.text, value: r.value })),
        resources: allResources.map(r => ({ name: r.text, value: r.value })),
        countries: allCountries.map(c => ({ name: c.text, value: c.value })),
        autonomies: allAutonomies.map(a => ({ name: a.text, value: a.value })),
        govs: allGovs.map(g => ({ name: g.text, value: g.value })),
    };

    switch(actionId) {
        case '3': // Bangunan baru
        case '14': // Konsolidasi wilayah
        case '16': // Kemerdekaan
        case '26': // Wilayah
        case '35': // Transfer anggaran
        case '41': // Wilayah
            return {
                'jenis_objek': 'Wilayah Negara',
                'daftar_objek': commonTargets.regions
            };
        case '18': // Eksplorasi sumber daya
        case '34': // Penjelajahan Lebih Dalam
        case '42': // Eksplorasi sumber daya: negara
            return {
                'jenis_objek': 'Sumber Daya',
                'daftar_objek': commonTargets.resources
            };
        case '12': // Kesepakatan militer
        case '19': // Perjanjian migrasi
            return {
                'jenis_objek': 'Negara Target',
                'daftar_objek': commonTargets.countries
            };
        case '36': // Mengusir Gubernur
            return {
                'jenis_objek': 'Gubernur',
                'daftar_objek': commonTargets.govs
            };
        case '6': // Jual sumber daya
            return {
                'jenis_objek': 'Negara/Wilayah Target',
                'daftar_objek': [...commonTargets.regions, ...commonTargets.countries]
            };
        default:
            return {
                'jenis_objek': 'Tidak spesifik',
                'daftar_objek': 'Lihat skrip untuk info lebih lanjut'
            };
    }
}

const finalOutput = {
    format: {
        url: 'parliament/donew/' + 'tmp_2' + '/' + 'tmp' + '/' + 'where',
        data: {
            tmp_gov: "'tmp'",
            c: 'TOKEN_KEAMANAN_DINAMIS'
        }
    },
    action: []
};

uniqueActions.forEach((actionName, actionId) => {
    finalOutput.action.push({
        name: actionName,
        tmp: {
            name: actionName,
            value: actionId
        },
        tmp_2: {
            name: 'URL Builder ID',
            value: dataObjects.ddnow_build_url || 'N/A'
        },
        where: getWhereObject(actionId)
    });
});

console.log(JSON.stringify(finalOutput, null, 2));
