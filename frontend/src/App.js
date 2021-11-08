import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import { Auth0Provider } from "@auth0/auth0-react";
import { CssBaseline } from "@material-ui/core";
import { Footer } from "./components/Footer";
import HPOSearch from "./pages/HPOSearch";
import Header from "./components/Header";
import PatientDisplay from "./pages/PatientDisplay";
import React from "react";
import VariantSearch from "./pages/VariantSearch";
import { createBrowserHistory } from "history";

export const history = createBrowserHistory();

const onRedirectCallback = (appState) => {
  // Use the router's history module to replace the url
  history.replace(appState?.returnTo || window.location.pathname);
};

class App extends React.Component {
  render() {
    return (
      <div className="container">
        <CssBaseline />

        <Router>
          <Auth0Provider
            domain={process.env.REACT_APP_AUTH0_DOMAIN}
            clientId={process.env.REACT_APP_AUTH0_CLIENTID}
            redirectUri={window.location.origin}
            audience={process.env.REACT_APP_AUTH0_AUDIENCE}
            cacheLocation="localstorage"
            onRedirectCallback={onRedirectCallback}
          >
            <Header />
            <Switch>
              <Route path="/hpoSearch" exact component={HPOSearch} />
              <Route path="/variantSearch" exact component={VariantSearch} />
              <Route path="/patientInfo" exact component={PatientDisplay} />
            </Switch>
            <Footer />
          </Auth0Provider>
        </Router>
      </div>
    );
  }
}

export default App;
