import { Card, CardContent, Typography } from "@material-ui/core";

import { BarChart } from "./BarChart";
import React from "react";

export default function PhenotypeBarChart(props) {
  return (
    <Card>
      <CardContent style={{ height: "50vh", width: "100%" }}>
        <Typography
          variant="h5"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {props.title}
        </Typography>
        <BarChart data={props.data} keys={props.keys} />
      </CardContent>
    </Card>
  );
}
