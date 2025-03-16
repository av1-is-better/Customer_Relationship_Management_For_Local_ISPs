import {Modal} from "react-bootstrap";
import axios from 'axios';
import { useState } from "react";
import Spinner from "../components/Spinner";

export default function AdminSetup({apiDomain,authToken,setAccountExist}){
    const [showSpinner, setShowSpinner] = useState(false);
    const handleForm = (event) => {
        event.preventDefault();
        setShowSpinner(true);
        const data = {
            name: event.target[0].value.toUpperCase(),
            phone: event.target[1].value
        };
        const headers = {
            'Content-Type': 'application/json',
            'Authorization':`Bearer ${authToken}`
        };
        axios.post(`${apiDomain}/admin/setup-account`,data,{headers})
          .then(response => {
            if (response.data.result === true){
              // User Account Created
              setAccountExist(true)
            }
            else {
              // User Creation Failed
              alert("Server Unreachable :( Check Your Internet Connection or Try Again Later.")
            }
          })
          .catch(error => {
            alert("Server Unreachable :( Check Your Internet Connection or Try Again Later.")
          });
    }
    if(!showSpinner){
        return <Modal show={true} backdrop="static" keyboard={false} centered style={{backgroundColor:"rgba(0,0,0,0.4)"}}>
        <Modal.Header className="d-flex align-items-center justify-content-center bg-teal">
          <Modal.Title>Admin Account Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
        <form className="px-5 mt-4" onSubmit={handleForm}>
  <div className="form-group">
    <label className="text-dark">Name</label> <small className="text-dark"> (Only Alphabets)</small>
    <input type="text" className="form-control bg-light text-dark" placeholder="Enter Your Full Name" pattern="[A-Za-z\s]+" required />
  </div>
  <div className="form-group mt-3">
    <label className="text-dark">Phone</label><small className="text-dark"> (Without Country Code)</small>
    <input type="tel" className="form-control bg-light text-dark" placeholder="Enter 10 Digit Number" pattern="[0-9]{10}" maxLength="10" required />
  </div>
  <center>
  <button type="submit" className="btn btn-teal mt-4 mb-4">Submit</button>
  </center>
</form>
        </Modal.Body>
      </Modal>
    }
    else {
        return <Spinner />
    }
}