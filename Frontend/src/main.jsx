import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Admin from './Admin.jsx'
import Client from './Client.jsx'
import { useEffect,useState } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useAuth0 } from '@auth0/auth0-react';
import Spinner from './components/Spinner.jsx';
import ServerError from './components/ServerError.jsx';
import AdminSetup from './admin_components/AdminSetup.jsx';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import './custom.css';

const AUTH0_DOMAIN = "example.eu.auth0.com";
const AUTH0_CLIENT_ID = "auth0_client_id";
const AUTH0_AUDIENCE = "https://example.com";

const RAZORPAY_KEY_ID = "razorpay_key_id"; // Replace with your Razorpay key ID

function Application() {
  const apiDomain = "http://127.0.0.1:51245"; // Replace with your Backend Domain (Do Not Include '/' at the end)

  const {isLoading, error, loginWithRedirect, isAuthenticated, getAccessTokenSilently, logout, user} = useAuth0();

  const [authToken, setAuthToken] = useState("");
  const [accountExist, setAccountExist] = useState();
  const [isAdmin, setIsAdmin] = useState();
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    // Checking User Present in Database
    async function checkAccount() {
      const token = await getAccessTokenSilently();
      console.log(token);
      setAuthToken(token);
      axios.get(`${apiDomain}/check`,
        { headers: {
          "Authorization":`Bearer ${token}`  
          }
        })
        .then(response => {
          // Account Exist and User in Admin
          if (response.data.result === true && response.data.account_type === "admin"){
            // User Present
            setAccountExist(true);
            setIsAdmin(true);
          }
          // Account Exist and User is Client
          else if (response.data.result === true && response.data.account_type === "client"){
            // User Present
            setAccountExist(true);
            setIsAdmin(false);
          }
          // Account Doesn't Exist and User in Admin
          else if (response.data.result === false && response.data.account_type === "admin"){
            // User Present
            setAccountExist(false);
            setIsAdmin(true);
          }
          // Account Doesn't Exist and User is Client
          else if (response.data.result === false && response.data.account_type === "client"){
            // User Present
            setAccountExist(false);
            setIsAdmin(false);
          }
        })
        .catch(error => {
          setServerError(true);
          console.log(error);
        });
    }
    checkAccount();
  },[]);
  
  if (isLoading) {
    return <Spinner />
  } 
  else if (!isAuthenticated){
    loginWithRedirect()
    return <Spinner />
  }
  else if (error){
    return <ServerError />
  }
  else if (serverError) {
    return <ServerError />
  }
  else if (isAuthenticated && accountExist === true && isAdmin === true){
    return <Admin {...{apiDomain, authToken}} />
  }
  else if (isAuthenticated && accountExist === false && isAdmin === true){
    return <AdminSetup {...{apiDomain,authToken,setAccountExist}} />
   }
  else if (isAuthenticated && accountExist === true && isAdmin === false){
    return <Client {...{apiDomain, authToken, RAZORPAY_KEY_ID}} />
  }
  else {
    return <Spinner />
   }
}

createRoot(document.getElementById('root')).render(
<Auth0Provider
  domain={AUTH0_DOMAIN}
  clientId={AUTH0_CLIENT_ID}
  authorizationParams={{
    audience: AUTH0_AUDIENCE,
    redirect_uri: window.location.origin}}
>
    <Application />
</Auth0Provider>)