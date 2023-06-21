# mqtt4frenchtools

![npm](https://img.shields.io/npm/v/mqtt4frenchtools)
![License](https://img.shields.io/github/license/WoCha-FR/mqtt4frenchtools)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/WoCha-FRmqtt4frenchtools/node-js.yml?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/WoCha-FR/mqtt4frenchtools/badge.svg?branch=main)](https://coveralls.io/github/WoCha-FR/mqtt4frenchtools?branch=main)
![npm](https://img.shields.io/npm/dt/mqtt4frenchtools)

Publish values from french open api to MQTT and other usefull data.

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
  "tempoCoulj": "TEMPO_BLEU",
  "tempoCoulj1": "TEMPO_BLEU",
  "tempoBleu": 216,
  "tempoBlanc": 43,
  "tempoRouge": 22,
  "tempoDeb": "01/09/2022",
  "tempoFin": "31/08/2023"
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
  "vigiVent": "Vert",
  "vigiOrage": "Vert",
  "vigiPluie": "Vert",
  "vigiInondation": "Vert",
  "vigiNeige": "Vert",
  "vigiCanicule": "Vert",
  "vigiFroid": "Vert",
  "vigiAvalanche": "Vert",
  "vigiVague": "Vert"
}
```

## Versioning

mqtt4apcaccess is maintained under the [semantic versioning](https://semver.org/) guidelines.

See the [releases](https://github.com/WoCha-FR/mqtt4frenchtools/releases) on this repository for changelog.

## License

This project is licensed under MIT License - see the [LICENSE](LICENSE.md) file for details
