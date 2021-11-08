import {
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@material-ui/core";
import React, { Component } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import { Link } from "react-router-dom";

/**
 * Component to render a list of patients and patient search bar
 * pass in patients as a prop i.e. patients={patients}
 */
export class PatientList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      patientsSelected: "",
    };
  }

  changeSelectedPatient = (value) => {
    let patients = "";
    value.forEach((v) => {
      patients = patients.concat(v.patientId).concat(",");
    });
    this.setState({ patientSelected: patients });
  };

  renderPatients() {
    if (this.state.patientsFound === "") {
      return <p>No patients were found</p>;
    }
    var stringify = require("qs-stringify");
    console.log(this.props.patients);
    return this.props.patients.map((patient) => {
      let link =
        "/patientInfo?" +
        stringify({
          id: patient.patientId,
        });
      return (
        <ListItem key={patient.patientId} button component="a" href={link}>
          <ListItemText primary={patient.patientId} />
        </ListItem>
      );
    });
  }

  render() {
    var stringify = require("qs-stringify");
    return (
      <>
        <div>
          <Typography
            variant="h5"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Patient List
          </Typography>
        </div>

        <div>
          <Autocomplete
            multiple
            id="patients"
            options={this.props.patients}
            getOptionLabel={(option) => option.patientId}
            onChange={(event, value) => {
              this.changeSelectedPatient(value);
            }}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" />
            )}
          />
          <div
            className="control"
            style={{
              paddingTop: 5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Link
              to={{
                pathname: "patientInfo",
                search: stringify({
                  id: this.state.patientSelected,
                }),
              }}
              style={{ textDecoration: "none" }}
            >
              <Button variant="contained">Go to patient info</Button>
            </Link>
          </div>
        </div>
        <List
          style={{
            maxHeight: 400,
            overflow: "auto",
          }}
          component="nav"
        >
          {this.renderPatients()}
        </List>
      </>
    );
  }
}
