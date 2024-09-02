# mqtt4frenchtools

[![npm](https://img.shields.io/npm/v/mqtt4frenchtools)](https://www.npmjs.com/package/mqtt4frenchtools)
[![License](https://img.shields.io/github/license/WoCha-FR/mqtt4frenchtools)](https://raw.githubusercontent.com/WoCha-FR/mqtt4frenchtools/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/WoCha-FR/mqtt4frenchtools/node-js.yml?branch=main)](https://github.com/WoCha-FR/mqtt4frenchtools/actions)
[![Coverage Status](https://coveralls.io/repos/github/WoCha-FR/mqtt4frenchtools/badge.svg?branch=main)](https://coveralls.io/github/WoCha-FR/mqtt4frenchtools?branch=main)
[![npm](https://img.shields.io/npm/dt/mqtt4frenchtools)](https://www.npmjs.com/package/mqtt4frenchtools)

Publish values from french open api to MQTT and other usefull data.

## 1.2.3 UPDATE

New EDF Tempo API

## 1.2.2 UPDATE

Update School holidays for 2024-2025

## 1.2.1 UPDATE

Correct bug in Weather alert

## 1.2.0 UPDATE

Weather alert is now in three periods of level alert with start and stop timestamp

Topic vigiInondation is replaced by vigiCrue

## 1.1.0 UPDATE

Weather alert is now unavailable without an API Subscription.

Manual to create one : [API Manager Meteo France](https://portail-api.meteofrance.fr/authenticationendpoint/aide.do)

mqtt4frenchtools use Acces by [API key protocol](https://portail-api.meteofrance.fr/authenticationendpoint/aide.do#logic-schema)

### Data published

- Year information (number of days in year, day number in year, week number, ...)
- Saint of the day
- EDF Tempo color of today and tomorrow

And for each city provided as parameter :
- City information (INSEE code, School Zone, Latitude & Longitude, ...)
- Sun information (sunset, sunrise, ...)
- Moon Information (moonset, moonrise, ....)
- Statutory holiday (with Alsace-Moselle)
- School holidays (of the city School Zone)

### API Used

- [geo.api.gouv.fr](https://geo.api.gouv.fr/)
- [Le calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/information/)
- [Jours fériés en France](https://calendrier.api.gouv.fr/jours-feries/)
- [DonneesPubliquesVigilance](https://portail-api.meteofrance.fr/devportal/apis/5e99a87c-d50d-465b-a33f-1f12cf675161/overview)

## Installing

Simply install the package over npm. This will install all the required dependencies.

```
npm install -g mqtt4frenchtools
```

## Usage

```
Usage: mqtt4frenchtools [options]

Options:
  -a, --ville         ville                                              [array]
  -m, --apikey        apikey for weather alert
  -u, --mqttUrl       mqtt broker url              [default: "mqtt://127.0.0.1"]
  -t, --mqttTopic     mqtt topic prefix                 [default: "frenchtools"]
  -v, --logVerbosity  log verbosity
                   [choices: "error", "warn", "info", "debug"] [default: "info"]
  -s, --sslVerify     allow ssl connections with invalid certs
      --version       Show version number                              [boolean]
  -h, --help          Show help                                        [boolean]
```

### Example

```
mqtt4apcaccess -u mqtt://192.168.5.1 -a Lyon
```

## MQTT Frame Output

```
frenchtools/global/saints
{
  "saintj":"Jour de l'an",
  "saintj1":"Basile"
  "saintsj":"Sainte Agnès, Saint Almer, Saint Augustien, Saint Edme.",
  "saintsj1":"Saint Aciscle, Saint Alphée, Saint Denis d'Alexandrie."
}
```

```
frenchtools/global/annee
{
  "anNbjour":365,
  "anNumjour":326,
  "dstDate":"26/03/2023",
  "dstDiff":124,
  "anNumsem":47
}
```

```
frenchtools/global/edftempo
{
  "tempoBlancTotal": 43,
  "tempoBlancTires": 0,
  "tempoBlanc": 43,
  "tempoBlancDeb": '2024-09-01',
  "tempoBlancFin": '2025-08-31',
  "tempoBlancEtat": 'OUVERTE',
  "tempoBleuTotal": 300,
  "tempoBleuTires": 3,
  "tempoBleu": 297,
  "tempoDeb": '2024-09-01',
  "tempoFin": '2025-08-31',
  "tempoBleuEtat": 'OUVERTE',
  "tempoRougeTotal": 22,
  "tempoRougeTires": 0,
  "tempoRouge": 22,
  "tempoRougeDeb": '2024-11-01',
  "tempoRougeFin": '2025-03-31',
  "tempoRougeEtat": 'NON_COMMENCEE'
}
```

```
frenchtools/Lyon69/infos
{
  "nom":"Lyon",
  "insee":"69123",
  "deptnum":"69",
  "deptnom":"Rhône",
  "longitude":4.8351,
  "latitude":45.758,
  "zonevacances":"A"
}
```

```
frenchtools/Lyon69/ferie
{
  "ferCejour": 0,
  "ferNom": "",
  "ferProchaindate": "25/12",
  "ferProchainnom": "Jour de Noël",
  "ferProchainjour": 33
}
```

```
frenchtools/Lyon69/vacances
{
  "vacCejour": 0,
  "vacNom": "",
  "vacFin": "",
  "vacProchaindate": "17/12",
  "vacProchainom": "Vacances de Noël",
  "vacProchainjour": 24
}
```

```
frenchtools/Lyon69/soleil
{
  "soleilLever": "7:51",
  "soleilZenith": "12:28",
  "soleilCoucher": "17:05",
  "soleilElevation": "-24.94",
  "soleilElevzenith": "24.14",
  "soleilPosv": "-15.00",
  "soleilPosh": "230.00",
  "soleilDuree": "9:14",
  "soleilDiff": "-3m10s"
}
```

```
frenchtools/Lyon69/lune
{
  "luneLever": "05:49",
  "luneCoucher": "16:07",
  "luneElevation": "-33.55",
  "luneToujours": 0,
  "luneAbsente": 0,
  "lunePhase": "Dernier croissant"
}
```

```
frenchtools/Lyon69/vigilance
{
  "vigiAvalanche":"Vert",
  "vigiAvalancheD":1700110800,
  "vigiAvalancheF":1700262000,
  "vigiAvalanche1":"",
  "vigiAvalanche1D":"",
  "vigiAvalanche1F":"",
  "vigiAvalanche2":"",
  "vigiAvalanche2D":"",
  "vigiAvalanche2F":"",
  "vigiCrue":"Vert",
  "vigiCrueD":1700110800,
  "vigiCrueF":1700262000,
  "vigiCrue1":"",
  "vigiCrue1D":"",
  "vigiCrue1F":"",
  "vigiFroid":"Vert",
  "vigiFroidD":1700110800,
  "vigiFroidF":1700262000,
  "vigiFroid1":"",
  "vigiFroid1D":"",
  "vigiFroid1F":"",
  "vigiFroid2":"",
  "vigiFroid2D":"",
  "vigiFroid2F":"",
  "vigiNeige":"Vert",
  "vigiNeigeD":1700110800,
  "vigiNeigeF":1700262000,
  "vigiNeige1":"",
  "vigiNeige1D":"",
  "vigiNeige1F":"",
  "vigiNeige2":"",
  "vigiNeige2D":"",
  "vigiNeige2F":"",
  "vigiOrage":"Vert",
  "vigiOrageD":1700110800,
  "vigiOrageF":1700197200,
  "vigiOrage1":"Jaune",
  "vigiOrage1D":1700197200,
  "vigiOrage1F":1700244000,
  "vigiOrage2":"Vert",
  "vigiOrage2D":1700244000,
  "vigiOrage2F":1700262000,
  "vigiPluie":"Vert",
  "vigiPluieD":1700110800,
  "vigiPluieF":1700262000,
  "vigiPluie1":"",
  "vigiPluie1D":"",
  "vigiPluie1F":"",
  "vigiPluie2":"",
  "vigiPluie2D":"",
  "vigiPluie2F":"",
  "vigiVague":"Vert",
  "vigiVagueD":1700110800,
  "vigiVagueF":1700175600,
  "vigiVague1":"Jaune",
  "vigiVague1D":1700175600,
  "vigiVague1F":1700262000,
  "vigiVague2":"",
  "vigiVague2D":"",
  "vigiVague2F":"",
  "vigiVentD":1700110800,
  "vigiVentF":1700164800
  "vigiVent":"Vert",
  "vigiVent1":"Jaune",
  "vigiVent1D":1700164800,
  "vigiVent1F":1700233200,
  "vigiVent2":"Vert",
  "vigiVent2D":1700233200,
  "vigiVent2F":1700262000
}
```

## Versioning

mqtt4apcaccess is maintained under the [semantic versioning](https://semver.org/) guidelines.

See the [releases](https://github.com/WoCha-FR/mqtt4frenchtools/releases) on this repository for changelog.

## License

This project is licensed under MIT License - see the [LICENSE](LICENSE.md) file for details
