import { writeFileSync, readFile } from 'fs';

const linebreak = '\r\n';
const sourceDelimiter = ',';
const delimiter = ';';
const defaultClub = 'Hippo';
const defaultClubAbr = 'Ei seuraa';
const athleteType = '0';
const currentYear = new Date().getFullYear();
let entryIndex = 0;

function convertSport(sport: string) {
  switch(sport) {
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

function getSport(sportItem: string, athlete: string) {
  const gender = getGender(sportItem);
  if (gender === '') {
    return '';
  }
  const [ klass, year, sport ] = sportItem.split(' ');
  const it = getKlass(klass, +year);
  const sportCode = convertSport(sport);
  entryIndex++;
  return `&${entryIndex}${delimiter}${athlete}${delimiter}${it.klass}${delimiter}${it.age}${delimiter}${sportCode}${delimiter}${delimiter}`;
}

function getAthlete(row: string, index: number) {
  const [ num, firstname, lastname, _email, _phone, sport1, sport2 ] = row.split(sourceDelimiter);
  const gender = getGender(sport1);
  const licenseCode = `S${100 + index}`;
  const athlete = `${num.trim()}${delimiter}${lastname}${delimiter}${firstname}${delimiter}${defaultClub}${delimiter}${defaultClubAbr}${delimiter}${licenseCode}${delimiter}${delimiter}${delimiter}${gender}${delimiter}${athleteType}`;
  const firstEntry = getSport(sport1.replace('"', '').trim(), num.trim());
  const secondEntry = getSport(sport2.replace('"', '').trim(), num.trim());
  return { athlete, firstEntry, secondEntry };
}

function saveFile(text: string) {
  writeFileSync(`lyyti-${new Date().toISOString()}.csv`, text, {
    flag: 'w',
    encoding: 'utf8',
   });
}

if (process.argv.length < 3) {
  throw Error('Anna raportti');
}

const sourceFileName = process.argv[2];

readFile(sourceFileName, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const result = [];
  const rows = data.split(linebreak);
  rows.map((row, index) => {
    const item = getAthlete(row, index);
    result.push(item.athlete);
    if (item.firstEntry !== '') {
      result.push(item.firstEntry);
    }
    if (item.secondEntry !== '') {
      result.push(item.secondEntry);
    }
  });
  const finalText = result.join(linebreak);
  saveFile(finalText);
  console.log('Konversio valmis. Luettu', rows.length, 'urheilijaa.');
});