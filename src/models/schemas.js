const Nano = require('nano');

class User {
    constructor(id, name, lastName, email) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this._id = id;
        this._rev = undefined;
    }

    processAPIResponse(response) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}

class Role {
    constructor(name, usersPermissions, stationsPermissions) {
        this.name = name;
        this.usersPermissions = usersPermissions;
        this.stationsPermissions = stationsPermissions;
    }
}

class UserWithRole {
    constructor(id, user, role, systemId) {
        this.user = user;
        this.role = role;
        this.stationId = stationId;
        this._id = id;
        this._rev = undefined;
    }

    processAPIResponse(response) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}

class Station {
    constructor(id, name) {
      this._id = id;
      this._rev = undefined;
      this.name = name;
      this.users = [];
      }
  
    processAPIResponse(response) {
      if (response.ok === true) {
        this._id = response.id;
        this._rev = response.rev;
      }
    }
}
   
class StationInfo {
    constructor(id) {
        this._id = id;
        this._rev = undefined;
        this.comuna = "",
        this.year = "",
        this.month = "",
        this.day = "",
        this.time = "",
        this.timeUTC = "",  //borrado el -4
        this.data = {
            temperaturaAire: "",
            humedadAcumulada: "",
            precipitacionAcumulada: "",
            presionAtmosferica: "",
            radiacionSolar: "",
            temperaturaSuperficie: "",
            temperaturaSueloBajo10cm: "",
            temperaturaSueloBajo10cmMinima: "",
            temperaturaSueloBajo10cmMaxima: "",
            velocidadViento: "",
            rafagaViento: "",
            direccionViento: ""
            }
          }
        }

  export { Station, StationInfo, User, Role, UserWithRole };