import {
  Drawer as MaterialDrawer,
  Toolbar,
  makeStyles,
} from "@material-ui/core";

import React from "react";

const drawerWidth = "20rem";

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 1,
  },
  drawerContainer: {
    overflow: "auto",
  },
  drawerPaper: {
    width: drawerWidth,
    zIndex: 1,
  },
}));

export default function Drawer(props) {
  const classes = useStyles();

  return (
    <MaterialDrawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      PaperProps={{ elevation: 6 }}
    >
      <Toolbar />
      <div className={classes.drawerContainer}>{props.children}</div>
    </MaterialDrawer>
  );
}
