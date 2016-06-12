Where is my train?
========================

Learning project to explore [React](https://facebook.github.io/react/) and [redux](https://github.com/reactjs/redux).

Tried several architectures to handle side-effects: [redux-thunk](https://github.com/gaearon/redux-thunk), [redux-saga](https://github.com/yelouafi/redux-saga) and [EventSourcing/CQRS](https://msdn.microsoft.com/en-us/library/jj554200.aspx).

The purpose of the application is to show the current train positions of the French rail company SNCF in the "Ile de France" country.

Install
-------
Clone the github project.

The project uses in-memory SNCF data on the client-side. To reduce the footprint of the data, they are minified by custom Powershell scripts. Therefore the generation of SNCF data must be done on a Windows box.

First, you need the [Google Closure Compiler](https://developers.google.com/closure/compiler/docs/gettingstarted_app). Download it and install the compiler.jar file in a tools directory of the project.

Generate SNCF data

```powershell
# download the SNCF train schedulings
./Scripts/update-TrainSchedulings.ps1

# download the SNCF train stations
TODO...

# generate the JavaScript files
./Scripts/generate-TrainSchedulingObjects.ps1

# bundle and minify the SNCF data
./Scripts/minimize-SNCFData.ps1
```

The minified version of the SNCF data should have been generated in the ./Sources/src/assets.SNCFData.min.js file.
This is the only step that needs a Windows box, at least a powershell console. From now on, the remaining steps can be done on any OS that supports node.js.

Make sure the current directory is ./Sources

Install dependencies

```bash
npm install
```

Run
---

```bash
# start the server to handle redirection to the SNCF realtime data, so to avoid CORS issues
npm run server:dev

# start the development server of the client
npm run build:dev
```

Usage
----

```bash
# to show the list of next trains of a station
http://localhost:8082/#/stop/87382861/arrival/87384008

# to show the list of all the trains of a line
http://localhost:8082/#/line/87382861/arrival/87384008
```

Click on an item to show the details of that train.
