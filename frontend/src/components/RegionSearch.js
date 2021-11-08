import { Button, TextField, Typography, makeStyles } from "@material-ui/core";
import React, { useState } from "react";

import AutocompleteSearch from "./AutocompleteSearch";

var stringify = require("qs-stringify");

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

export default function RegionSearch(props) {
  const classes = useStyles();

  const [state, setState] = useState({
    region: [],
    ref: "",
    alt: "",
    cutoff: 0,
    resultsState: LoadingState.WAITING,
  });

  const changeRegion = (region) => {
    console.log(region);
    setState({ ...state, region: region });
  };

  const changeRef = (ref) => {
    setState({ ...state, ref: ref });
  };

  const changeAlt = (alt) => {
    setState({ ...state, alt: alt });
  };

  const changeCutoff = (cutoff) => {
    if (cutoff < 0 && cutoff !== "") {
      cutoff = 0;
    }
    setState({ ...state, cutoff: cutoff });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let query = stringify({
      region: state.region.join(","),
      ref: state.ref,
      alt: state.alt,
      cutoff: state.cutoff,
    });

    try {
      props.setResults(LoadingState.LOADING);
      const idk = await fetch(
        `${process.env.REACT_APP_BACKEND}/variant_search?` + query,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + props.token,
          },
        }
      ).then((res) => res.json());

      if (idk) {
        props.setResults(idk);
      }
    } catch (err) {
      alert(err);
      console.log(err);
    }
  };

  return (
    <div className={classes.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          <Typography>Position or Region</Typography>
          <AutocompleteSearch
            api_type="gene_search"
            updateVal={(value) => changeRegion(value)}
            multiple={true}
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Reference Allele</Typography>
          <TextField
            value={state.ref}
            onChange={(event) => changeRef(event.target.value)}
            fullWidth
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Alternative Allele</Typography>
          <TextField
            value={state.alt}
            onChange={(event) => changeAlt(event.target.value)}
            fullWidth
          />
        </div>
        <div className={classes.inputContainer}>
          <Typography>Cutoff</Typography>
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
