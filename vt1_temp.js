// voit tutkia tarkemmin käsiteltäviä tietorakenteita konsolin kautta 
// tai json-editorin kautta osoitteessa http://jsoneditoronline.org/
// Jos käytät json-editoria niin avaa data osoitteesta:
// http://appro.mit.jyu.fi/tiea2120/vt/vt1/2018/data.json

// Seuraavilla voit tutkia käytössäsi olevaa tietorakennetta. Voit ohjelmallisesti
// vapaasti muuttaa selaimen muistissa olevan rakenteen sisältöä ja muotoa.

// console.log(data);

// console.dir(data);

// Kirjoita tästä eteenpäin oma ohjelmakoodis

"use strict";

/* TASO 5 
 *
 * Hirvea hassakka, mutta nayttaisi tulostavan sita mita pitaakin, joten olkoon nyt nain. Uskalla enaa menna siistimaan koodia, silla 
 * silloin jotain menee varmasti rikki.
 * */

/* Funktio, joka palauttaa merkkijonosta parsitun Date-olion. Jos parsinta epaonnistuu, niin funktio palauttaa null.
 * Merkkijonon taytyy olla muotoa dddd-dd-dd dd:dd:dd. */
function parsiAika(aikaStr)
{
  const pattern = /(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/;
  let [_, v, k, p, h,m,s] = pattern.exec(aikaStr) || []; 
  let date = new Date(`${v}-${k}-${p}T${h}:${m}:${s}+0000`);
  /* Testataan onko parsittu aika jarkeva. Jos ei ole, niin palautetaan null. */
  if (isNaN(date.getTime()))
  {
    return null;
  }
  let userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset);
}

/* Funktio, joka palauttaa listan kaikista mallidatan joukkueista. */
function getJoukkueet(malliData)
{
  let joukkueet = []; 
  for (let sarja of malliData["sarjat"])
  {
    for (let joukkue of sarja["joukkueet"])
    {
      joukkueet.push(joukkue);
    }
  }
  return joukkueet;
}

/* Funktio, joka palauttaa mallidatan rastit datan siten, etta kuhunkin objektiin on lisatty property piste, joka on tehtavanannon mukaan
 * laskettu piste koodista (ensimmainen koodin numero muuttuu pisteeksi, kaikki muut koodit 0:ksi.). Lisaksi lon ja lat muutetaan floatiksi tai NaN jos 
 * konvertointi epaonnistuu. id on muutettu stringiksi.*/
function getRastitData(malliData)
{
  return malliData["rastit"].map(x => { let k=0; if (x["koodi"].match(/^\d/)) k = parseInt(x["koodi"][0],10);
                                        return {kilpailu: x.kilpailu, 
       	 			                lon: parseFloat(x.lon),
       	 				        koodi: x.koodi,
       	 				        lat: parseFloat(x.lat),
       	 				        id: x["id"].toString(),
       	 				        piste: k};
                		       });
}

/* Funktio joka ottaa malliDatasta tupadatan ja konvertoi sen siten, etta aika on joko Date tai null, rasti on konvertoitu stringiksi ja joukkue pysyy sellaisenaan */
function getTupaData(malliData)
{
   return malliData["tupa"].map(x => { return {aika: x.aika, aika_date: parsiAika(x.aika), rasti: x["rasti"].toString(), joukkue: x.joukkue}; }); 
}

/* Funktio, joka ottaa argumenttina joukkueen ja getTupaDatan mukaisen tuparakenteen. Funktio etsii joukkuetta vastaavat 
 * tuvat. */
function etsiTuvat(joukkue, uusiTupaData)
{
  /* Etsitaan ne tuvat, jotka matsaavat joukkueen id:n kanssa. */
  return uusiTupaData.filter(x => x["joukkue"] === joukkue.id);
}

/* Laskee argumenttina annetun joukkueen pisteet ja palauttaa sen paluuarvona. */
function laskePisteet(joukkue, uusiTupaData, uusiRastiData)
{
  /* Haetaan joukkuetta vastaavat tuvat. */
  let joukkueenTuvat = etsiTuvat(joukkue, uusiTupaData);
  /* otetaan joukkueen rastit talteen ja poistetaan monikerrat. */
  let rastienIdt = new Set(joukkueenTuvat.map(x => x.rasti));

  let pointsit = 0;
  for (let r of rastienIdt)
  {
    for (let rasti of uusiRastiData)
    {
      if (rasti.id === r)
      {
        pointsit += rasti.piste;
	break;
      }
    }
  }
  return pointsit;
}

/* Funktio, joka laskee argumenttina annetun joukkueen ajan, matkan ja pisteet. Palauttaa olion {joukkue: joukkue, aika: string, matka: number, pisteet: number} */
function laske_matka_aika_pisteet(joukkue, uusiTupaData, uusiRastiData)
{
  /* Tahan tulee joukkueiden tuvat, josta on poistettu kaikki monikerrat. */
  let tuvat_no_monikerta = [];
  /* Haetaan joukkuetta vastaavat tuvat ja poistetaan sellaiset tuvat, jossa ei ole kunnollista aikaa. */
  let joukkueenTuvat = (etsiTuvat(joukkue, uusiTupaData)).filter(x => x.aika_date !== null);
  /* otetaan joukkueen rastit talteen ja poistetaan monikerrat. */
  let rastienIdt = Array.from(new Set(joukkueenTuvat.map(x => x.rasti)));
  /* Kaydaan kunkin joukkueen tupaData lapi siten, etta otetaan talteen aina ensimmainen rastin id sisaltama tupa talteen ja unohdetaan sita seuraavat vastaavat tuvat. */ 
  for (let x of rastienIdt)
  {
    tuvat_no_monikerta.push(joukkueenTuvat.find(y => y.rasti === x));  
  }
  /* Jarjestetaan tuvat viela varmuuden vuoksi ajan mukaan. */
  tuvat_no_monikerta.sort((x,y) => (x.aika_date).getTime() - (y.aika_date).getTime());
  let kokonaisAika = undefined;
  /* Lasketaan kokonaisaika viimeisimman ja ensimmaisen ajan erotuksena. */
  if (tuvat_no_monikerta.length > 1) 
  {
    kokonaisAika = tuvat_no_monikerta[tuvat_no_monikerta.length-1].aika_date -  tuvat_no_monikerta[0].aika_date;
  }

  /* Lasketaan matka. */

  /* Poistetaan rasteista sellaiset rastit, joilla ei ole koordinaatteja. Taman olisi voinnut tehda kerralla jossakin muualla, mutta olkoon nyt tassa. */
  let rastit_with_koordinates = uusiRastiData.filter(x => x.lat !== NaN && x.lon !== NaN);
  let matka = 0.0;
  let edellinenRasti = undefined; 
  /* Kaydaan lapi kukin joukkueen tupa, ja lasketaan aina edellisen tuvan rastin ja seuraavan rastin koordinaattien etaisyydet yhteen. */
  for (let t of tuvat_no_monikerta)
  {
    let rasti_now = rastit_with_koordinates.find(x => x.id === t.rasti);
    /* Jos rastia ei loydy id:n perusteella, niin skipataan se. */
    if (rasti_now === undefined) continue;
    if (edellinenRasti === undefined) { edellinenRasti = rasti_now; }  
    matka = matka + getDistanceFromLatLonInKm(edellinenRasti.lat,edellinenRasti.lon,rasti_now.lat,rasti_now.lon);
    edellinenRasti = rasti_now;
  }
  /* Palautetaan data. */
  return {joukkue: joukkue, matka: matka, aika: kokonaisAika, pisteet: laskePisteet(joukkue, uusiTupaData, uusiRastiData)};
}

/* Funktio, palauttaa ajan merkkijonona "dd:dd:dd"t tai "00:00:00", jos ei saada parsittua mitaan kunnollista. Funktio ei varmista onko date todellakin aika. */
function aikaToString(date)
{
  if (date === undefined) return "00:00:00";
  const p = /\d\d:\d\d:\d\d/;
  /* Kaytetaan toUTCString, silla perinteinen toString tekee kaikkea kikkailuja kuten lisaa 2 tuntia, koska aikavyohykkeemme on GTM+2. */
  let pDate = p.exec((new Date(date)).toUTCString());
  return pDate[0];
}

/* Funktio, joka tulostaa harjoituksen 1 tason 5 mukaisen tulostuksen. */
function tehtava5(malliData)
{
  /* Haetaan kaikki malliDatan joukkueet. */
  let joukkueet = getJoukkueet(malliData); 
  /* Haetaan rastidata muunnoksineen. */
  let rastiData = getRastitData(malliData);
  /* Haetaan tupadata muunnoksineen. */
  let tupaData  = getTupaData(malliData);
  /* Tahan tulee joukkueet data, joka sisaltaa joukkueen, matkan, keston ja pisteet. */
  let teht5JoukkueData = [];

  /* Kaydaan kaikki joukkueet lapi ja kerataan haluttu data talteen. */
  for (let x of joukkueet)
  {
    teht5JoukkueData.push(laske_matka_aika_pisteet(x, tupaData, rastiData)); 
  }

  /* Jarjestetaan joukkueet tulostusta varten. Tata ei ole testattu tilanteessa, etta pisteet ovat samat. */
  teht5JoukkueData.sort((x,y) => {if (y.pisteet - x.pisteet == 0) { return y.aika - x.aika;} else return y.pisteet - x.pisteet;});
  
  /* Apufunktio paddingia varten, kun tulostetaan tulosta. */
  let pad = (x, num) => x.padEnd(num, " ");
  
  /* Tulostetaan demo1:sen taso-5 tehtava. */
  for (let x of teht5JoukkueData)
  {
    let madka = Math.round(x.matka*Math.pow(10,0)/Math.pow(10,0)).toString();
    console.log(pad(x["joukkue"].nimi+ ", ",22) + pad(x.pisteet+ " p, ",8) + pad(madka + " km, ",8) +  pad(aikaToString(x.aika),8));
  }
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

