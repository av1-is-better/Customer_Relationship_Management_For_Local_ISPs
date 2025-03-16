import { useAuth0 } from '@auth0/auth0-react';
import {Button} from 'react-bootstrap'
import BottomNavbar from './client_components/BottomNavbar';
import SiteLogo from './client_components/SiteLogo';
import Home from './client_components/Home';
import Transactions from './client_components/Transactions';
import Notice from './client_components/Notice';
import Complaints from './client_components/Complaints';
import { useState } from 'react';
import {Modal} from 'react-bootstrap';


export default function Client({apiDomain,authToken,RAZORPAY_KEY_ID}){
    const [active, setActive] = useState("Home");
    const {logout} = useAuth0();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const navbarLinks = [
        { title:"Home", logoClass:"bi bi-house-fill" },
        { title:"Invoices", logoClass:"bi bi-receipt" },
        { title:"Notice", logoClass:"bi bi-bell-fill" },
        { title:"Complaint", logoClass:"bi bi-envelope-slash" },
        { title:"Logout", logoClass:"bi bi-box-arrow-right" },
    ]

    return <>
    <SiteLogo />
    { active === "Home" && <Home {...{apiDomain, authToken, RAZORPAY_KEY_ID}} /> }
    { active === "Invoices" && <Transactions {...{apiDomain, authToken}} /> }
    { active === "Notice" && <Notice {...{apiDomain, authToken}} /> }
    { active === "Complaint" && <Complaints {...{apiDomain, authToken}} /> }
    <BottomNavbar {...{navbarLinks,active,setActive,setShowLogoutModal}} />
    
    
    
    
    <Modal show={showLogoutModal} onHide={()=>setShowLogoutModal(false)}
        backdrop='static'
        keyboard={false}
        centered
        dialogClassName="modal-content-custom profile-modal"
        >
        <Modal.Header closeButton
        style={{backgroundColor:"#d9534f"}}
        >
            <Modal.Title>Are You Sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body
        style={{backgroundColor:"white",color:"black"}}
        >
            <p>You're about to logout, Please Confirm</p>
            <div className='d-flex' style={{justifyContent:"flex-end"}}>
            <button className='btn btn-danger mx-1' onClick={()=>{
                    logout({ 
                      logoutParams: { returnTo: window.location.origin }
                    });
                  }}><i className="bi bi-box-arrow-left"></i> Logout</button>
            <button className='btn btn-secondary mx-1' onClick={()=>setShowLogoutModal(false)}><i className="bi bi-x-square-fill"></i> Cancel</button>
            </div>
        </Modal.Body>
    </Modal>
    </>
}