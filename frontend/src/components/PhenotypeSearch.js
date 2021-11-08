import {
  Button,
  Slider,
  TextField,
  Typography,
  makeStyles,
} from "@material-ui/core";
import React, { useState } from "react";

import AutocompleteSearch from "../components/AutocompleteSearch";

const useStyles = makeStyles((theme) => ({
  inputContainer: {
    marginLeft: 25,
    marginRight: 25,
    marginTop: 25,
    marginBottom: 25,
    textAlign: "center",
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

export default function PhenotypeSearch(props) {
  const classes = useStyles();

  const [state, setState] = useState({
    hpoTerm: "",
    fuzz: 0,
    limitation: "",
    cutoff: 0,
    associatedGenes: {},
    resultsState: LoadingState.WAITING,
  });

  const changeHpoTerm = async (hpoTerm) => {
    if (hpoTerm !== null) {
      const geneList = await fetch(
        "https://hpo.jax.org/api/hpo/term/" +
          hpoTerm.split("-")[0].trim() +
          "/genes"
      )
        .then((res) => res.json())
        .catch((err) => alert("error when retrieving associated genes"));
      setState({ ...state, hpoTerm: hpoTerm, associatedGenes: geneList });
    }
  };

  const changeFuzz = (fuzz) => {
    setState({ ...state, fuzz: fuzz });
  };

  const changeLimitation = (limitation) => {
    setState({ ...state, limitation: limitation });
  };

  const changeCutoff = (cutoff) => {
    if (cutoff < 0 && cutoff !== "") {
      cutoff = 0;
    }
    setState({ ...state, cutoff: cutoff });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    var stringify = require("qs-stringify");

    if (!state.hpoTerm) {
      alert("Please enter a search term");
      return;
    }

    let query = stringify({
      hpoTerm: state.hpoTerm.split("-")[1],
      fuzz: state.fuzz,
      limitation: state.limitation ? state.limitation.split("-")[1] : "",
      cutoff: state.cutoff,
    });

    props.loading();

    try {
      fetch(`${process.env.REACT_APP_BACKEND}/hpo_search?` + query, {
        headers: {
          Authorization: `Bearer ${props.accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          data["associatedGenes"] = state.associatedGenes.genes;
          data["hpoTerm"] = state.hpoTerm;
          props.callback(data);
        });
    } catch {
      alert("error in query");
      setState({ ...state, resultsState: LoadingState.FAILURE });
    }
  };

  return (
    <div className={classes.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          <Typography>Search Term</Typography>
          <AutocompleteSearch
            api_type="hpo"
            hpo
            updateVal={(values) => changeHpoTerm(values)}
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Fuzzy Match</Typography>
          <Slider
            value={state.fuzz}
            onChange={(event, value) => changeFuzz(value)}
            valueLabelDisplay="auto"
            marks={[
              {
                value: 0,
                label: "Exact",
              },
              {
                value: 5,
                label: "5 Hops",
              },
            ]}
            step={1}
            min={0}
            max={5}
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Limit to patients with</Typography>
          <AutocompleteSearch
            api_type="hpo"
            updateVal={(values) => changeLimitation(values)}
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Cut-off</Typography>
          <TextField
            type="number"
            value={state.cutoff}
            onChange={(event) => changeCutoff(event.target.value)}
            fullWidth
          />
        </div>
        <div className={classes.inputContainer}>
          <Button variant="contained" type="submit" color="primary">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
