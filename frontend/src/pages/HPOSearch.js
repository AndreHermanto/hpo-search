import {
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Toolbar,
  Typography,
  makeStyles,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { processBarDataSeparate, processResults } from "../helpers.js";

import CohortsTable from "../components/CohortsTable.js";
import Drawer from "../components/Drawer";
import { PatientGraphs } from "../components/PatientGraphs";
import PhenotypeBarChart from "../components/PhenotypeBarChart.js";
import PhenotypeSearch from "../components/PhenotypeSearch.js";
import RelatedGenes from "../components/RelatedGenes.js";
import { ResultsTable } from "../components/ResultsTable";
import UnAuth from "../components/UnAuth.js";
import { VariantSearchBar } from "../components/VariantSearchBar.js";
import { useAuth0 } from "@auth0/auth0-react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  formContainer: {
    marginTop: "3em",
  },
}));

const LoadingState = {
  WAITING: "WAITING",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
};

export default function HPOSearch() {
  const classes = useStyles();
  const {
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const [state, setState] = useState({
    hpoTerm: "",
    resultsState: LoadingState.WAITING,
    tableRow: [],
    results: [],
    resultsPerDataset: [],
    barData: [],
    barDataKeys: [],
    associatedGenes: [],
    patientsFound: [],
    currPatients: "",
    patientInfo: [],
    commonVariants: [],
    variantsRow: [],
    variantsSearchState: LoadingState.WAITING,
    activeStep: 0,
    accessToken: "",
    idToken: "",
  });

  useEffect(() => {
    const getUserMetadata = async () => {
      if (isAuthenticated) {
        try {
          const idToken = await getIdTokenClaims({});

          setState({
            ...state,
            idToken: idToken.__raw,
          });
        } catch (e) {
          console.log(e.message);
        }
      }
    };

    getUserMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessTokenSilently, isAuthenticated]);

  const handlePhenotypeLoading = () => {
    setState({ ...state, resultsState: LoadingState.LOADING });
  };

  const handlePhenotypeSearch = (data) => {
    let barData = processBarDataSeparate(data["overall_results"]);
    barData.sort((a, b) => a.value - b.value);
    setState({
      ...state,
      hpoTerm: data["hpoTerm"],
      results: data["overall_results"],
      resultsPerDataset: data["results_per_dataset"],
      resultsState: LoadingState.SUCCESS,
      patientsFound: data["patients"],
      currPatients: data["patients"],
      patientInfo: data["patient_info"],
      tableRow: processResults(data["overall_results"]),
      barData: barData,
      variantsSearchState: LoadingState.WAITING,
      associatedGenes: data["associatedGenes"],
      activeStep: 1,
    });
  };

  const setActiveStep = (step) => {
    setState({ ...state, activeStep: step });
  };

  const setVariantResults = (value) => {
    if (value === LoadingState.LOADING) {
      setState({ ...state, variantsSearchState: LoadingState.LOADING });
    } else if (value === LoadingState.FAILURE) {
      setState({ ...state, variantsSearchState: LoadingState.FAILURE });
    } else {
      let variantsRow = [];
      value.v.forEach((variant, idx) => {
        variantsRow.push({
          id: idx,
          col1: variant.c,
          col2: variant.s,
          col3: variant.t,
          col4: variant.a,
          col5: variant.r,
          col6: variant.ac,
          col7: variant.af,
        });
      });
      setState({
        ...state,
        variantsSearchState: LoadingState.SUCCESS,
        commonVariants: value.v,
        variantsRow: variantsRow,
        activeStep: 3,
      });
    }
  };

  let variantsCol = [
    {
      field: "col1",
      title: "Chromosome",
    },
    {
      field: "col2",
      title: "Start Position",
    },
    {
      field: "col3",
      title: "Type",
    },
    {
      field: "col4",
      title: "Alternate Allele",
      cellStyle: {
        width: 20,
        maxWidth: 20,
        overflow: "auto",
      },
      headerStyle: {
        width: 20,
        maxWidth: 20,
        overflow: "auto",
      },
    },
    {
      field: "col5",
      title: "Reference Allele",
      cellStyle: {
        width: 20,
        maxWidth: 20,
      },
      headerStyle: {
        width: 20,
        maxWidth: 20,
      },
    },
    {
      field: "col6",
      title: "Allele Count",
    },
    {
      field: "col7",
      title: "Allele Frequency",
    },
  ];

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!isAuthenticated) {
    return <UnAuth />;
  }

  return (
    <div className={classes.root}>
      <Drawer>
        <PhenotypeSearch
          callback={handlePhenotypeSearch}
          accessToken={state.idToken}
          loading={handlePhenotypeLoading}
        />
      </Drawer>
      <main className={classes.content}>
        <Toolbar />
        {(() => {
          switch (state.resultsState) {
            case LoadingState.WAITING:
              return (
                <Typography align="center">
                  Please enter a search term on the left to begin
                </Typography>
              );
            case LoadingState.LOADING:
              return <LinearProgress />;
            case LoadingState.SUCCESS:
              return (
                <div>
                  <Grid container>
                    <Grid item xs={6}>
                      <CohortsTable
                        cohorts={state.resultsPerDataset}
                        all={state.results}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <PhenotypeBarChart
                        title={"Matches per Phenotype"}
                        data={state.barData}
                        keys={["value"]}
                      />
                    </Grid>
                  </Grid>

                  <div style={{ paddingTop: 50 }}>
                    <PatientGraphs patient_data={state.patientInfo} />
                  </div>

                  <div style={{ paddingTop: 50 }}>
                    <Card>
                      <CardContent>
                        <Typography>Common Variant Search</Typography>
                        <Grid
                          container
                          spacing={5}
                          direction="row"
                          justify="space-evenly"
                          alignItems="flex-start"
                        >
                          <Grid item xs={9}>
                            <VariantSearchBar
                              cutoff={false}
                              patients={state.currPatients}
                              panel_display={true}
                              type={"commonVariant"}
                              setResults={(values) => setVariantResults(values)}
                              multiple={false}
                              setActiveStep={setActiveStep}
                              token={state.idToken}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <RelatedGenes
                              associatedGenes={state.associatedGenes}
                              hpoTerm={state.hpoTerm}
                            />
                          </Grid>
                        </Grid>
                        {(() => {
                          switch (state.variantsSearchState) {
                            case LoadingState.WAITING:
                              return <div></div>;
                            case LoadingState.LOADING:
                              return <LinearProgress />;
                            case LoadingState.SUCCESS:
                              return (
                                <div
                                  style={{
                                    paddingTop: 25,
                                  }}
                                >
                                  <ResultsTable
                                    column={variantsCol}
                                    row={state.variantsRow}
                                    title={"Common variants found"}
                                  />
                                </div>
                              );
                            default:
                              return <div></div>;
                          }
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            default:
              return <div></div>;
          }
        })()}
      </main>
    </div>
  );
}
