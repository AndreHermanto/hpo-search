import Autocomplete from "@material-ui/lab/Autocomplete";
import React from "react";
import TextField from "@material-ui/core/TextField";

const API_URLS = {
  HP_ONTOLOGY:
    "https://api.monarchinitiative.org/api/search/entity/autocomplete/",
  VECTIS_GENE_SEARCH:
    "https://dr-sgc.kccg.garvan.org.au/_elasticsearch/_search",
};

/**
 * Component for autocomplete text bar with options from an API
 * @param {} updateVal - function to update value inputted into autocomplete
 * @param {string} api_type - type of api to be called
 * @param multiple - whether multiple options should be allowed to be selected
 */

export default function AutocompleteSearch({
  updateVal,
  api_type,
  multiple,
  hpo,
}) {
  const [inputValue, setInputValue] = React.useState("");
  const [inputArray, setInputArray] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [pasted, setPasted] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    if (pasted) {
      setPasted(false);
      return;
    }
    switch (api_type) {
      case "hpo": {
        (async () => {
          const response = await fetch(
            API_URLS.HP_ONTOLOGY +
              inputValue +
              "?prefix=HP&rows=20&start=0&minimal_tokenizer=false"
          );

          const terms = await response.json();

          const completeTerms = [];
          terms.docs.forEach((r) => {
            let str = "";
            r.label.forEach((l) => {
              completeTerms.push(str.concat(r.id).concat(" - ").concat(l));
            });
          });

          setOptions(
            Object.keys(completeTerms).map((key) => completeTerms[key])
          );
          setLoading(false);
        })();
        break;
      }
      case "gene_search": {
        (async () => {
          const body = {
            from: 0,
            size: 10,
            query: {
              dis_max: {
                queries: [
                  {
                    match: {
                      symbol: {
                        query: inputValue,
                        fuzziness: 0,
                        boost: 4,
                      },
                    },
                  },
                ],
                tie_breaker: 0.4,
              },
            },
            sort: [{ _score: { order: "desc" } }],
          };

          const response = await fetch(
            "https://dr-sgc.kccg.garvan.org.au/_elasticsearch/_search",
            {
              method: "POST",
              body: JSON.stringify(body),
            }
          );

          const terms = await response.json();
          const completeTerms = [];
          terms.hits.hits.forEach((gene) => {
            let str = "";
            completeTerms.push(
              str
                .concat(gene._source.symbol)
                .concat(" ")
                .concat(gene._source.chromosome)
                .concat(":")
                .concat(gene._source.start)
                .concat("-")
                .concat(gene._source.end)
            );
          });

          const isRegion = new RegExp(
            /^([\dxy]+|mt+)[:\-.,\\/](\d+)[:\-.,\\/](\d+)$/,
            "i"
          ).exec(inputValue);
          const isCoord = new RegExp(
            /^([\dxy]+|mt+)[:\-.,\\/](\d+)$/,
            "i"
          ).exec(inputValue);
          var options = Object.keys(completeTerms).map(
            (key) => completeTerms[key]
          );
          if (isRegion) {
            options = ["Region: " + inputValue].concat(options);
          }
          if (isCoord) {
            options = ["Coords: " + inputValue].concat(options);
          }
          setOptions(options);
          setLoading(false);
        })();
        break;
      }
      default: {
        console.log("incorrect API provided " + api_type);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const onPaste = (event) => {
    const positions = event.clipboardData.getData("text/plain").split("\n");
    setPasted(true);
    setInputArray(positions);
    updateVal(positions);
  };

  if (multiple) {
    return (
      <Autocomplete
        id="autocomplete"
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        onChange={(event, value) => {
          if (!pasted) {
            setInputArray(value);
          }
          updateVal(value);
        }}
        disableCloseOnSelect
        onPaste={(event) => onPaste(event)}
        multiple
        value={inputArray}
        onInputChange={(event, value) => setInputValue(value)}
        options={options}
        loading={loading}
        renderOption={(options) => <React.Fragment>{options}</React.Fragment>}
        renderInput={(params) => <TextField {...params} />}
      />
    );
  } else if (hpo) {
    return (
      <Autocomplete
        id="autocomplete"
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        onChange={(event, value) => {
          updateVal(value);
        }}
        disableCloseOnSelect
        getOptionLabel={(option) => option.split("-")[1]}
        getOptionSelected={(option, inputValue) => option === inputValue}
        options={options}
        loading={loading}
        renderOption={(options) => <React.Fragment>{options}</React.Fragment>}
        renderInput={(params) => (
          <TextField
            {...params}
            onChange={(event) => setInputValue(event.target.value)}
          />
        )}
      />
    );
  } else {
    return (
      <Autocomplete
        id="autocomplete"
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        onChange={(event, value) => {
          updateVal(value);
        }}
        disableCloseOnSelect
        getOptionLabel={(option) => option}
        getOptionSelected={(option, inputValue) => option === inputValue}
        options={options}
        loading={loading}
        renderOption={(options) => <React.Fragment>{options}</React.Fragment>}
        renderInput={(params) => (
          <TextField
            {...params}
            onChange={(event) => setInputValue(event.target.value)}
          />
        )}
      />
    );
  }
}
