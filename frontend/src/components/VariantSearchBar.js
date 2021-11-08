import {
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tab,
  TextField,
} from "@material-ui/core";
import React, { Component } from "react";
import { TabContext, TabList, TabPanel } from "@material-ui/lab";
import {
  extractGeneLocations,
  processPanelData,
  processVectisInput,
} from "../helpers.js";

import Autocomplete from "@material-ui/lab/Autocomplete";
import AutocompleteSearch from "../components/AutocompleteSearch";
import _ from "lodash";

const LoadingState = {
  WAITING: "WAITING",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
};

const Panels = {
  NONE: "NONE",
  GENOMICS_ENGLAND: "https://panelapp.genomicsengland.co.uk/api/v1/panels/",
  PANELAPP: "https://panelapp.agha.umccr.org/api/v1/panels/",
};

// this entire file is cursed
// TODO: Refactor

export class VariantSearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      variant: "",
      refAllele: "",
      altAllele: "",
      variantType: null,
      cutoffValue: 0,
      panelsLoading: LoadingState.WAITING,
      panelsOptions: null,
      currPanel: null,
      panelsChosen: null,
      patients: null,
      searchAllPatients: "true",
      tab: "1",
      panelData: {},
    };
  }

  changeVariant = (variant) => {
    this.setState({ variant: variant });
  };
  changeRefAllele = (event) => {
    this.setState({ refAllele: event.target.value });
  };
  changeAltAllele = (event) => {
    this.setState({ altAllele: event.target.value });
  };
  changeCutoffValue = (event) => {
    this.setState({ cutoffValue: event.target.value });
  };
  changePanelsChosen = (value) => {
    fetch(this.state.currPanel + value + "/", {
      method: "GET",
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data) {
          const [
            extractedNames,
            extractedChromosomes,
            extractedStartLocations,
            extractedEndLocations,
          ] = extractGeneLocations(data["genes"]);
          const panelData = {
            names: extractedNames,
            chromosomes: extractedChromosomes,
            startLocations: extractedStartLocations,
            endLocations: extractedEndLocations,
          };
          this.setState({ panelData: panelData });
        } else {
          alert("error in retrieving panels");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("error in query when retrieving panels");
      });

    this.setState({ panelsChosen: value });
  };
  changePatients = (value) => {
    this.setState({ patients: value });
  };
  changeSearchAllPatients = (event) => {
    this.setState({ searchAllPatients: event.target.value });
  };

  changeTab = (event, newValue) => {
    this.setState({ tab: newValue });
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    // reset chromosome information for vectis search
    let chromosomes = "",
      startLocations = "",
      endLocations = "";

    var stringify = require("qs-stringify");

    if (this.state.panelData.names) {
      chromosomes = this.state.panelData.chromosomes;
      startLocations = this.state.panelData.startLocations;
      endLocations = this.state.panelData.endLocations;
    }

    switch (this.props.type) {
      case "commonVariant": {
        this.props.setResults(LoadingState.LOADING);
        if (this.state.variant) {
          console.log(this.state.variant);
          chromosomes = chromosomes.concat(
            "CH" + this.state.variant.split(" ")[1].split(":")[0].concat(",")
          );
          startLocations = startLocations.concat(
            this.state.variant
              .split(" ")[1]
              .split(":")[1]
              .split("-")[0]
              .concat(",")
          );
          endLocations = endLocations.concat(
            this.state.variant
              .split(" ")[1]
              .split(":")[1]
              .split("-")[1]
              .concat(",")
          );
        }
        let patients = {};
        this.state.searchAllPatients === "true"
          ? (patients = this.props.patients)
          : (patients = this.state.patients);

        try {
          let gtPatients = patients;
          patients = "";

          for (let i = 0; i < gtPatients.length; i++) {
            const patientSearch = await fetch(
              `${process.env.REACT_APP_BACKEND}/mapping?id=${gtPatients[i].patientId}`,
              { headers: { Authorization: "Bearer " + this.props.token } }
            ).then((res) => res.json());

            patients = patients + patientSearch.mapping.sampleId + ",";
          }
          var vectisDatasets = processVectisInput(
            gtPatients,
            patients.split(",")
          );
          var vectisQueries = [];
          for (const [key, value] of Object.entries(vectisDatasets)) {
            let vectisQuery = {
              chromosome: chromosomes,
              positionStart: startLocations,
              positionEnd: endLocations,
              limit: 10000,
              dataset: key,
              het: "true",
              hom: "true",
              samples: value.join(","),
              conj: "true",
            };

            const vectisSearch = await fetch(
              "https://vsal.garvan.org.au/vsal/core/find?",
              {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + this.props.token,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(vectisQuery),
              }
            ).then((res) => res.json());
            if (vectisSearch) {
              vectisQueries.push(vectisSearch);
            } else {
              this.props.setResults(LoadingState.Failure);
              alert("error with vectis API");
            }
          }

          var variants = [];
          vectisQueries.forEach((vectisQuery) => {
            variants.push(vectisQuery.v);
          });

          variants = _.intersectionWith(
            ...variants,
            (a, b) => a.s === b.s && a.r === b.r && a.a === b.a
          );

          this.props.setResults({ v: variants });
        } catch (e) {
          console.log(e);
          alert("error with Vectis API");
          this.props.setResults(LoadingState.Failure);
        }
        break;
      }
      case "variantSearch": {
        if (!this.state.variant) {
          alert("Please enter a gene to be searched");
          return;
        }
        let query = stringify({
          variants: this.state.variant,
          cutoff: this.state.cutoffValue,
          refAllele: this.state.refAllele,
          altAllele: this.state.altAllele,
        });

        this.props.setResults(LoadingState.LOADING);
        try {
          const [submitSearch] = await Promise.all([
            fetch(`${process.env.REACT_APP_BACKEND}/variant_search?` + query, {
              method: "GET",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + this.props.token,
              },
            }).then((res) => res.json()),
          ]);
          if (submitSearch) {
            this.props.setResults(submitSearch);
          } else {
            alert("error");
            this.props.setResults(LoadingState.Failure);
          }
        } catch {
          alert("error in query");
          this.props.setResults(LoadingState.Failure);
        }
        break;
      }
      default: {
      }
    }
  };

  renderPanel = () => {
    if (this.state.panelsLoading === LoadingState.WAITING) {
      return <div></div>;
    } else if (this.state.panelsLoading === LoadingState.LOADING) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </div>
      );
    } else if (this.state.panelsLoading === LoadingState.SUCCESS) {
      return (
        <div>
          <Autocomplete
            id="panels"
            options={this.state.panelsOptions}
            getOptionLabel={(option) => option}
            style={{ width: "100%" }}
            onChange={(event, value) => {
              // splitting needed because no decoupling of option and label ...
              this.changePanelsChosen(value.split(" (")[0]);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose Panel Option"
                variant="outlined"
              />
            )}
          />
        </div>
      );
    }
  };

  /**
   * function to get panel options based on type of panel selected
   * @param {string} panel_type - type of panel to be chosen - either genomics england or panelapp australia
   */
  get_panel_options = async (panel_type) => {
    const response = await fetch(panel_type);
    let terms = [];
    let resp = await response.json();
    resp.results.forEach((r) => {
      terms.push(r);
    });

    while (resp.next != null) {
      console.log(resp.next);
      let new_resp = await fetch(resp.next);
      resp = await new_resp.json();
      resp.results.forEach((r) => {
        terms.push(r);
      });
    }

    return terms;
  };

  /**
   * Function to change current panel
   * @param {*} event
   */
  changeCurrPanel = async (event) => {
    this.setState({ currPanel: event.target.value });

    if (
      event.target.value === Panels.GENOMICS_ENGLAND ||
      event.target.value === Panels.PANELAPP
    ) {
      this.setState({ panelsLoading: LoadingState.LOADING });
      let options = await this.get_panel_options(event.target.value);
      let processedOptions = processPanelData(options);
      this.setState({
        panelsOptions: processedOptions,
        panelsLoading: LoadingState.SUCCESS,
      });
    }
  };

  render() {
    let cutoff_display;
    this.props.cutoff
      ? (cutoff_display = (
          <TextField
            required
            id="standard-required"
            label="Enter cutoff value"
            placeholder="Cutoff value"
            margin="normal"
            onChange={this.changeCutoffValue}
          />
        ))
      : (cutoff_display = <div></div>);

    let panel_display;
    this.props.panel_display
      ? (panel_display = (
          <>
            <div>
              <RadioGroup
                value={this.currPanel}
                style={{ margin: 15 }}
                onChange={this.changeCurrPanel}
                row
              >
                <FormControlLabel
                  value={Panels.GENOMICS_ENGLAND}
                  control={<Radio />}
                  label="Genomics England"
                />
                <FormControlLabel
                  value={Panels.PANELAPP}
                  control={<Radio />}
                  label="PanelApp Australia"
                />
              </RadioGroup>
            </div>
            <div style={{ paddingBottom: 10 }}>{this.renderPanel()}</div>
          </>
        ))
      : (panel_display = <div></div>);

    let search_all_patients = <div></div>;
    this.props.patients
      ? (search_all_patients = (
          <RadioGroup
            value={this.state.searchAllPatients}
            style={{ margin: 15 }}
            onChange={this.changeSearchAllPatients}
            row
          >
            <FormControlLabel
              value={"true"}
              control={<Radio />}
              label="Search all patients"
            />
            <FormControlLabel
              value={"false"}
              control={<Radio />}
              label="Search individual patients"
            />
          </RadioGroup>
        ))
      : (search_all_patients = <div></div>);
    let patients_autocomplete = <div></div>;
    if (this.props.patients) {
      this.state.searchAllPatients === "true"
        ? (patients_autocomplete = <div></div>)
        : (patients_autocomplete = (
            <div>
              <Autocomplete
                multiple
                id="panels"
                options={this.props.patients}
                getOptionLabel={(option) => option.patientId}
                style={{ width: 300 }}
                onChange={(event, value) => {
                  this.changePatients(value);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Choose patients"
                    variant="outlined"
                  />
                )}
              />
            </div>
          ));
    }

    let geneDisplay = <div></div>;
    if (this.state.panelData.names) {
      geneDisplay = (
        <TextField
          fullWidth
          disabled
          multiline
          value={this.state.panelData.names}
        />
      );
    }

    return (
      <>
        <div>
          <TabContext value={this.state.tab}>
            <TabList onChange={this.changeTab}>
              <Tab label="Custom Gene Search" value="1" />
              <Tab label="Panel Search" value="2" />
            </TabList>

            <form onSubmit={this.handleSubmit}>
              <TabPanel value="1">
                <div className="field has-addons">
                  Enter genes to be searched <br />
                  <br />
                  <AutocompleteSearch
                    api_type="gene_search"
                    updateVal={this.changeVariant}
                    multiple={this.props.multiple}
                  />
                </div>
                <div
                  className="field has-addons"
                  style={{
                    justifyContent: "space-between",
                    display: "flex",
                    paddingRight: 500,
                  }}
                >
                  <TextField
                    required
                    id="standard-required"
                    label="Reference Allele"
                    placeholder="Reference Allele"
                    margin="normal"
                    onChange={this.changeRefAllele}
                  />

                  <TextField
                    required
                    id="standard-required"
                    label="Alternate Allele"
                    placeholder="Alternate Allele"
                    margin="normal"
                    onChange={this.changeAltAllele}
                  />
                </div>
                <div>{search_all_patients}</div>
                <div>{patients_autocomplete}</div>
              </TabPanel>
              <TabPanel value="2">
                <div>{panel_display}</div>
                <div>{geneDisplay}</div>
                <Divider />
                <div>{cutoff_display}</div>
                <div>{search_all_patients}</div>
                <div>{patients_autocomplete}</div>
              </TabPanel>
              <br />
              <div className="control">
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  onClick={this.handleSubmit}
                >
                  Submit
                </Button>
              </div>
            </form>
          </TabContext>
        </div>
      </>
    );
  }
}
