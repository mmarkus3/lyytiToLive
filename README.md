# Skripti Lyytin ilmoittautumisista Tuloslistaan vientä varten

Skriptillä voi hakea KLL-kisaan tai Hippo-kisaan ilmoittautuneet.

## Käyttö
###### (Vain KLL) 
Luo itsellesi `cookie.ts` tiedosto jonne laitat Tuloslistan cookien ja osoitteen. Cookien saat kirjautumalla tuloslista.comiin johonkin kilpailuun ja avaamalla selaimen Network-täbin ja katsomalla jostain kutsusta cookien.

Esimerkki:
```
export const cookie = 'ARRAffinity=a5b9f4b6d50bfa11e84342298fd5cd54ff5d176198c38c2d5f2e6030470fa881; ARRAffinitySameSite=a5b9f4b6d50bfa11e84342298fd5cd54ff5d176198c38c2d5f2e6030470fa881; ASP.NET_SessionId=qiwujrc55lgd44bs3yaezkl1; __RequestVerificationToken=98PEgdMa28tbJn6pMhTluL11vWyBM01d4IG1O7Sn2TC4s15Z523tvLBzmcqyhyBmRaIOdk3nHYIA48iwOvCqcNKQOEhnXYEIyfWhZflGz9g1; .ASPXAUTH=85B6AD62FD464E606289D1B7358CBA5F665A9832C7A3FCEFACFEC6E7CE2D66C11D5DF45DF8D31D5BB98CC0D308E299BF0EC643816ABE58E1103943F785F28D7BD9115FDB2896BA1A5C0CB78D7EAACB1F4C9D410952BB153791A7DCE28BE9C45D1F82C279775E7167DBBC0BCF1EA788513182603DD87E9960A6950F25F422A518788D23932E8B3F4CACE8F0BE5131B403';

export const licenseUrl = 'https://www.tuloslista.com/Edit/LicenseDBQuery';
```

###### Molemmat
Kun olet asettanu cookien aja käännä ohjelma ja aja se.

### Kääntäminen
Aja `npm run build:kll` tai `npm run build:hippo`.

### Listan luominen
Aja `npm run run:kll` tai `npm run run:hippo`.
