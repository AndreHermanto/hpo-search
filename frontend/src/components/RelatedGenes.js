import { List, ListItem, ListItemText, Typography } from "@material-ui/core";

import React from "react";

export default function RelatedGenes(props) {
  return (
    <div className="field has-addons">
      <Typography>Genes associated with {props.hpoTerm}</Typography>
      <List style={{ maxHeight: "25vh", overflow: "auto" }}>
        {props.associatedGenes.map((gene, idx) => (
          <ListItem key={idx}>
            <ListItemText primary={gene.entrezGeneSymbol} />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
