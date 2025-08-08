import { writeFileSync } from 'fs';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import axios from 'axios';
import { format } from 'date-fns';
import { cookie, licenseUrl } from './cookie'


interface LicenceItem {
  LicenceId: string;
  Firstname: string;
  Surname: string;
  DOB: string;
  Organization: { Name: string; NameShort: string }
}

interface KllItem {
  '': number;
  Etunimi: string;
  Sukunimi: string;
  'Osallistujan syntymävuosi (kirjoita muodossa esim. 2009)': number;
  'Osallistujan koulunkäyntikunta': string;
  'Koulu jota osallistuja edustaa': string;
  'Sportti-ID: ': number;
  'Osallistujan ikäsarja': string;
  'Osallistujan sarja': string;
  'M19 lajit joihin osallistuja ilmoitetaan': string;
  'N19 lajit joihin osallistuja ilmoitetaan ': string;
  'M17 lajit joihin osallistuja ilmoittautuu': string;
  'N17 lajit joihin osallistuja ilmoittautuu': string;
  'M15 lajit joihin osallistuja ilmoittautuu': string;
  'N15 lajit joihin osallistuja ilmoittautuu': string;
  'P13 lajit joihin osallistuja ilmoittautuu': string;
  'T13 lajit joihin osallistuja ilmoittautuu': string;
}

const linebreak = '\r\n';
const sourceDelimiter = ',';
const delimiter = ';';
const athleteType = '0';
let entryIndex = 0;

function convertSport(sport: string) {
  switch (sport) {
    case 'pituus':
      return 'lj';
    case 'kolmiloikka':
      return 'tj';
    case 'korkeus':
      return 'hj';
    case 'seiväs':
      return 'pv';
    case 'kuula':
      return 'sp';
    case 'moukari':
      return 'ht';
    case 'kiekko':
      return 'dt';
    case 'keihäs':
      return 'jt';
    case 'Keihäs':
      return 'jt';
    case '400m aj':
      return '400mh';
    case '300m aj':
      return '300mh';
    case '60m aj':
      return '60mh';
    case '80m aj':
      return '80mh';
    case '200m aj':
      return '200mh';
    case '110m aj':
      return '110mh';
    case '100m aj':
      return '100mh';
    case '3000m esteet':
      return '3000mst';
    case '2000m esteet':
      return '2000mst';
    case '1500m esteet':
      return '1500mst';
    case '3000m ej':
      return '3000mst';
    case '2000m ej':
      return '2000mst';
    case '1500m ej':
      return '1500mst';
    case '1500m ej.':
      return '1500mst';
    case '3000m kävely':
      return '3000mw';
    case '2000m kävely':
      return '2000mw';
    case '3-loikka':
      return 'tj';
    default:
      return sport;
  }
}

function getAthleteFromDb(q: string) {
  return axios.post(licenseUrl, { q }, { withCredentials: true, headers: { cookie } }
  ).then((response) => {
    if (response.data.results.length === 1) {
      const item = response.data.results[0] as LicenceItem;
      return item;
    }
  });
}

function getGender(sport: string) {
  if (sport.includes('Pojat')) {
    return 'M';
  } else if (sport.includes('Tytöt')) {
    return 'N';
  }
  return '';
}

function getSport(sportItem: string, athlete: number, klass: string, age: string) {
  const sports = sportItem.split(sourceDelimiter);
  return sports.map((sport) => {
    const sportCode = convertSport(sport.trim());
    entryIndex++;
    return `&${entryIndex}${delimiter}${athlete}${delimiter}${klass}${delimiter}${age}${delimiter}${sportCode}${delimiter}${delimiter}`;
  })
}

async function getAthlete(row: KllItem) {
  const gender = getGender(row['Osallistujan sarja']);
  const licenseCode = `${row['Sportti-ID: ']}`;
  if (licenseCode == null) {
    console.error('Urheilijalla ei lisenssiä', row);
    return;
  }
  const athleteDB = await getAthleteFromDb(licenseCode);
  if (athleteDB == null) {
    console.error('Urheilijaa ei löytynyt', row);
    return;
  }
  if (row.Sukunimi !== athleteDB.Surname || row.Etunimi !== athleteDB.Firstname) {
    console.error('Väärä urheilija', row[''], row.Sukunimi, row.Etunimi, athleteDB.Surname, athleteDB.Firstname, licenseCode);
    return;
  }
  const dob = new Date(athleteDB.DOB);
  if (+format(dob, 'yyyy') !== row['Osallistujan syntymävuosi (kirjoita muodossa esim. 2009)']) {
    console.error('Väärä syntymävuosi', row[''], row.Sukunimi, row.Etunimi, licenseCode, dob.toLocaleDateString(), row['Osallistujan syntymävuosi (kirjoita muodossa esim. 2009)']);
    return;
  }
  const athlete = `${row['']}${delimiter}${row.Sukunimi}${delimiter}${row.Etunimi}${delimiter}${athleteDB.Organization.Name}${delimiter}${athleteDB.Organization.NameShort}${delimiter}${licenseCode}${delimiter}${delimiter}${format(dob, 'd.M.yyyy')}${delimiter}${gender}${delimiter}${athleteType}`;
  const entries: string[] = [];
  if (row['M19 lajit joihin osallistuja ilmoitetaan']?.length > 0) {
    entries.push(...getSport(row['M19 lajit joihin osallistuja ilmoitetaan'], row[''], 'M', '19'));
  }
  if (row['N19 lajit joihin osallistuja ilmoitetaan ']?.length > 0) {
    entries.push(...getSport(row['N19 lajit joihin osallistuja ilmoitetaan '], row[''], 'N', '19'));
  }
  if (row['M17 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['M17 lajit joihin osallistuja ilmoittautuu'], row[''], 'M', '17'));
  }
  if (row['N17 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['N17 lajit joihin osallistuja ilmoittautuu'], row[''], 'N', '17'));
  }
  if (row['M15 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['M15 lajit joihin osallistuja ilmoittautuu'], row[''], 'M', '15'));
  }
  if (row['N15 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['N15 lajit joihin osallistuja ilmoittautuu'], row[''], 'N', '15'));
  }
  if (row['P13 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['P13 lajit joihin osallistuja ilmoittautuu'], row[''], 'P', '13'));
  }
  if (row['T13 lajit joihin osallistuja ilmoittautuu']?.length > 0) {
    entries.push(...getSport(row['T13 lajit joihin osallistuja ilmoittautuu'], row[''], 'T', '13'));
  }

  return { athlete, entries };
}

function saveFile(text: string) {
  writeFileSync(`kll/lyyti-${new Date().toISOString()}.csv`, text, {
    flag: 'w',
    encoding: 'utf8',
  });
}

async function collectFile(data: KllItem[]) {
  const result: string[] = [];
  const empty = data.filter((it) => it.Etunimi == null).length;
  for (const row of data.filter((it) => it.Etunimi != null)) {
    const item = await getAthlete(row);
    if (item) {
      result.push(item.athlete);
      item.entries.map((entry) => {
        result.push(entry);
      });
    }
  };
  const finalText = result.join(linebreak);
  saveFile(finalText);
  console.log('Konversio valmis. Luettu', data.length, ',', 'urheilijaa. Tyhjiä ', empty);
}

if (process.argv.length < 3) {
  throw Error('Anna raportti');
}

const sourceFileName = process.argv[2];

const wb: XLSX.WorkBook = XLSX.readFile(sourceFileName, { type: 'binary' });

/* grab first sheet */
const wsname: string = wb.SheetNames[0];
const ws: XLSX.WorkSheet = wb.Sheets[wsname];

/* save data */
const buf = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
const parsed = Papa.parse<KllItem>(buf, { skipEmptyLines: true, header: true, dynamicTyping: true });
collectFile(parsed.data);
