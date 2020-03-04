![RIESGOS Logo](src/assets/logos/riesgos_base_small_en.svg "RIESGOS Logo")

## Rationale
Natural hazards often consist of multiple, cascading processes (an earthquake causes a tsunami which damages powerlines, ...), whereas scientific models usually try to model just one of these processes at a time.
We exposed several scientific models as WPS and combined them in a simple web-frontend to allow for a more holistic approach to multistep risk-management.


## Background
This web application is the frontend for the orchestration of webservices. During the RIESGOS-project, a number of scientific models (resp. their results) have been exposed by the project-partners using the WPS ([web processing service](https://www.ogc.org/standards/wps)) protocol. This SOAP-protocol describes the in- and outputs to the model used. This website serves as a frontend to those models, aiming to:
 - allow the user to set the inputs to a model, trigger its execution and display the models results
 - chain a series of models together to form a scenario that depicts the mulititude of processes that describes a natural hazard (e.g. earthquake + tsunami + infrastructure, volcanic eruption + ashfall + lahar, ...)
 - make it easy for the user to explore the range of effects a natural hazard can have

## Currently available services

| Name               | Provider | Description                                                                    | Github                                                      |
|--------------------|----------|--------------------------------------------------------------------------------|-------------------------------------------------------------|
| assetmaster        | GFZ      | provides exposure models upon geographical query                               | https://github.com/GFZ-Centre-for-Early-Warning/assetmaster |
| quakeledger        | GFZ      | returns earthquake events from a local database                                | https://github.com/GFZ-Centre-for-Early-Warning/quakeledger |
| shakyground        | GFZ      | OpenQuake based ground motion field calculator as proposed by G.Weatherill     | https://github.com/GFZ-Centre-for-Early-Warning/shakyground |
| modelprop          | GFZ      | Program to serve a fragility / vulnerability model according to a given schema | https://github.com/GFZ-Centre-for-Early-Warning/modelprop   |
| deus               | GFZ      | Damage-Exposure-Update-Service                                                 | https://github.com/gfzriesgos/deus                          |
| volcanus           | GFZ      |                                                                                |                                                             |
| RiesgosFloodDamage | GFZ      |                                                                                | https://github.com/gfzriesgos/RiesgosFloodDamage            |
| System_Reliability | TUM      | reliability of infrastructure networks                                         | https://github.com/HugoRosero/System_Reliability            |
| Lahar Simulation   | TUM      |                                                                                |                                                             |
| Tsunami Simulation | AWI      |                                                                                |                                                             |
| Ashfall Simulation | IG-EPN   |                                                                                |                                                             |
| Flood Simulation   | geomer   |                                                                                |                                                             |


## Business logic
Our RIESGOS business model consists of `processes` and `products`. They form a directed, bipartite graph: each process provides one or more products, which may or may not be the input to another process. We arrange that graph in a linear sequence by running a `toposort` on it. This linear sequence is then displayed in the UI: by arranging the processes in a sequence, we make it easier to guide the user through the chain of steps necessary to simulate a full scenario. 


## Getting started
This project depends on the 'UKIS frontend libraries', which are distributed as packages on github. To use these packages, please follow the instructions on [the UKIS frontend libraries github page](https://github.com/dlr-eoc/ukis-frontend-libraries).

## Licenses
3rd party licenses are displayed with the component 'licenses.component'. This component requires there to be a file named 'licenses.json' in the assets directory. 
This file has been autogenerated with the 'license-checker' npm-module. When new dependencies are added, the file needs to be regenerated manually.

