import {
  Grid,
  LinearProgress,
  Toolbar,
  Typography,
  makeStyles,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";

import CohortsTable from "../components/CohortsTable";
import Drawer from "../components/Drawer";
import PhenotypeBarChart from "../components/PhenotypeBarChart";
import RegionSearch from "../components/RegionSearch";
import { ResultsTable } from "../components/ResultsTable";
import UnAuth from "../components/UnAuth";
import { useAuth0 } from "@auth0/auth0-react";

const drawerWidth = 220;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 1,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: "auto",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    height: "100vh",
  },
  formContainer: {
    marginTop: "3em",
  },
}));

const ResultsState = {
  WAITING: "WAITING",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
};

export default function VariantSearch() {
  const classes = useStyles();

  const [state, setState] = useState({
    resultState: ResultsState.WAITING,
    results: [],
    patientInfo: [],
    variants: [],
    perCohort: [],
    totalPatients: 0,
    idToken: "",
  });
  const {
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  useEffect(() => {
    const getUserMetadata = async () => {
      if (isAuthenticated) {
        try {
          const idToken = await getIdTokenClaims({});

          setState({
            ...state,

            idToken: idToken.__raw,
          });
          console.log(state.idToken);
        } catch (e) {
          console.log(e.message);
        }
      }
    };

    getUserMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessTokenSilently, isAuthenticated]);

  const setResults = (value) => {
    if (value === ResultsState.LOADING) {
      setState({ ...state, resultState: ResultsState.LOADING });
    } else if (value === ResultsState.FAILURE) {
      setState({ ...state, resultState: ResultsState.FAILURE });
    } else {
      var results = [];
      Object.keys(value["phenotype_count"]).forEach((phenotype) => {
        results.push({
          id: phenotype,
          count: value["phenotype_count"][phenotype],
        });
      });
      results.sort((a, b) => a.count - b.count);
      results = results.filter((result) => result.count > 1);
      setState({
        ...state,
        results: results,
        resultState: ResultsState.SUCCESS,
        totalPatients: value["total_patients"],
        patientInfo: value["patient_info"],
        variants: value["variants"],
        perCohort: value["per_cohort"],
      });
    }
  };
  let variantsCol = [
    {
      field: "c",
      title: "Chromosome",
    },
    {
      field: "s",
      title: "Start Position",
    },
    {
      field: "t",
      title: "Type",
    },
    {
      field: "a",
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
      field: "r",
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
  ];

  if (!isAuthenticated) {
    return <UnAuth />;
  }

  return (
    !isLoading && (
      <div className={classes.root}>
        <Drawer>
          <RegionSearch
            token={state.idToken}
            setResults={(value) => setResults(value)}
          />
        </Drawer>
        <main className={classes.content}>
          <Toolbar />
          {(() => {
            switch (state.resultState) {
              case ResultsState.WAITING:
                return (
                  <Typography align="center">
                    Please enter a search term on the left to begin
                  </Typography>
                );
              case ResultsState.LOADING:
                return <LinearProgress />;
              case ResultsState.SUCCESS:
                return (
                  <div>
                    <Grid container>
                      <Grid item xs={6}>
                        <CohortsTable
                          cohorts={state.perCohort}
                          type="variant"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <PhenotypeBarChart
                          title={"Phenotypes Found"}
                          data={state.results}
                          keys={["count"]}
                        />
                      </Grid>
                    </Grid>

                    <div style={{ paddingTop: 50 }}>
                      <ResultsTable
                        column={variantsCol}
                        row={state.variants}
                        title={"Variants Found"}
                      />
                    </div>
                  </div>
                );
              default:
                return <div />;
            }
          })()}
        </main>
      </div>
    )
  );
}
