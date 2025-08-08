import { writeFileSync, readFile } from 'fs';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

interface HippoItem {
  ['']: number;
  ['Lapsen etunimi']: string;
  ['Lapsen sukunimi']: string;
  ['Sarja ja lajitValitse sarja/sarjat, joihin lapsi osallistuu ja ilmoita jokainen lapsi erikseen. Osallistua voi joko yhteen tai kahteen lajiin. ']: string;
}

const linebreak = '\r\n';
const sourceDelimiter = ',';
const delimiter = ';';
const defaultClub = 'Hippo';
const defaultClubAbr = 'Ei seuraa';
const athleteType = '0';
const currentYear = new Date().getFullYear();
let entryIndex = 0;

function convertSport(sport: string) {
  switch (sport) {
    case 'pallonheitto':
      return 'bt';
    case 'palloheitto':
      return 'bt';
    case 'pituus':
      return 'lj';
    case 'kuula':
      return 'sp';
    default:
      return sport;
  }
}

function getKlass(klass: string, year: number) {
  const age = currentYear - year;
  const klassCode = ['Tytöt'].includes(klass) ? 'T' : 'P';
  return { klass: klassCode, age };
}

function getGender(sport: string) {
  if (sport.includes('Pojat')) {
    return 'M';
  } else if (sport.includes('Tytöt')) {
    return 'N';
  }
  return '';
}

function getSport(sportItem: string, athlete: number) {
  const gender = getGender(sportItem);
  if (gender === '') {
    return '';
  }
  const [klass, year, sport] = sportItem.split(' ');
  const it = getKlass(klass, +year);
  const sportCode = convertSport(sport);
  entryIndex++;
  return `&${entryIndex}${delimiter}${athlete}${delimiter}${it.klass}${delimiter}${it.age}${delimiter}${sportCode}${delimiter}${delimiter}`;
}

function getAthlete(row: HippoItem) {
  const num = row[''];
  const gender = getGender(row['Sarja ja lajitValitse sarja/sarjat, joihin lapsi osallistuu ja ilmoita jokainen lapsi erikseen. Osallistua voi joko yhteen tai kahteen lajiin. ']);
  const licenseCode = `S${100 + row['']}`;
  const athlete = `${row['']}${delimiter}${row['Lapsen sukunimi']}${delimiter}${row['Lapsen etunimi']}${delimiter}${defaultClub}${delimiter}${defaultClubAbr}${delimiter}${licenseCode}${delimiter}${delimiter}${delimiter}${gender}${delimiter}${athleteType}`;
  const sports = row['Sarja ja lajitValitse sarja/sarjat, joihin lapsi osallistuu ja ilmoita jokainen lapsi erikseen. Osallistua voi joko yhteen tai kahteen lajiin. '].split(sourceDelimiter);
  const firstEntry = getSport(sports[0].trim(), num);
  let secondEntry = null;
  if (sports.length > 1) {
    secondEntry = getSport(sports[1].trim(), num);
    return { athlete, firstEntry, secondEntry };
  } else {
    return { athlete, firstEntry };
  }
}

function saveFile(text: string) {
  writeFileSync(`hippo/lyyti-${new Date().toISOString()}.csv`, text, {
    flag: 'w',
    encoding: 'utf8',
  });
}

async function collectFile(data: HippoItem[]) {
  const result: string[] = [];
  const empty = data.filter((it) => it['Lapsen etunimi'] == null).length;
  data.map((row) => {
    const item = getAthlete(row);
    result.push(item.athlete);
    if (item.firstEntry !== '') {
      result.push(item.firstEntry);
    }
    if (item.secondEntry) {
      result.push(item.secondEntry);
    }
  });
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
const parsed = Papa.parse<HippoItem>(buf, { skipEmptyLines: true, header: true, dynamicTyping: true });

collectFile(parsed.data);