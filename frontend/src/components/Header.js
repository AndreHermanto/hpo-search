import { AppBar, Button, Toolbar } from "@material-ui/core";

import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";

/**
 * Header component
 * @param {*} props
 */

const Header = (props) => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const location = useLocation();
  const unAuthHeaders = (
    <Button
      onClick={() => loginWithRedirect()}
      color="inherit"
      disableElevation
    >
      Log In
    </Button>
  );

  const authHeaders = (
    <Button
      onClick={() => logout({ returnTo: window.location.origin })}
      color="inherit"
      disableElevation
    >
      Log Out
    </Button>
  );

  return (
    <>
      <AppBar>
        <Toolbar>
          {location.pathname === "/hpoSearch" ? (
            <Button href="/hpoSearch" variant="outlined" color="inherit">
              HPO Search
            </Button>
          ) : (
            <Button href="/hpoSearch" color="inherit">
              HPO Search
            </Button>
          )}
          {location.pathname === "/variantSearch" ? (
            <Button href="/variantSearch" variant="outlined" color="inherit">
              Variant Search{" "}
            </Button>
          ) : (
            <Button href="/variantSearch" color="inherit">
              Variant Search{" "}
            </Button>
          )}

          {(() => {
            if (isAuthenticated) return authHeaders;
            return unAuthHeaders;
          })()}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
