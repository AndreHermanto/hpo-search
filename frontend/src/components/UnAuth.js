// React functional component that displays a message to the user to log in if they are not authenticated

import { Toolbar, Typography, makeStyles } from "@material-ui/core";

import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

export default function UnAuth(isAuthenticated) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <main className={classes.content}>
        <Toolbar></Toolbar>
        <div>
          <Typography align="center">
            Please log in to view this page.
          </Typography>
        </div>
      </main>
    </div>
  );
}
