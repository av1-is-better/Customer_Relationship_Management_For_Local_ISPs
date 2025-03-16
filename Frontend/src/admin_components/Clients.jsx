import { useEffect, useState, useRef, useCallback, React} from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal, Button } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './imageUtils'; 

export default function Clients({authToken,apiDomain}){
    function formatINR(number) {
        // Convert number to string and split into integer and decimal parts
        const [integerPart, decimalPart] = number.toString().split('.');
    
        // Define the Indian numbering system formatting
        const regex = /(\d)(?=(\d\d)+\d(\.|$))/g;
        const formattedIntegerPart = integerPart.replace(regex, '$1,');
    
        // Combine integer and decimal parts if decimal part exists
        return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
    }
    
    // for storing client list fetched through API or multiple states example:
    // 1. loading: for spinner while waiting for api response
    // 2. error: api response failed because of server error (no response from api)
    // 3. null: client list is empty
    // 4. default (!null): client list data
    const [clientData, setClientData] = useState("loading");



    {/*
        State for handling all the modals in this jsx file
        There are multiple states for each modal    
        1. create-client-modal : state to display create client modal.
        2. create-modal-success : state to display client created successfully modal.
        3. create-modal-failed : state to display failed during client creation process.
        4. create-modal-email-conflict : state to display duplicate email detected during client creation.
    */}
    const [showWhichModal, setShowWhichModal] = useState(null);

    // loading state for api modal
    const [loadingModal, setLoadingModal] = useState(false);
    
    
    // state for handling search results
    const [searchValue, setSearchValue] = useState(null);

    // state for show/hide  client password in client creation modal
    const [showPass, setShowPass] = useState(false);

    // state for storing data for creating new client
    const [newClientData, setNewClientData] = useState({});

    // Ref For Create Client Form Submit Button, helps disabling this button during api call
    const submitButtonForNewClient = useRef();

    // State For Profile Pic Cropping
    const [showImageCropModal, setShowImageCropModal] = useState(false);
    const [image, setImage] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // State for storing client profile data to show in modal
    const [clientProfile, setClientProfile] = useState({});
    const [updateClientData, setUpdateClientData] = useState({email:"", key:"", value:""});
    const [updateClientStatus, setUpdateClientStatus] = useState("free"); // This State can be (free / busy), So user wont be able to edit multiple client parameters at the same time.
    const [updateFormState, setUpdateFormState] = useState({
        "nameReadOnly": true,
        "genderReadOnly": true,
        "phoneReadOnly": true,
        "addressReadOnly": true,
        "cityReadOnly": true,
        "area_codeReadOnly": true,
        "plan_idReadOnly": true,
        "id_typeReadOnly": true
    })

    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);

    const [updateApiMessage, setUpdateApiMessage] = useState(null);

    // Show Messages in Modal With Specific Title and Message
    const [showMessageBox, setShowMessageBox] = useState({show:false,title:"",message:""});

    // Show or Hide Complaint List
    const [showComplaintList, setShowComplaintList] = useState(false);
    // Store Complaint Data of Specific Client For Listing
    const [complaintListData, setComplaintListData] = useState(null);
    // Complaint Found
    const [complaintFound, setComplaintFound] = useState(false);
    // Complaint Status
    const [complaintStatus, setComplaintStatus] = useState("active");
    // Complaint Detail Model
    const [showDetailedView, setShowDetailedView] = useState(null);
    // Complaint Delete Confirm Model
    const [showDeleteConfirmModel, setShowDeleteConfirmModel] = useState(null);


    // Show or Hide Transaction List
    const [showTransactionList, setShowTransactionList] = useState(false);
    // Store Transaction Data of Specific Client For Listing
    const [transactionListData, setTransactionListData] = useState(null);
    // Selected Transactions Data For Update Form
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showTransactionUpdateForm, setShowTransactionUpdateForm] = useState(false);
    const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
    const [newTransactionData, setNewTransactionData] = useState({});
    const [showTransactionDeleteConfirm, setShowTransactionDeleteConfirm] = useState(null);

    const [ tariffPlanList, setTariffPlanList ] = useState([]);

    const handleCloseClientTransaction = () => {
        setShowTransactionList(false);
        setTransactionListData(null);
        setSelectedTransaction(null);
        setShowTransactionUpdateForm(false);
        setShowNewTransactionForm(false);
        setNewTransactionData({});
    }

    const handleCloseClientComplaint = () => {
        setShowComplaintList(false);
        setComplaintListData(null);
        setComplaintStatus("active");
    }

    const refreshAfterUpdatingTransaction = (email) =>{
        // Calling API
        const body = {email: email};
        const headers = {"Authorization":`Bearer ${authToken}`};
        axios.post(`${apiDomain}/admin/client-transaction`,body,{headers})
        .then(res=>{
            if (res.data.result === true){
                setTransactionListData({
                    transaction_data : res.data.data,
                    client_data : res.data.client
                });
            }
        })
        .catch(error=>{
            console.error(error);
        })
    }

    const handleDeleteTransaction = (transaction_id,client_email) =>{
        setShowTransactionDeleteConfirm(null);
        setLoadingModal(true);
        const body = {id: transaction_id};
        const headers = {"Authorization": `Bearer ${authToken}`};
        axios.delete(`${apiDomain}/admin/delete-transaction`,{data:body,headers:headers})
        .then(response=>{
            if (response.data.result === true){
                // Transaction Deleted Successfully
                // Now Refreshing Transaction List
                const body = {email: client_email};
                axios.post(`${apiDomain}/admin/client-transaction`,body,{headers})
                .then(res=>{
                    if (res.data.result === true){
                        // There Are Still Transactions Left After Deleting
                        setLoadingModal(false);
                        setShowMessageBox({
                            show:true,
                            title:"Transaction Deleted",
                            message:response.data.message
                        })
                        setTransactionListData({
                        transaction_data : res.data.data,
                        client_data : res.data.client
                        });
                        }
                    
                    else {
                        // There are No Transactions Left
                        setLoadingModal(false);
                        handleCloseClientTransaction();
                        setShowMessageBox({
                            show:true,
                            title:"Transaction Deleted",
                            message:response.data.message
                        })
                    }
                })
                .catch(error=>{
                    console.error(error);
                    setLoadingModal(false);
                        setShowMessageBox({
                            show:true,
                            title:"Server Error",
                            message:"Server Rejected Your Request"
                        })
                    })

            }
        })
        .catch(error=>{
            console.error(error);
                    setLoadingModal(false);
                        setShowMessageBox({
                            show:true,
                            title:"Server Error",
                            message:"Server Rejected Your Request"
                        })
        })
    }

    const handleShowClientTransaction = (event,client) => {
        // Disabling Button
        event.target.disabled = true;
        // Show Loading
        setLoadingModal(true);
        // Calling API
        const body = {email: client.email};
        const headers = {"Authorization":`Bearer ${authToken}`};
        axios.post(`${apiDomain}/admin/client-transaction`,body,{headers})
        .then(res=>{
            // Enabling Button
            event.target.disabled = false;
            // Stopping Loading
            setLoadingModal(false);
            
            if (res.data.result === true){
                // Transactions Found
                setTransactionListData({
                    transaction_data : res.data.data,
                    client_data : res.data.client
                });
                setShowTransactionList(true);
            }
            else {
                // No Transactions Found
                setShowMessageBox({
                    show:true,
                    title:"No Transactions Found",
                    message:"This client doesn't have any transactions."})
            }
        })
        .catch(error => {
            // Enabling Button
            event.target.disabled = false;
            // Stopping Loading
            setLoadingModal(false);
            // Error Occured
            setShowMessageBox({
                show:true,
                title:"Server Error Occured",
                message:"Server Rejected Your Request"
            })
        })
    }

    const handleShowClientComplaints = (event,client) => {
        // Disabling Button
        event.target.disabled = true;
        // Show Loading
        setLoadingModal(true);
        // Calling API
        const body = {client_email: client.email,status:complaintStatus};
        const headers = {"Authorization":`Bearer ${authToken}`};
        axios.post(`${apiDomain}/admin/client-complaints`,body,{headers})
        .then(res=>{
            // Enabling Button
            event.target.disabled = false;
            // Stopping Loading
            setLoadingModal(false);
            
            if (res.data.result === true){
                // Complaints Found
                setComplaintFound(true);
                setComplaintListData({
                    complaint_data : res.data.complaint_data,
                    client_data : res.data.client_profile
                });
                setShowComplaintList(true);
            }
            else {
                // No Complaints Found
                setComplaintFound(false);
                setComplaintListData({
                    complaint_data : [],
                    client_data : res.data.client_profile
                });
                setShowComplaintList(true);
            }
        })
        .catch(error => {
            // Enabling Button
            event.target.disabled = false;
            // Stopping Loading
            setLoadingModal(false);
            // Error Occured
            setShowMessageBox({
                show:true,
                title:"Server Error Occured",
                message:"Server Rejected Your Request, Please Check Your Internet Connection or Try Again Later :("
            })
        })
    }

    const handleSwitchComplaintStatus = (event,email,status) => {
        if (status != complaintStatus){
            // Disabling Button
            event.target.disabled = true;
            // Show Loading
            setLoadingModal(true);
            // Calling API
            const body = {client_email: email,status:status};
            const headers = {"Authorization":`Bearer ${authToken}`};
            axios.post(`${apiDomain}/admin/client-complaints`,body,{headers})
            .then(res=>{
                // Enabling Button
                event.target.disabled = false;
                // Stopping Loading
                setLoadingModal(false);

                if (res.data.result === true){
                    // Complaints Found
                    setComplaintListData({
                        complaint_data : res.data.complaint_data,
                        client_data : res.data.client_profile
                    });
                    setComplaintFound(true);
                    setComplaintStatus(status);
                }
                else {
                    // No Complaints Found
                    setComplaintListData({
                        complaint_data : [],
                        client_data : res.data.client_profile
                    });
                    setComplaintFound(false);
                    setComplaintStatus(status);
                }
            })
            .catch(error => {
                // Enabling Button
                event.target.disabled = false;
                // Stopping Loading
                setLoadingModal(false);
                // Error Occured
                setShowMessageBox({
                    show:true,
                    title:"Server Error Occured",
                    message:"Server Rejected Your Request, Please Check Your Internet Connection or Try Again Later :("
                })
            })
        }
    }

    const handleRefreshComplaintList = () => {
        // Show Loading
        setLoadingModal(true);
        // Calling API
        const body = {client_email: complaintListData.client_data.email,status:complaintStatus};
        const headers = {"Authorization":`Bearer ${authToken}`};
        axios.post(`${apiDomain}/admin/client-complaints`,body,{headers})
        .then(res=>{
            // Stopping Loading
            setLoadingModal(false);
            if (res.data.result === true){
                // Complaints Found
                setComplaintListData({
                    complaint_data : res.data.complaint_data,
                    client_data : res.data.client_profile
                });
                setComplaintFound(true);
            }
            else {
                // No Complaints Found
                setComplaintListData({
                    complaint_data : [],
                    client_data : res.data.client_profile
                });
                setComplaintFound(false);
            }
        })
        .catch(error => {
            // Stopping Loading
            setLoadingModal(false);
            // Error Occured
            setShowMessageBox({
                show:true,
                title:"Server Error Occured",
                message:"Server Rejected Your Request, Please Check Your Internet Connection or Try Again Later :("
            })
        })
    }


    // For Client Indexing in Table
    let count = 0;

    const getClients = async () =>{
        setShowWhichModal(null);
        setClientData("loading");
        const headers = {'Authorization':`Bearer ${authToken}`};
        await axios.get(`${apiDomain}/admin/clients`,{headers})
        .then(res=>{
            // Client Found
            if (res.data.result === true){
                setClientData(res.data.data);
            }
            // No Client Found
            else if(res.data.result === false){
                setClientData(null);
            }
        })
        .catch(error=>{
            console.log("Error Occured During Fetching Clients",error)
            setClientData("error");
        });
    }

    useEffect(()=>{
        getClients();
    },[]);

    // function for refreshing client list
    const refreshClientList = () => {
        setLoadingModal(true);
        const headers = {'Authorization':`Bearer ${authToken}`};
        axios.get(`${apiDomain}/admin/clients`,{headers})
        .then(res=>{
            setLoadingModal(false);
            // Client Found
            if (res.data.result === true){
                setClientData(res.data.data);
            }
            // No Client Found
            else if(res.data.result === false){
                setClientData(null);
            }
        })
        .catch(error=>{
            setLoadingModal(false);
            console.log("Error Occured During Fetching Clients",error)
            setClientData("error");
        });
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
            setShowImageCropModal(true);
        }
    }

    const handleCropComplete = useCallback(async (croppedArea, croppedAreaPixels) => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            setCroppedImage(croppedImage);
        } catch (e) {
            console.error(e);
        }
    }, [image]);

    function convertBase64ToFile(base64String, filename = 'cropped-image.png') {
        const [header, data] = base64String.split(',');
        const mime = header.match(/:(.*?);/)[1];
        const binary = atob(data);
        const array = [];
        
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        
        const blob = new Blob([new Uint8Array(array)], { type: mime });
        return new File([blob], filename, { type: mime });
      }



    const handleShowClientDetailButton = (event,email) => {
        event.target.disabled = true;
        setLoadingModal(true);
        const body = {email: email};
        const headers = {'Authorization': `Bearer ${authToken}`};

        axios.post(`${apiDomain}/admin/client-profile`, body, {headers})
        .then(res=>{
            if (res.data.result === true) {
                setClientProfile({...res.data.data[0],picture:`data:image/png;base64,${res.data.data[0].picture}`})
                // Fetching Tariff Plans Data
                axios.get(`${apiDomain}/admin/tariff`,{headers})
                .then(res=>{
                            if (res.data.result === true){
                                // Plans Found
                                setTariffPlanList(res.data.data);
                                event.target.disabled = false;
                                setLoadingModal(false);
                                setShowWhichModal("client-profile-modal")
                            }
                })
                .catch(error=>{
                    event.target.disabled = false;
                    setLoadingModal(false);
                    setUpdateApiMessage("Server Error Occured, Check Your Internet Connection.");
                    console.log(error);
                })
            }
        })
        .catch(error=>{
            event.target.disabled = false;
            setLoadingModal(false);
            setUpdateApiMessage("Server Error Occured, Check Your Internet Connection.");
            console.log(error);
        })
    }

    const handleUpdateForm = async () =>{
        setLoadingModal(true);
        let body = updateClientData;
        // Gov Verification ID
        if (body.key === "id_type" && body.hasOwnProperty("id_value")){
            body = {email:body.email,
                    key:body.key,
                    value:`${body.value},${body.id_value}`
            }
        }
        // Phone Number With Country Code
        else if (body.key === "phone" && body.hasOwnProperty("country_code")){
            body = {email:body.email,
                    key:body.key,
                    value:`${body.country_code}-${body.value}`
            }
        }
        // console.log(body);
        const headers = {'Authorization': `Bearer ${authToken}`};
        axios.put(`${apiDomain}/admin/update-client`,body,{headers})
        .then(res=>{
            // Handling name Update Request
            if (updateClientData.key==="name"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, name: updateClientData.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }
            // Handling gender Update Request
            if (updateClientData.key==="gender"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, gender: updateClientData.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }
            // Handling phone Update Request
            if (updateClientData.key==="phone"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, phone: `${updateClientData.country_code}-${updateClientData.value}`});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }

            // Handling address Update Request
            if (updateClientData.key==="address"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, address: updateClientData.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }

            // Handling city Update Request
            if (updateClientData.key==="city"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, city: updateClientData.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }

            // Handling area_code Update Request
            if (updateClientData.key==="area_code"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, area_code: updateClientData.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }

            // Handling plan_cost Update Request
            if (updateClientData.key==="plan_id"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, plan_id: body.value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }

            // Handling id_type Update Request
            if (updateClientData.key==="id_type"){
                if (res.data.result === true) {
                    setLoadingModal(false);
                    setUpdateApiMessage(res.data.message);
                    setClientProfile({...clientProfile, id_type: updateClientData.value, id_value: updateClientData.id_value});
                }
                else {
                    setLoadingModal(false);
                    setUpdateApiMessage("Failed, Server Rejected Your Request");
                }
            }
        }).catch(error=>{
            setLoadingModal(false);
            setUpdateApiMessage("Failed, Server Rejected Your Request");
        })
    }


    // Modals For Creating New Clients
    const getCreateClientModal = () =>{
        return (
        <>
                <Modal 
                show={showWhichModal === "create-client-modal"} 
                dialogClassName="custom-create-client-modal" 
                centered 
                onHide={()=>{setShowWhichModal(null);setImage(null);setCroppedImage(null);setShowImageCropModal(false)}} 
                backdrop="static" 
                keyboard={false}>
                    <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                        <h2 className="text-center w-100">New Client Form</h2>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <form onSubmit={(event)=>{
                        event.preventDefault();
                        setLoadingModal(true);
                        submitButtonForNewClient.current.disabled = true;
                        const body = {...newClientData,
                            file:convertBase64ToFile(croppedImage)
                        };
                        const headers = {'Authorization': `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data'};
                        axios.post(`${apiDomain}/admin/create-client`,body,{headers})
                        .then(res=>{
                                setLoadingModal(false);
                                submitButtonForNewClient.current.disabled = false;
                                res.data.result === true && setShowWhichModal("create-modal-success");
                                res.data.result === false && res.data.reason === "email_conflict" && setShowWhichModal("create-modal-email-conflict");
                                setImage(null);
                                setCroppedImage(null);
                            })
                            .catch(error=>{
                                setLoadingModal(false);
                                submitButtonForNewClient.current.disabled = false;
                                setShowWhichModal("create-modal-failed");
                                setImage(null);
                                setCroppedImage(null);
                            })
                    }}>
                      {/* Picture Input Box */}
                      <div className="form-group mx-2">
                        <label className="mb-1">{image === null ? "Profile Picture" : "Change Profile Picture"}</label>
                        <input onChange={handleImageChange} 
                                        type="file" accept="image/*" className="form-control bg-light text-dark" required/>
                      </div>
                      <div className="d-flex">
                        {/* FLEX START */}
                        <div className="d-flex" style={{justifyContent:"flex-start",minWidth:"585px"}}>
                            <div>
                                <div className="d-flex form-group">
                                    {/* CLIENT NAME */}
                                    <div className="form-group mt-2 mx-2">
                                      <label className="mb-1 mx-2">Name</label>
                                      <input onChange={(event)=>{
                                                          setNewClientData({...newClientData, name:event.target.value.toUpperCase()});
                                                          event.target.value = event.target.value.toUpperCase();
                                                      }} 
                                                      style={{width:"300px"}}
                                      type="text" className="form-control bg-light text-dark" placeholder="Client Full Name" pattern="[A-Za-z\s]+" required/>
                                    </div>
                                              
                                    {/* CLIENT GENDER */}
                                    <div className="form-group mt-2 mx-2">
                                        <label className="mx-2 mb-1">Gender</label>
                                        <select onChange={(event)=>{
                                                        setNewClientData({...newClientData, gender:event.target.value});
                                                    }}
                                                    style={{width:"200px"}}
                                        defaultValue={""} className="form-select bg-light text-dark" required>
                                            <option value="" disabled hidden>Select</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="NULL">Do Not Mention</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="d-flex form-group">
                                    {/* CLIENT PHONE NUMBER */}
                                    <div className="form-group mt-2 mx-2">
                                      <label className="mb-1 mx-2">Phone</label>
                                      <div className="d-flex">
                                      <div className="input-group-prepend">
                                          <select defaultValue={"null"} onChange={(event)=>{setNewClientData({...newClientData, country_code:event.target.value})}} className="form-select bg-light text-dark" required>
                                              <option value="null" hidden disabled></option>
                                              <option value="+91">+91</option>
                                          </select>
                                      </div>
                                      <input onChange={(event)=>{
                                                          setNewClientData({...newClientData, phone:event.target.value});
                                                      }}
                                                      style={{width:"225px"}} 
                                      type="tel" className="form-control bg-light text-dark" placeholder="Client Phone" pattern="[0-9]{10}" maxLength="10" required/>
                                    </div>
                                    </div>
                                    {/* TARIFF PLAN */}
                                    <div className="form-group mt-2 mx-2">
                                        <label className="mx-2 mb-1">Tariff Plan</label>
                                        <select onChange={(event)=>{
                                                        setNewClientData({...newClientData, plan_id:event.target.value});
                                                    }}
                                                    style={{width:"200px"}}
                                        defaultValue={""} className="form-select bg-light text-dark" required>
                                            <option value="" disabled hidden>Select</option>
                                            {tariffPlanList.map((item,index)=>{
                                                return <option key={index} value={item.plan_id}>{item.plan_name}</option>
                                            })}
                                        </select>
                                    </div>
                                    
                                </div>
                                              

                                <div className="d-flex form-group">
                                    {/* CLIENT GOVERNMENT ID TYPE */}
                                    <div className="form-group mt-2 mx-2">
                                       <label className=" mx-2 mb-1">Verification Document</label>
                                       <select onChange={(event)=>{
                                                           setNewClientData({...newClientData, id_type:event.target.value});
                                                       }}
                                                       style={{width:"300px"}}  
                                       defaultValue={""} className="form-select bg-light text-dark" required>
                                           <option value="" disabled hidden>Select</option>
                                           <option value="Aadhar Card">Aadhar Card</option>
                                           <option value="Driving License">Driving License</option>
                                           <option value="Passport">Passport</option>
                                           <option value="Voter ID">Voter ID</option>
                                           <option value="null">Null</option>
                                       </select>
                                    </div>
                                                   
                                    {/* GOVERNMENT ID VALUE */}
                                    <div className="form-group mt-2 mx-2">
                                       <label className="mb-1  mx-2">Document Number</label>
                                       <input onChange={(event)=>{
                                                           setNewClientData({...newClientData, id_value:event.target.value});
                                                       }}
                                                       style={{width:"200px"}}
                                       type="text" className="form-control bg-light text-dark" placeholder="ID Number" required/>
                                    </div>      
                                </div>

                            </div>
                        </div>
                        {/* FLEX END */}
                        <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            {/* CLIENT PICTURE */}
                            <div className="form-group">
                                {/* Show SVG Logo When No Picture Present */}
                                <center><i style={{fontSize:"150px",color:"teal"}} hidden={croppedImage != null} className="bi bi-person-bounding-box"></i></center>
                                {/* Show Cropped Image After Picture Uploaded */}
                                { croppedImage != null && (<>
                                    <div className="form-group mt-5">
                                        <center>
                                        <img className="rounded-2 border p-1 img-fluid" style={{width:"170px",height:"16    0px",marginLeft:"-10px"}} src={croppedImage} alt="Profile Picture" />
                                        </center>
                                    </div>
                                    <div className="form-group mt-1">
                                        <center>
                                        <button type="button" className="btn btn-light mx-3" onClick={()=>setShowImageCropModal(true)}><i className="bi bi-pencil-square"></i> Edit Crop</button>
                                        </center>
                                    </div>
                                </>)}
                            </div>
                        </div>
                      </div>
                      
                      {/* Modal For Cropping Image */}
                      <Modal 
                      centered 
                      show={showImageCropModal === true} 
                      onHide={()=>setShowImageCropModal(false)} 
                      style={{backgroundColor:"rgba(0, 0, 0, 0.7)"}}
                      backdrop="static" 
                      keyboard={false}>
                        <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                            <Modal.Title> Image Cropper</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                        <div style={{  position: 'relative',
                                       width: '100%',
                                       height: '400px', // Set fixed height for the cropper
                                       display: 'flex',
                                       flexDirection: 'column',
                                       justifyContent: 'center',
                                       alignItems: 'center', }}>
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Adjust aspect ratio for passport-size, e.g., 1:1
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                                style={{ containerStyle: { position: 'relative', width: '100%', height: '100%',background: '#f3f3f3' } }}
                            />
                            <div style={{ marginTop: '10px' }}>
                                <label htmlFor="zoom">Zoom: </label>
                                <input
                                  id="zoom"
                                  type="range"
                                  min="1"
                                  max="3"
                                  step="0.01"
                                  value={zoom}
                                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                                  style={{ width: '100%' }}
                                />
                              </div>
                            <button type="button" className="btn text-light" style={{backgroundColor:"teal"}} onClick={()=>setShowImageCropModal(false)}><i className="bi bi-floppy"></i> Save Crop</button>
                        </div>
                        </Modal.Body>
                      </Modal>


                      <div className="d-flex form-group">
                        {/* CLIENT ADDRESS */}
                      <div className="form-group mt-2 mx-2">
                        <label className="mb-1 mx-2">Address</label>
                        <input onChange={(event)=>{
                                            setNewClientData({...newClientData, address:event.target.value.toUpperCase()});
                                            event.target.value = event.target.value.toUpperCase();
                                        }} 
                                        style={{width:"300px"}}
                        type="text" className="form-control bg-light text-dark" placeholder="Home/Office Address" required/>
                      </div>

                        {/* CLIENT CITY */}
                      <div className="form-group mt-2 mx-2">
                        <label className="mb-1 mx-2">City</label>
                        <input onChange={(event)=>{
                                            setNewClientData({...newClientData, city:event.target.value.toUpperCase()});
                                            event.target.value = event.target.value.toUpperCase();
                                        }}
                                        style={{width:"200px"}} 
                        type="text" className="form-control bg-light text-dark" placeholder="City" required/>
                      </div>

                      {/* CLIENT PINCODE */}
                      <div className="form-group mt-2 mx-2">
                        <label className="mb-1 mx-2">Pincode</label>
                        <input onChange={(event)=>{
                                            setNewClientData({...newClientData, area_code:event.target.value});
                                        }}
                                        style={{width:"240px"}}
                        type="number" className="form-control bg-light text-dark" placeholder="Area Pincode" required/>
                      </div>
                      </div>

                      <div className="d-flex form-group">
                        {/* CLIENT EMAIL */}
                        <div className="form-group mt-2 mx-2" style={{justifyContent:"flex-start"}}>
                            <label className="mb-1  mx-2">Email</label>
                            <input onChange={(event)=>{
                                            setNewClientData({...newClientData, email:event.target.value});
                                        }}
                                        style={{width:"360px"}}
                                type="email" className="form-control bg-light text-dark" aria-describedby="emailHelp" placeholder="Client Login Email" required/>
                            <small className="form-text text-dark mx-2">(Do Not Enter Existing Client Email)</small>
                        </div>

                        {/* CLIENT PASSWORD */}
                        <div className="form-group mt-2 mx-2" style={{justifyContent:"flex-end"}}>
                        <label className="mb-1  mx-2">Password</label>
                      
                            <div className="input-group">
                                <input 
                                    onChange={(event)=>{
                                            setNewClientData({...newClientData, password:event.target.value});
                                         }}
                                    style={{width:"350px"}} 
                                    type={showPass ? 'text' : 'password'} 
                                    className="form-control bg-light text-dark" 
                                    placeholder="Client Login Password" 
                                    required
                                />
                                <div className="input-group-append">
                                    <span 
                                        className="input-group-text" 
                                        onClick={()=>{showPass ? setShowPass(false) : setShowPass(true)}} 
                                        style={{ cursor: 'pointer' }}
                                        >
                                        <i className={`bi ${showPass ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                    </span>
                                </div>
                            </div>
                            <div className="mx-2">
                                <small className="form-text text-dark">
                                    - Minimum 8 Characters Long <br />
                                    - Must be a Strong Password
                                </small>
                            </div>
                        </div>
                      </div>
                      
                      <div className="d-flex mt-5 mb-3" style={{justifyContent:"center"}}>
                        <button ref={submitButtonForNewClient} type="submit" className="btn text-light" style={{backgroundColor:"teal"}}><i className="bi bi-person-fill-add"></i> Create Client</button>
                      </div>
                    </form>
                    </Modal.Body>
                </Modal>

                {/* Success Client Modal */}
                <Modal show={showWhichModal==="create-modal-success"} style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}} onHide={()=>getClients()} centered backdrop="static" keyboard={false}>
                        <Modal.Header className="text-light" style={{backgroundColor:"teal"}} closeButton>
                            <Modal.Title>New Client Created</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                        <p>Now, Client Can Login Using Their Credentials.</p>
                        </Modal.Body>
                </Modal>

                {/* Failed Client Modal */}
                <Modal 
                show={showWhichModal==="create-modal-failed"} 
                onHide={()=>setShowWhichModal(null)}
                centered
                style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}} 
                backdrop="static" 
                keyboard={false}>
                        <Modal.Header className="text-light bg-danger" closeButton>
                            <Modal.Title>Error Occured</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-dark bg-light">
                        <p>Failed, Couldn't able to create new client</p>
                        </Modal.Body>
                </Modal>

                {/* Client Email Conflict Modal */}
                <Modal 
                show={showWhichModal === "create-modal-email-conflict"} 
                onHide={()=>setShowWhichModal(null)}
                centered
                style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}} 
                backdrop="static" 
                keyboard={false}
                >
                        <Modal.Header className="text-light bg-danger" closeButton>
                            <Modal.Title>Email Conflict Detected</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-dark bg-light">
                        <p>Someone With Exact Same Email is Already an Existing Client.</p>
                        </Modal.Body>
                </Modal>
                {/*  Loading Modal */}
                <Modal 
                show={loadingModal === true}
                centered
                style={{backgroundColor:"rgba(0, 0, 0, 0.6)"}} 
                backdrop="static" 
                keyboard={false}>
                        <Modal.Header className="text-light" style={{backgroundColor:"teal"}}>
                            <Modal.Title>Please Wait</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-dark bg-light">
                            <center>
                            <div className="spinner-border" role="status">
                                <span className="sr-only" hidden>Loading...</span>
                            </div>
                            </center>
                        </Modal.Body>
                </Modal>
        </>)
    }
    // Modal To See and Update Client Profile
    const getClientProfileModal = () => {
        return (
            showWhichModal==="client-profile-modal" &&
            <>
            <Modal 
                show={showWhichModal==="client-profile-modal"} 
                onHide={()=>{
                    // Changing All Form Field To ReadOnly State
                    setUpdateFormState(prevState => 
                        Object.keys(prevState).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                    );
                    // This Status is When You're Editing One Field, Other Fields Wont Accept Clicks, Unless You Cancel/Save Already Opened Field
                    setUpdateClientStatus('free');
                    // Refreshing Client List
                    getClients();
                }}

                backdrop="static" 
                keyboard={false}
                centered
                dialogClassName="custom-modal"    
                >
                        <Modal.Header className="text-center" closeButton style={{backgroundColor:"teal"}}>
                            <h3 className="text-center w-100">Client Profile</h3>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                        <div className="d-flex" style={{justifyContent:"center"}}>
                            {/* CLIENT PICTURE */}
                        <img className="rounded-2 border border-1 p-1 img-fluid" style={{width:"150px",height:"150px"}} src={clientProfile.picture} alt="Profile Picture" />
                        </div>
                        <div className="d-flex mt-2" style={{justifyContent:"center"}}>
                            <button type="button" onClick={()=>{
                                setShowImageCropModal(true);
                                setCroppedImage(null);
                                setImage(null);
                            }} className="btn btn-light text-dark fw-bold"><i className="bi bi-pencil-square"></i> Change Picture</button>
                        </div>
                        {/* Modal For Uploading Image */}
                        <Modal show={showImageCropModal === true} onHide={()=>{
                            setShowImageCropModal(false);
                            setCroppedImage(null);
                            setImage(null);
                        }}
                        style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}} 
                        backdrop="static" 
                        keyboard={false}
                        centered
                        >
                          <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                              <Modal.Title>Update Client Image</Modal.Title>
                          </Modal.Header>
                          <Modal.Body className="bg-light text-dark">
                          {/* CLIENT PICTURE */}
                          <div className="form-group mt-2 mb-2">
                            <label className="mb-1 fw-bold">{image === null ? "Upload New Client Picture: " : "Change Client Picture: "}</label>
                            <input onChange={handleImageChange} 
                                            type="file" accept="image/*" className="form-control bg-light text-dark" required/>
                          </div>
                          {image === null && <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            <button onClick={()=>{
                                setShowImageCropModal(false);
                                setCroppedImage(null);
                                setImage(null);
                            }} className="btn btn-secondary"><i className="bi bi-x-square"></i> Close</button>
                            </div>}
                          {image != null && 
                            <div style={{  position: 'relative',
                              width: '100%',
                              height: '400px', // Set fixed height for the cropper
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center', }}>
                                <Cropper
                                    image={image}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1} // Adjust aspect ratio for passport-size, e.g., 1:1
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={handleCropComplete}
                                    style={{ containerStyle: { position: 'relative', width: '100%', height: '100%',background: '#f3f3f3' } }}
                                />

                                <div style={{ marginTop: '10px' }}>
                                 <label htmlFor="zoom">Zoom: </label>
                                 <input
                                   id="zoom"
                                   type="range"
                                   min="1"
                                   max="3"
                                   step="0.01"
                                   value={zoom}
                                   onChange={(e) => setZoom(parseFloat(e.target.value))}
                                   style={{ width: '100%' }}
                                 />
                                </div>

                                <div className="d-flex justify-content-center">
                                <button type="button" className="btn btn-primary mx-1" onClick={
                                   (event)=>{
                                       event.target.disabled = true;
                                       setLoadingModal(true);
                                       const body = {email:clientProfile.email,file:convertBase64ToFile(croppedImage)};
                                       const headers = {'Authorization': `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data'};
                                       axios.put(`${apiDomain}/admin/update-client-picture`,body,{headers})
                                       .then(res=>{
                                               if (res.data.result === true){
                                                   event.target.disabled = false;
                                                   setLoadingModal(false);
                                                   setUpdateApiMessage(res.data.message);
                                                   setClientProfile({...clientProfile,picture:croppedImage});
                                                   setImage(null);
                                                   setCroppedImage(null);
                                                   setShowImageCropModal(false);
                                               }
                                               else {
                                                   event.target.disabled = false;
                                                   setLoadingModal(false);
                                                   setUpdateApiMessage("Server Rejected Your Request :(");
                                                   setImage(null);
                                                   setCroppedImage(null);
                                                   setShowImageCropModal(false);
                                               }

                                           })
                                           .catch(error=>{
                                               console.log(error);
                                               event.target.disabled = false;
                                               setLoadingModal(false);
                                               setUpdateApiMessage("Server Rejected Your Request :(");
                                               setImage(null);
                                               setCroppedImage(null);
                                               setShowImageCropModal(false);
                                           })
                                   }}><i className="bi bi-floppy"></i> Update
                                </button>

                                <button type="button" className="btn btn-secondary mx-1" onClick={()=>{
                                   setShowImageCropModal(false);
                                   setCroppedImage(null);
                                   setImage(null);}}><i className="bi bi-x-square"></i> Cancel
                                </button>
                                </div>
                            </div>
                          }
                          </Modal.Body>
                        </Modal>
                        <form>
                            {/* CLIENT EMAIL */}
                            <label className="mt-3 mb-1 fw-bold"><i className="bi bi-envelope-fill"></i> Email</label>
                            <div className="d-flex">
                                <input className="form-control text-dark bg-light" type="text" value={clientProfile.email} onChange={()=>{}} />
                                <a style={{fontSize:"14px",marginLeft:"5px",backgroundColor:"teal"}} 
                                   className="btn border px-2" 
                                   onClick={(event) => {
                                    navigator.clipboard.writeText(clientProfile.email)
                                    .then(() => {
                                        event.target.innerHTML = "Copied";
                                        setTimeout(()=>event.target.innerHTML = "Copy",1000);
                                    })
                                    .catch((err) => {
                                        console.error('Failed to copy text: ', err);
                                    });
                                }}>Copy</a>
                                
                            </div>

                            <div className="d-flex">
                            
                            {/* CLIENT NAME */}
                            <div>
                            <label className="mt-1 mb-1 fw-bold">{updateFormState.nameReadOnly === true ? "Name" : "Enter New Name"}</label>
                            <div className="input-group">
                                <input
                                    value={updateFormState.nameReadOnly === true ? clientProfile.name : updateClientData.value} 
                                    type="text" 
                                    className={updateFormState.nameReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"} 
                                    placeholder="Client Name" 
                                    pattern="[A-Za-z\s]+"
                                    onChange={(event)=>setUpdateClientData({email:clientProfile.email, key:"name", value:event.target.value.toUpperCase()})}
                                    readOnly={updateFormState.nameReadOnly}
                                    required
                                />
                                <div className="input-group-append mx-2">
                                        {updateFormState.nameReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,nameReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"name", value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} 
                                            className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,nameReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,nameReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel"  className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>

                            {/* CLIENT GENDER */}
                            <div>
                            <label className="mt-1 mb-1 fw-bold">{updateFormState.genderReadOnly === true ? "Gender" : "Select New Gender"}</label>
                            <div className="input-group">
                                <select 
                                value={updateFormState.genderReadOnly === true ? clientProfile.gender : updateClientData.value} 
                                className={updateFormState.genderReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"}
                                onChange={(event)=>setUpdateClientData({...updateClientData, email:clientProfile.email, key:"gender", value:event.target.value.toUpperCase()})}
                                readOnly={updateFormState.genderReadOnly}
                                style={! updateFormState.nameReadOnly ? {} : ! updateFormState.genderReadOnly ? {} : {width:"206px"} }
                                required
                                >
                                    <option hidden>SELECT GENDER</option>
                                    <option hidden={updateFormState.genderReadOnly} value="MALE">MALE</option>
                                    <option hidden={updateFormState.genderReadOnly} value="FEMALE">FEMALE</option>
                                    <option hidden={updateFormState.genderReadOnly} value="NULL">DO NOT MENTION</option>
                                </select>
                                <div className="input-group-append mx-2">
                                        {updateFormState.genderReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,genderReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"gender", value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} 
                                            className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,genderReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,genderReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel"  className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>

                            </div>

                            
                            <div className="d-flex">
                            {/* CLIENT PHONE */}
                            <div>
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.phoneReadOnly === true ? "Phone Number" : "Enter New Phone Number"}</label>
                            <div className="input-group">
                                <div className="d-flex">
                                    <div className="input-group-prepend">
                                        <select
                                        value={updateFormState.phoneReadOnly === true ? clientProfile.phone.substring(0,4) : updateClientData.country_code}
                                        onChange={(event)=>{setUpdateClientData({...updateClientData,email:clientProfile.email, key:"phone", country_code:event.target.value.toUpperCase()})}}
                                        className={updateFormState.phoneReadOnly === true ? "form-select bg-light text-dark" : "form-select bg-light text-dark"}
                                        readOnly={updateFormState.phoneReadOnly}
                                        required
                                        defaultValue={""}
                                        >
                                            <option value="" hidden disabled></option>
                                            <option hidden={updateFormState.phoneReadOnly} value="+91">+91</option>
                                        </select>
                                    </div>
                                    <input
                                        value={updateFormState.phoneReadOnly === true ? clientProfile.phone.substring(4) : updateClientData.value} 
                                        type="tel" 
                                        className={updateFormState.phoneReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"} 
                                        placeholder="Phone Number" 
                                        pattern="[0-9]{10}" maxLength="10"
                                        onChange={(event)=>setUpdateClientData({...updateClientData,email:clientProfile.email, key:"phone", value:event.target.value.toUpperCase()})}
                                        readOnly={updateFormState.phoneReadOnly}
                                        required
                                        style={updateFormState.phoneReadOnly ? !updateFormState.plan_idReadOnly ? {width:"100px"} : {width:"130px"} : {width:"130px"}}
                                    />
                                </div>
                                <div className="input-group-append mx-2">
                                        {updateFormState.phoneReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,phoneReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"phone", value:"", country_code:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != "" && updateClientData.country_code != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,phoneReadOnly:true});
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,phoneReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>

                            {/* PLAN  ID */}
                            <div>
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.plan_idReadOnly === true ? "Tariff Plan" : "Change Tariff Plan"}</label>
                            <div className="input-group">
                                <select
                                        value={updateFormState.plan_idReadOnly === true ? clientProfile.plan_id : updateClientData.value}
                                        onChange={(event)=>{setUpdateClientData({...updateClientData,
                                                                                 email:clientProfile.email,
                                                                                 key:"plan_id",
                                                                                 value:event.target.value})}}
                                        className={updateFormState.plan_idReadOnly === true ? "form-select bg-light text-dark" : "form-select bg-light text-dark"}
                                        readOnly={updateFormState.plan_idReadOnly}
                                        required
                                        style={updateFormState.plan_idReadOnly ? !updateFormState.phoneReadOnly ? {width:"150px"} : {width:"207px"} : {width:"180px"}}
                                        >
                                            <option value="" selected hidden disabled></option>
                                            {/* Listing Tariff Plans */}
                                            {tariffPlanList.map((item,index)=>{
                                                return <option key={index} hidden={updateFormState.plan_idReadOnly} value={item.plan_id}>{item.plan_name}</option>
                                            })}
                                </select>
                                <div className="input-group-append mx-2">
                                        {updateFormState.plan_idReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,plan_idReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"plan_id", value:clientProfile.plan_id});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.plan_id != clientProfile.plan_id){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,plan_idReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,plan_idReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>

                            </div>





                            {/* CLIENT ADDRESS */}
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.addressReadOnly === true ? "Address" : "Enter New Address"}</label>
                            <div className="input-group">
                                <input
                                    value={updateFormState.addressReadOnly === true ? clientProfile.address : updateClientData.value} 
                                    type="text" 
                                    className={updateFormState.addressReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"} 
                                    placeholder="Address" 
                                    onChange={(event)=>setUpdateClientData({email:clientProfile.email, key:"address", value:event.target.value.toUpperCase()})}
                                    readOnly={updateFormState.addressReadOnly}
                                    required
                                    style={updateFormState.addressReadOnly ? {maxWidth:"485px"} : {}}
                                />
                                <div className="input-group-append mx-2">
                                        {updateFormState.addressReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,addressReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"address", value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,addressReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,addressReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>

                            <div className="d-flex">
                            {/* CLIENT CITY */}
                            <div>
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.cityReadOnly === true ? "City" : "Enter New City"}</label>
                            <div className="input-group">
                                <input
                                    value={updateFormState.cityReadOnly === true ? clientProfile.city : updateClientData.value} 
                                    type="text" 
                                    className={updateFormState.cityReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"} 
                                    placeholder="City" 
                                    onChange={(event)=>setUpdateClientData({email:clientProfile.email, key:"city", value:event.target.value.toUpperCase()})}
                                    readOnly={updateFormState.cityReadOnly}
                                    required
                                />
                                <div className="input-group-append mx-2">
                                        {updateFormState.cityReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,cityReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"city", value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,cityReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,cityReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>


                            {/* CLIENT AREA CODE */}
                            <div>
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.area_codeReadOnly === true ? "Area Code" : "Enter New Area Code"}</label>
                            <div className="input-group">
                                <input
                                    value={updateFormState.area_codeReadOnly === true ? clientProfile.area_code : updateClientData.value} 
                                    type="number" 
                                    className={updateFormState.area_codeReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"} 
                                    placeholder="Area Pin Code" 
                                    onChange={(event)=>setUpdateClientData({email:clientProfile.email, key:"area_code", value:event.target.value.toUpperCase()})}
                                    readOnly={updateFormState.area_codeReadOnly}
                                    style={updateFormState.area_codeReadOnly ? {maxWidth:"205px"} : {}}
                                    required
                                />
                                <div className="input-group-append mx-2">
                                        {updateFormState.area_codeReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,area_codeReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"area_code", value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,area_codeReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,area_codeReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                            </div>
                            </div>

                            </div>


                            {/* UPDATE IDENTITY VERIFICATION DOCUMENT */}
                            {/* CLIENT GOVERNMENT ID TYPE */}
                            <label className="mt-3 mb-1 fw-bold">{updateFormState.id_typeReadOnly === true ? "Identity Verification Document" : "Select New Identity Verification Document"}</label>
                            <div className="input-group">
                                <select 
                                value={updateFormState.id_typeReadOnly === true ? clientProfile.id_type : updateClientData.value} 
                                className={updateFormState.id_typeReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"}
                                onChange={(event)=>setUpdateClientData({...updateClientData, email:clientProfile.email, key:"id_type", value:event.target.value.toUpperCase()})}
                                readOnly={updateFormState.id_typeReadOnly}
                                style={updateFormState.id_typeReadOnly ? {maxWidth:"265px"} : {}}
                                required>
                                    <option hidden>SELECT ID TYPE</option>
                                    <option hidden={updateFormState.id_typeReadOnly} value="AADHAR CARD">AADHAR CARD</option>
                                    <option hidden={updateFormState.id_typeReadOnly} value="DRIVING LICENSE">DRIVING LICENSE</option>
                                    <option hidden={updateFormState.id_typeReadOnly} value="PASSPORT">PASSPORT</option>
                                    <option hidden={updateFormState.id_typeReadOnly} value="VOTER ID">VOTER ID</option>
                                    <option hidden={updateFormState.id_typeReadOnly} value="NULL">NULL</option>
                                </select>
                                <br />
                                <input  
                                    type="text"
                                    value={updateFormState.id_typeReadOnly === true ? clientProfile.id_value : updateClientData.id_value}
                                    readOnly={updateFormState.id_typeReadOnly}
                                    placeholder="Document Number"
                                    onChange={(event)=>setUpdateClientData({...updateClientData,email:clientProfile.email, key:"id_type", id_value:event.target.value.toUpperCase()})}
                                    className={updateFormState.id_typeReadOnly === true ? "form-control bg-light text-dark" : "form-control bg-light text-dark"}
                                    required 
                                    style={updateFormState.id_typeReadOnly ? {maxWidth:"223px"} : {}}
                                />
                                <div className="input-group-append mx-2">
                                        {updateFormState.id_typeReadOnly ?
                                        <span title="Edit" onClick={()=>{
                                            if (updateClientStatus === "free"){
                                                setUpdateFormState({...updateFormState,id_typeReadOnly:false}); 
                                                setUpdateClientData({email:clientProfile.email, key:"id_type", value:"",id_value:""});
                                                setUpdateClientStatus('busy');
                                            }
                                            }} className="input-group-text mx-2" style={{ cursor: 'pointer', backgroundColor:"teal" }}> 
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        :
                                        <>
                                        <div className="d-flex">
                                        <span onClick={(event)=>{
                                                if (updateClientData.value != "" && updateClientData.id_value != ""){
                                                    event.target.disabled = true;
                                                    handleUpdateForm();
                                                    setUpdateClientStatus('free');
                                                    setUpdateFormState({...updateFormState,id_typeReadOnly:true})
                                                }
                                            }} title="Save" className="input-group-text mx-2 bg-primary" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-floppy2-fill"></i>
                                        </span>
                                        <span onClick={()=>{
                                            setUpdateFormState({...updateFormState,id_typeReadOnly:true});
                                            setUpdateClientStatus('free');
                                            }} title="Cancel" className="input-group-text mx-2 bg-danger" style={{ cursor: 'pointer' }}>
                                            <i className="text-light bi bi-x-square-fill"></i>
                                        </span>
                                        </div>
                                        </>
                                        }
                                </div>
                                <div className="input-group d-flex mt-4" style={{justifyContent:"center"}}>
                                    <center>
                                            <button className="btn btn-light text-dark fw-bold" style={{marginRight:"30px"}} onClick={(event)=>{
                                                event.target.disabled = true;
                                                setLoadingModal(true)
                                                const body = {"email":clientProfile.email};
                                                const headers = {"Authorization" : `Bearer ${authToken}`};
                                                axios.post(`${apiDomain}/admin/reveal-client-password`,body,{headers})
                                                .then(res=>{
                                                    if (res.data.result === true){
                                                        setLoadingModal(false);
                                                        setUpdateApiMessage("Password: "+atob(res.data.password));
                                                        event.target.disabled = false;
                                                    }
                                                })
                                                .catch(error=>{
                                                    console.log(error);
                                                })
                                            }}><i className="bi bi-box-arrow-in-left"></i> Reveal Password</button>
                                            <button type="button" className="btn btn-light fw-bold text-danger" style={{marginLeft:"30px"}} onClick={(event)=>{
                                                event.target.disabled = true;
                                                setDeleteConfirmModal(true);
                                                event.target.disabled = false;
                                            }}><i className="bi bi-person-dash"></i> Delete Client</button>
                                    </center>
                                </div>
                            </div>

                        </form>
                        </Modal.Body>
            </Modal>

            {/* UPDATE API RESPONSE MESSAGE MODAL */}
            <Modal 
            show={updateApiMessage!=null} 
            onHide={()=>setUpdateApiMessage(null)}
            style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}}
            backdrop="static"
            centered 
            keyboard={false}>
                        <Modal.Header className="text-light" style={{backgroundColor:"teal"}} closeButton>
                            <Modal.Title>Server Response</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                        <p>{updateApiMessage}</p>
                        <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            <button onClick={()=>setUpdateApiMessage(null)} className="btn btn-secondary">Close</button>
                        </div>
                        </Modal.Body>
            </Modal>
            
            
            {/*  Loading Modal */}
            <Modal 
            show={loadingModal === true} 
            centered
            style={{backgroundColor:"rgba(0, 0, 0, 0.6)"}}
            backdrop="static" 
            keyboard={false}>
                        <Modal.Header className="text-light" style={{backgroundColor:"teal"}}>
                            <Modal.Title>Please Wait</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-dark bg-light">
                            <center>
                            <div className="spinner-border" role="status">
                                <span className="sr-only" hidden>Loading...</span>
                            </div>
                            </center>
                        </Modal.Body>
            </Modal>

            {/* Delete Confirmation Model */}
            <Modal centered show={deleteConfirmModal === true} backdrop="static" keyboard={false} style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}}>
                        <Modal.Header className="bg-danger">
                            <h2 className="w-100 text-center"><i className="bi bi-exclamation-square"></i> Warning</h2>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <h3>This action cannot be undone.</h3>
                            <p><span className="fw-bold">NAME :</span> {clientProfile.name}</p>
                            <p style={{marginTop:"-20px"}}><span className="fw-bold">EMAIL :</span> {clientProfile.email}</p>
                            <p>You're about to delete this client.</p>
                            <p style={{marginTop:"-20px"}}>All the transaction made by this client will be removed.</p>
                        </Modal.Body>
                        <Modal.Footer className="bg-light text-dark">
                            <button type="button" className="btn btn-danger" onClick={(event)=>{
                                event.target.disabled = true;
                                setLoadingModal(true);
                                const body = {"email":clientProfile.email};
                                const headers = {'Authorization' : `Bearer ${authToken}`};
                                axios.delete(`${apiDomain}/admin/delete-client`,{data:body,headers})
                                    .then(res=>{
                                                if (res.data.result === true){
                                                    event.target.disabled = false;
                                                    setDeleteConfirmModal(false);
                                                    setUpdateFormState(prevState => 
                                                        Object.keys(prevState).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                                                    );
                                                    setUpdateClientStatus('free');
                                                    getClients();
                                                    setLoadingModal(false);
                                                    setShowMessageBox({show:true,title:"Client Deleted",message:res.data.message});
                                                    }
                                                else {
                                                    event.target.disabled = false;
                                                    setDeleteConfirmModal(false);
                                                    setUpdateFormState(prevState => 
                                                        Object.keys(prevState).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                                                    );
                                                    setUpdateClientStatus('free');
                                                    getClients();
                                                    setLoadingModal(false);
                                                    setShowMessageBox({show:true,title:"Client Deleted",message:"Server rejected your request :("});
                                                    
                                                }
                                            })
                                    .catch(error=>{
                                                console.log(error);
                                                event.target.disabled = false;
                                                setDeleteConfirmModal(false);
                                                setUpdateFormState(prevState => 
                                                    Object.keys(prevState).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                                                );
                                                setUpdateClientStatus('free');
                                                getClients();
                                                setLoadingModal(false);
                                                setShowMessageBox({show:true,title:"Client Deleted",message:"Server rejected your request :("});
                                            })
                            }}><i className="bi bi-trash"></i> Permanently Delete</button>
                            <button type="button" className="btn btn-success" onClick={(event)=>setDeleteConfirmModal(false)}><i className="bi bi-x-circle"></i> Cancel</button>
                        </Modal.Footer>
            </Modal>
            </>
        )
    }

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options).replace(',', '');
    }
    
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString('en-US', options);
    }

    // Modal To See and Update Client Transactions
    const getClientTransactionModal = () => {
        return (
        <>
        { showTransactionList === true ?
        <Modal show={showTransactionList===true} onHide={()=>{handleCloseClientTransaction()}} centered dialogClassName="custom-list-client-specific-transaction-modal" backdrop="static" keyboard={false}>
            <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                <Modal.Title>
                    Client Transactions
                </Modal.Title>
            </Modal.Header>
        <Modal.Body className="bg-light text-dark">
                        {/* Client Picture */}
                        <div className="d-flex" style={{justifyContent:"center"}}>
                            <img className="border p-1" width={"150px"} style={{borderRadius:"10px"}} src={`data:image/jpg;base64,${transactionListData.client_data.picture}`} alt={transactionListData.client_data.name} />
                        </div>
                        <div className="text-left">
                            <h5 className="mt-2 text-center fw-bold">{transactionListData.client_data.name}</h5>
                            <p className="text-dark text-center" style={{marginTop:"-5px"}}>{transactionListData.client_data.email}</p>
                            <p className="text-dark text-center" style={{marginTop:"-18px"}}>{transactionListData.client_data.phone}</p>
                            <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>Tariff Plan: {transactionListData.client_data.plan_name} ₹{transactionListData.client_data.plan_cost} [{transactionListData.client_data.plan_validity} {transactionListData.client_data.validity_unit}]</p>
                        </div>
                        {
                        showNewTransactionForm === false && showTransactionUpdateForm === false &&
                        <>
                        <h4 className="text-center mt-5 mb-1">Transactions From  {`${transactionListData.client_data.name.split(' ')[0].charAt(0)}${transactionListData.client_data.name.split(' ')[0].toLowerCase().substring(1)}`}</h4>
                        <div className="d-flex justify-content-center">
                                <small className="text-center mb-3">Total Transactions: {transactionListData.transaction_data.length}</small>
                        </div>
                        {/* New Transaction Button */}
                        <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            <button onClick={()=>{
                                setNewTransactionData({email:transactionListData.client_data.email});
                                setShowNewTransactionForm(true);
                                }} type="button" className="btn mb-3 fw-bold" style={{fontSize:"15px",backgroundColor:"teal"}} title="New Transaction"><i className="bi bi-clipboard-plus"></i> New Transaction</button>
                        </div>
                        <div className="hide-scrollbar" style={{ maxHeight: '290px', overflowY: 'scroll' }}>
                        <table className="table table-light table-striped table-borderd px-5" style={{minWidth:"550px", borderRadius:"10px", overflow:"hidden"}}>
                            <thead>
                                <tr>
                                    <th scope="col" style={{minWidth:"20px",textAlign:"center",backgroundColor:"teal",color:"white"}}>#</th>
                                    <th scope="col" style={{minWidth:"40px",textAlign:"center",backgroundColor:"teal",color:"white"}}>YYYY-MM-DD</th>
                                    <th scope="col" style={{minWidth:"50px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Mode</th>
                                    <th scope="col" style={{minWidth:"50px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Razorpay</th>
                                    <th scope="col" style={{minWidth:"80px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Received</th>
                                    <th scope="col" style={{minWidth:"30px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionListData.transaction_data.map((transaction,array_index)=>{ 
                                    return (
                                        <tr key={transaction.id} style={{fontSize:"15px"}}>

                                            {/* INDEX */}
                                            <td style={{minWidth:"20px",textAlign:"center"}}>{transactionListData.transaction_data.length-array_index}</td>

                                            {/* DATE */}
                                            <td style={{minWidth:"40px",textAlign:"center"}}>{formatDate(transaction.date)} {formatTime(transaction.transaction_timestamp)}</td>

                                            {/* MODE */}
                                            <td style={{minWidth:"50px",textAlign:"center"}}>{transaction.mode}</td>

                                            {/* Auto Generated */}
                                            <td style={{minWidth:"50px",textAlign:"center"}}>{transaction.auto_generated ? "Yes" : "No"}</td>
                                            
                                            {/* AMOUNT */}
                                            <td style={{minWidth:"80px",textAlign:"center"}}>₹ {formatINR(transaction.amount)}</td>

                                            {/* ACTION */}
                                            <td style={{minWidth:"30px",textAlign:"center"}}>
                                                {transaction.auto_generated ? <>
                                                {/* Invoice Button */}
                                                <a title="Open Invoice" onClick={()=>{
                                                    setLoadingModal(true);
                                                    axios.get(`${apiDomain}/invoice`,{params:{id:transaction.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                                                    .then(res=>{
                                                        setLoadingModal(false);
                                                        window.open(URL.createObjectURL(res.data), '_blank');
                                                    })
                                                    .catch(error => {
                                                        setLoadingModal(false);
                                                        setShowMessageBox({show:true,title:"Server Error",message:"Check Your Internet Connection or Try Again Later."});
                                                        console.error('Error fetching protected content:', error);
                                                    });    
                                                }} className="btn btn-light border-dark text-primary mx-1" style={{textDecoration:"none", fontSize:"13px", width:"135px"}}><i className="bi bi-receipt-cutoff"></i> View Invoice</a>
                                                </> : 
                                                <>
                                                {/* Invoice Button */}
                                                <a title="Open Invoice" onClick={()=>{
                                                    setLoadingModal(true);
                                                    axios.get(`${apiDomain}/invoice`,{params:{id:transaction.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                                                    .then(res=>{
                                                        setLoadingModal(false);
                                                        window.open(URL.createObjectURL(res.data), '_blank');
                                                    })
                                                    .catch(error => {
                                                        setLoadingModal(false);
                                                        setShowMessageBox({show:true,title:"Server Error",message:"Check Your Internet Connection or Try Again Later."});
                                                        console.error('Error fetching protected content:', error);
                                                    });    
                                                }} className="btn btn-light border-dark text-primary mx-1" style={{textDecoration:"none", fontSize:"13px"}}><i className="bi bi-receipt-cutoff"></i></a>
                                                
                                                {/* Update Button */}
                                                <a title="Edit" onClick={()=>{
                                                    setSelectedTransaction(transaction);
                                                    setShowTransactionUpdateForm(true);
                                                }} className="btn btn-light border-dark text-success mx-1" style={{textDecoration:"none", fontSize:"13px"}}><i className="bi bi-pencil-square"></i></a>
                                                
                                                {/* Delete Button */}
                                                <a title="Delete" onClick={()=>{
                                                    setShowTransactionDeleteConfirm({id:transaction.id,email:transactionListData.client_data.email});
                                                }} className="btn btn-light border-dark text-danger mx-1" style={{textDecoration:"none", fontSize:"13px"}}><i className="bi bi-trash3"></i></a>
                                                </>}
                                                
                                            </td>
                                        </tr>
                                        )
                            })}
                            </tbody>
                        </table>
                        </div>
                        </>}
                        
                        {showTransactionUpdateForm === true &&
                        <>
                        {/* UPDATE TRANSACTION FORM */}
                        <form onSubmit={(event)=>{
                            event.preventDefault();
                            setLoadingModal(true);
                            const body = {
                                id : selectedTransaction.id,
                                date : selectedTransaction.date,
                                mode : selectedTransaction.mode,
                                amount : selectedTransaction.amount
                            }
                            const headers = {
                                "Authorization" : `Bearer ${authToken}`
                            }
                            axios.put(`${apiDomain}/admin/update-transaction`,body,{headers})
                            .then(res=>{
                                if (res.data.result === true){
                                    refreshAfterUpdatingTransaction(selectedTransaction.email);
                                    setLoadingModal(false);
                                    setShowTransactionUpdateForm(false);
                                    setSelectedTransaction(null);
                                    setShowMessageBox({
                                        show: true,
                                        title: "Transaction Updated",
                                        message: res.data.message
                                    })
                                }
                                else {
                                    setLoadingModal(false);
                                    setShowMessageBox({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                                }
                            })
                            .catch(error=>{
                                setLoadingModal(false);
                                    setShowMessageBox({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                            })
                            console.log(selectedTransaction);
                            }}
                        >
                            <h4 className="text-center mt-5 mb-1">Update Transaction</h4>
                            <div className="d-flex justify-content-center">
                                <small className="text-center mb-3 text-secondary">{selectedTransaction.id}</small>
                            </div>
                            <div className="d-flex form-group" style={{justifyContent:"center"}}>
                                {/* DATE */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="date">Transaction Date</label>
                                    <input type="date" value={selectedTransaction.date} onChange={(e)=>setSelectedTransaction({...selectedTransaction, date: e.target.value})} className="form-control bg-light text-dark" name="Transaction Date" required/>
                                </div>
                                {/* PAYMENT METHOD */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Mode">Transaction Mode</label>
                                    <select className="form-control bg-light text-dark" name="Transaction Mode"
                                    value={selectedTransaction.mode}
                                    onChange={(e)=>{setSelectedTransaction({...selectedTransaction,mode:e.target.value})}}
                                    required>
                                        <option value="UPI">UPI</option>
                                        <option value="CASH">CASH</option>
                                        <option value="CREDIT CARD">CREDIT CARD</option>
                                        <option value="DEBIT CARD">DEBIT CARD</option>
                                        <option value="NETBANKING">NETBANKING</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                    </select>
                                </div>
                            </div>
                            <div className="d-flex form-group mt-3" style={{justifyContent:"center"}}>
                                {/* AMOUNT */}
                                <div className="mx-2" style={{minWidth:"520px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Amount">Transaction Amount (₹ Rupee)</label>
                                    <input type="number" value={selectedTransaction.amount} onChange={(e)=>setSelectedTransaction({...selectedTransaction, amount: e.target.value})} className="form-control bg-light text-dark" min="1" name="Transaction Amount" placeholder="Amount" required />
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="d-flex mt-4 mb-4" style={{justifyContent:"center"}}>
                                    <button type="submit" className="btn btn-teal mx-2"><i className="bi bi-floppy2"></i> Update</button>
                                    <button type="button" className="btn btn-secondary mx-2" onClick={()=>{
                                        setShowTransactionUpdateForm(false);
                                        setSelectedTransaction(null);
                                    }}><i className="bi bi-skip-backward-btn"></i> Go Back</button>
                            </div>
                        </form>
                        </>}
                        
                        {/* New Transaction Form */}
                        {showNewTransactionForm === true && 
                        <>
                        <form onSubmit={(event)=>{
                            event.preventDefault();
                            setLoadingModal(true);
                            const body = newTransactionData;
                            const headers = {
                                "Authorization" : `Bearer ${authToken}`
                            }
                            axios.post(`${apiDomain}/admin/create-transaction`,body,{headers})
                            .then(res=>{
                                if (res.data.result === true){
                                    refreshAfterUpdatingTransaction(newTransactionData.email);
                                    setLoadingModal(false);
                                    setShowNewTransactionForm(false);
                                    setNewTransactionData({});
                                    setShowMessageBox({
                                        show: true,
                                        title: "Transaction Created",
                                        message: res.data.message
                                    })
                                }
                                else {
                                    setLoadingModal(false);
                                    setShowMessageBox({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                                }
                            })
                            .catch(error=>{
                                setLoadingModal(false);
                                    setShowMessageBox({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                            })
                            }}
                        >
                            <h4 className="text-center mt-5 mb-4">New Transaction</h4>
                            <div className="d-flex form-group" style={{justifyContent:"center"}}>
                                {/* DATE */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="date">Transaction Date</label>
                                    <input type="date" onChange={(e)=>setNewTransactionData({...newTransactionData, date: e.target.value})} className="form-control bg-light text-dark" name="Transaction Date" required/>
                                </div>
                                {/* PAYMENT METHOD */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Mode">Transaction Mode</label>
                                    <select className="form-control bg-light text-dark" name="Transaction Mode"
                                    onChange={(e)=>{setNewTransactionData({...newTransactionData,mode:e.target.value})}}
                                    required>
                                        <option value="" disabled selected hidden>Select Payment Mode</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CASH">CASH</option>
                                        <option value="CREDIT CARD">CREDIT CARD</option>
                                        <option value="DEBIT CARD">DEBIT CARD</option>
                                        <option value="NETBANKING">NETBANKING</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                    </select>
                                </div>
                            </div>
                            <div className="d-flex form-group mt-3" style={{justifyContent:"center"}}>
                                {/* AMOUNT */}
                                <div className="mx-2" style={{minWidth:"520px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Amount">Transaction Amount (₹ Rupee)</label>
                                    <input type="number" onChange={(e)=>setNewTransactionData({...newTransactionData, amount: e.target.value})} className="form-control bg-light text-dark" min="1" name="Transaction Amount" placeholder="Amount" required />
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="d-flex mt-4 mb-4" style={{justifyContent:"center"}}>
                                    <button type="submit" className="btn btn-teal mx-2"><i className="bi bi-magic"></i> Create</button>
                                    <button type="button" className="btn btn-secondary mx-2" onClick={()=>{
                                        setShowNewTransactionForm(false);
                                        setNewTransactionData({});
                                    }}><i className="bi bi-x-square"></i> Go Back</button>
                            </div>
                        </form>
                        </>
                        }
        </Modal.Body>
        </Modal>
        :
        <></>}
        </>)
    }

    // Modal To See and Update Client Complaints
    const getClientComplaintModal = () => {
        return (
        <>
        { showComplaintList === true ?
        <Modal show={showComplaintList===true} onHide={()=>{handleCloseClientComplaint()}} centered dialogClassName="custom-modal" backdrop="static" keyboard={false}>
            <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                <Modal.Title>
                    Client Issues
                </Modal.Title>
            </Modal.Header>
        <Modal.Body className="bg-white text-dark">
                        {/* Client Picture */}
                        <div className="d-flex" style={{justifyContent:"center"}}>
                            <img className="border p-1" width={"150px"} style={{borderRadius:"10px"}} src={`data:image/jpg;base64,${complaintListData.client_data.picture}`} alt={complaintListData.client_data.name} />
                        </div>
                        <div className="text-left">
                            <h5 className="mt-2 text-center">{complaintListData.client_data.name}</h5>
                            <p className="text-secondary text-center" style={{marginTop:"-5px"}}>{complaintListData.client_data.email}</p>
                            <p className="text-secondary text-center" style={{marginTop:"-18px"}}>{complaintListData.client_data.phone}</p>
                            <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>Tariff Plan: {complaintListData.client_data.plan_name} ₹{complaintListData.client_data.plan_cost} [{complaintListData.client_data.plan_validity} {complaintListData.client_data.validity_unit}]</p>
                        </div>

                        {/* Status Buttons */}
                        <div className="mt-4 d-flex mx-auto justify-content-center text-center" style={{width:"300px"}}>
                            {/* We Can Add Buttons Here */}
                            <button className={complaintStatus==="active" ? "btn rounded-0 w-100 fw-bold" : "btn rounded-0 w-100 border text-dark"}
                                style={complaintStatus==="active" ? {backgroundColor:"teal"} : {}}
                                onClick={(event)=>{
                                    handleSwitchComplaintStatus(event,complaintListData.client_data.email,"active");
                                }}
                                >Active Issues</button>


                            <button className={complaintStatus==="resolved" ? "btn rounded-0 w-100 fw-bold" : "btn rounded-0 w-100 border text-dark"}
                                style={complaintStatus==="resolved" ? {backgroundColor:"teal"} : {}}
                                onClick={(event)=>{
                                    handleSwitchComplaintStatus(event,complaintListData.client_data.email,"resolved");
                                }}
                                >Resolved Issues</button>
                        </div>

                        {/* Issue Listing */}
                        {complaintFound === false ? <>
                        {/* Complaint Not Found */}
                        <hr />
                        <div className="text-center mt-4" style={{justifyContent:"center"}}>
                        {complaintStatus === "active" ? <>
                        <svg height="150px" width="150px" viewBox="0 0 512 512" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="256.001" cy="256.001" r="245.994" fill="#FDDF6D" />
                            <path
                              d="M308.715,465.678c-135.858,0-245.993-110.134-245.993-245.993c0-72.584,31.443-137.816,81.444-182.842
                                 C64.527,77.562,10.007,160.414,10.007,256c0,135.858,110.134,245.993,245.993,245.993c63.274,0,120.962-23.898,164.549-63.149
                                 C386.996,455.999,348.987,465.678,308.715,465.678z"
                              fill="#FCC56B"
                            />
                            <path d="M291.792,421.175c-54.992,0-99.573-44.581-99.573-99.573h199.146C391.365,376.594,346.784,421.175,291.792,421.175z" fill="#7F184C" />
                            <path d="M246.294,189.863c-5.527,0-10.007-4.481-10.007-10.007c0-12.908-10.501-23.409-23.409-23.409c-12.908,0-23.409,10.502-23.409,23.409c0,5.527-4.481,10.007-10.007,10.007c-5.527,0-10.007-4.481-10.007-10.007c0-23.944,19.481-43.424,43.424-43.424s43.424,19.48,43.424,43.424C256.302,185.383,251.821,189.863,246.294,189.863z" fill="#7F184C" />
                            <path d="M415.317,189.863c-5.527,0-10.007-4.481-10.007-10.007c0-12.908-10.501-23.409-23.409-23.409c-12.908,0-23.409,10.502-23.409,23.409c0,5.527-4.481,10.007-10.007,10.007s-10.007-4.481-10.007-10.007c0-23.944,19.481-43.424,43.424-43.424c23.943,0,43.424,19.48,43.424,43.424C425.324,185.383,420.844,189.863,415.317,189.863z" fill="#7F184C" />
                            <path d="M150.288,240.771c-18.268,0-33.078,14.81-33.078,33.078h66.157C183.365,255.581,168.556,240.771,150.288,240.771z" fill="#F9A880" />
                            <path d="M438.814,236.339c-18.268,0-33.079,14.81-33.079,33.078h66.157C471.893,251.148,457.084,236.339,438.814,236.339z" fill="#F9A880" />
                            <path d="M216.514,321.602v15.543c0,6.554,5.313,11.866,11.866,11.866h126.822c6.554,0,11.866-5.313,11.866-11.866v-15.543H216.514z" fill="#F2F2F2" />
                            <path d="M293.883,379.866c-26.916-12.505-56.784-10.688-81.005,2.282c18.2,23.721,46.821,39.029,79.03,39.029c14.194,0,27.683-2.99,39.903-8.342C322.845,398.961,309.99,387.35,293.883,379.866z" fill="#FC4C59" />
                            <ellipse transform="matrix(0.2723 -0.9622 0.9622 0.2723 143.5045 346.5437)" cx="300.864" cy="78.396" rx="28.687" ry="51.37" fill="#FCEB88" />
                            <path d="M467.251,111.359c-28.582-41.669-68.35-73.705-115.002-92.647c-5.12-2.078-10.957,0.387-13.038,5.508c-2.079,5.121,0.387,10.957,5.508,13.038c43.005,17.461,79.669,47,106.025,85.423c26.978,39.332,41.24,85.432,41.24,133.319c0,130.124-105.862,235.985-235.985,235.985S20.015,386.122,20.015,256S125.876,20.015,256,20.015c5.527,0,10.007-4.481,10.007-10.007S261.527,0,256,0C114.84,0,0,114.84,0,256s114.84,256,256,256s256-114.84,256-256C512,204.053,496.526,154.037,467.251,111.359z" />
                            <path d="M189.468,179.856c0-12.908,10.502-23.409,23.409-23.409s23.409,10.502,23.409,23.409c0,5.527,4.481,10.007,10.007,10.007c5.527,0,10.007-4.481,10.007-10.007c0-23.944-19.48-43.424-43.424-43.424s-43.424,19.48-43.424,43.424c0,5.527,4.481,10.007,10.007,10.007C184.988,189.863,189.468,185.383,189.468,179.856z" />
                            <path d="M358.491,179.856c0-12.908,10.502-23.409,23.409-23.409c12.907,0,23.409,10.502,23.409,23.409c0,5.527,4.481,10.007,10.007,10.007s10.007-4.481,10.007-10.007c0-23.944-19.48-43.424-43.424-43.424c-23.944,0-43.424,19.48-43.424,43.424c0,5.527,4.481,10.007,10.007,10.007S358.491,185.383,358.491,179.856z" />
                            <path d="M182.211,321.602c0,60.423,49.157,109.58,109.58,109.58s109.58-49.157,109.58-109.58c0-5.527-4.481-10.007-10.007-10.007H192.218C186.692,311.594,182.211,316.075,182.211,321.602z M380.802,331.609c-4.992,44.695-43.006,79.558-89.011,79.558s-84.019-34.863-89.011-79.558L380.802,331.609L380.802,331.609z" />
                            <circle cx="310.868" cy="17.167" r="10.007" />
                        </svg>
                        </>
                        :
                        <>
                        <svg
                            height="150px"
                            width="150px"
                            viewBox="0 0 512 512"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#000000"
                        >
                            <circle fill="#FDDF6D" cx="256.002" cy="256.001" r="245.994" />
                            <path
                              fill="#FCC56B"
                              d="M308.715,465.677c-135.858,0-245.993-110.134-245.993-245.993 c0-72.584,31.443-137.816,81.444-182.842C64.528,77.562,10.008,160.414,10.008,256c0,135.858,110.134,245.993,245.993,245.993 c63.274,0,120.962-23.898,164.549-63.149C386.997,455.999,348.988,465.677,308.715,465.677z"
                            />
                            <circle fill="#FFFFFF" cx="213.157" cy="179.852" r="30.022" />
                            <circle fill="#FFFFFF" cx="382.188" cy="179.852" r="30.022" />
                            <path
                              d="M359.294,21.696c-5.056-2.231-10.964,0.057-13.198,5.114c-2.232,5.056,0.057,10.964,5.113,13.196 C436.727,77.76,491.985,162.543,491.985,256c0,130.124-105.862,235.985-235.984,235.985S20.015,386.122,20.015,256 S125.878,20.015,256.001,20.015c5.528,0,10.007-4.481,10.007-10.007S261.529,0,256.001,0c-141.158,0-256,114.84-256,256 s114.84,256,256,256c141.158,0,255.999-114.84,255.999-256C512.001,154.619,452.059,62.65,359.294,21.696z"
                            />
                            <path
                              d="M173.134,179.855c0,22.072,17.957,40.029,40.029,40.029s40.029-17.957,40.029-40.029s-17.957-40.029-40.029-40.029 S173.134,157.783,173.134,179.855z M233.179,179.855c0,11.036-8.979,20.015-20.015,20.015s-20.015-8.979-20.015-20.015 s8.979-20.015,20.015-20.015C224.2,159.84,233.179,168.819,233.179,179.855z"
                            />
                            <path
                              d="M422.216,179.855c0-22.072-17.957-40.029-40.029-40.029s-40.029,17.957-40.029,40.029s17.957,40.029,40.029,40.029 S422.216,201.927,422.216,179.855z M362.172,179.855c0-11.036,8.979-20.015,20.015-20.015s20.015,8.979,20.015,20.015 s-8.979,20.015-20.015,20.015S362.172,190.891,362.172,179.855z"
                            />
                            <circle cx="322.437" cy="20.015" r="10.007" />
                        </svg>
                        </>}
                        <p className="mt-4" style={{fontSize:"20px"}}>No {complaintStatus === "active" ? "Active" : "Resolved"} Complaints <br /> Found For This Client</p>
                        </div>
                        </>:
                        // Complaint Found
                        <>
                        <hr />
                        <p className="text-center">Total {complaintStatus === "active" ? "Active" : "Resolved"} Complaints: {complaintListData.complaint_data.length}</p>
                        <div className="d-flex mt-4 px-4">
                            <table className="table table-light table-striped table-borderd px-5" style={{minWidth:"400px",borderRadius:"10px",overflow:"hidden"}}>
                                <thead>
                                    <tr>
                                        <th scope="col" className="text-light" style={{backgroundColor:"teal",width:"30px",textAlign:"center"}}>#</th>
                                        <th scope="col" className="text-light" style={{backgroundColor:"teal",width:"100px",textAlign:"center"}}>Date</th>
                                        <th scope="col" className="text-light" style={{backgroundColor:"teal",width:"180px",textAlign:"center"}}>Subject</th>
                                        <th scope="col" className="text-light" style={{backgroundColor:"teal",width:"50px",textAlign:"center"}}>Open</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaintListData.complaint_data.map((item,index_number)=>{
                                        return (
                                            <tr key={item.issue_no} style={{fontSize:"15px"}}>
                                                {/* Serial Number */}
                                                <td scope="row" style={{width:"30px",textAlign:"center", color:complaintStatus === "resolved" ? "green" : "black"}}>{index_number+1}</td>

                                                {/* Date */}
                                                <td style={{width:"100px",textAlign:"center", color:complaintStatus === "resolved" ? "green" : "black"}}>{item.issue_date}</td>

                                                {/* Subject */}
                                                <td style={{width:"180px",textAlign:"center", color:complaintStatus === "resolved" ? "green" : "black"}}>{item.issue_title}</td>

                                                {/* Actions */}
                                                <td style={{width:"50px",textAlign:"center"}}>
                                                    {/* Show Complaint Info Button */}
                                                    <a title="Detailed View" className="btn btn-light text-blue mx-1" 
                                                        onClick={()=>{
                                                        setShowDetailedView({...item, ...complaintListData.client_data});
                                                        }}
                                                    style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-eye-fill"></i></a>
                                                </td>
                                            </tr>
                                            )
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                        </>}
        </Modal.Body>
        </Modal>
        :
        <></>}
        </>)
    }

    // Modal For Showing ComplaintDetail
    const complaintDetailModal = () => {
        return (<>
        {showDetailedView != null && <>
        <Modal style={{backgroundColor:"rgba(0,0,0,0.8)"}} show={showDetailedView!=null} onHide={()=>setShowDetailedView(null)} centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                <Modal.Title>
                    Complaint Description
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
                <div className="d-flex justify-content-center">
                    <img className="rounded-3" width={150} src={`data:image/jpeg;base64,${showDetailedView.picture}`} />
                </div>
                <div className="mt-1 block text-center">
                    <p className="fw-bold" style={{fontSize:"18px"}}>{showDetailedView.name}</p>
                    <p style={{marginTop:"-18px"}}>{showDetailedView.email}</p>
                    <p style={{marginTop:"-18px"}}>{showDetailedView.phone}</p>
                </div>
                <p className="fw-bold" style={complaintStatus === "active" ? {color:"darkred"} : {color:"green"}}><span style={{fontWeight:"bold",color:"black"}}>Status: </span> <br />{complaintStatus === "active" ? "Not Resolved" : "Resolved"}</p>
                <p><span style={{fontWeight:"bold"}}>Subject: </span><input className="form-control bg-light text-dark mt-1" value={showDetailedView.issue_title} type="text" readOnly></input></p>
                <p><span style={{fontWeight:"bold"}}>Message: </span><textarea className="form-control bg-light text-dark mt-1" value={showDetailedView.issue_content} readOnly></textarea></p>
            </Modal.Body>
            <Modal.Footer className="bg-light text-dark">
                <button onClick={()=>{
                    setShowDetailedView(null);
                    setLoadingModal(true);

                    // Calling API To Change Complaint Status
                    const body = {
                        email:showDetailedView.email,
                        issue_status: showDetailedView.issue_status===true ? false : true,
                        issue_no: showDetailedView.issue_no
                    };

                    const headers = {
                        'Authorization':`Bearer ${authToken}`
                    };
                    
                    axios.put(`${apiDomain}/admin/complaints`,body,{headers})
                    .then(res => {
                        setLoadingModal(false);
                        if (res.data.result === true){
                            handleRefreshComplaintList();
                            setShowMessageBox({show:true,title:"Server Response",message:res.data.message});
                        }
                        else {
                            setShowMessageBox({show:true,title:"Server Response",message:"Server Rejected Your Request :("});
                        }
                    })
                    .catch(error=>{
                        setLoadingModal(false);
                        setShowMessageBox({show:true,title:"Server Response",message:"Server Rejected Your Request :("});
                    })

                }} className={ complaintStatus === "active" ? "btn btn-light text-success border-success fw-bold" : "btn btn-light text-danger border-danger fw-bold" }>{ complaintStatus === "active" ? <><i className="bi bi-emoji-laughing"></i> Mark Resolved</> : <><i className="bi bi-emoji-frown"></i> Mark Not Resolved</> }</button>
                {/* DELETE BUTTON */}
                <button onClick={()=>{
                    const body = {
                        email:showDetailedView.email,
                        issue_no: showDetailedView.issue_no
                    };
                    setShowDeleteConfirmModel(body);
                }} className="btn btn-danger" hidden={complaintStatus === "active"}><i className="bi bi-trash3"></i> Delete</button>
                <button className="btn btn-secondary" onClick={()=>setShowDetailedView(null)}><i className="bi bi-x-square-fill"></i> Close</button>
            </Modal.Footer>
        </Modal>
        </>}
        </>)
    }

    // Modal For Complaint Delete Confirmation
    const deleteConfirmModel = () => {
        return <>
            { showDeleteConfirmModel != null ?
            <Modal centered show={showDeleteConfirmModel != null} style={{backgroundColor:"rgba(0, 0, 0, 0.9)"}} onHide={()=>setShowDeleteConfirmModel(null)} backdrop="static" keyboard={false}>
                        <Modal.Header style={{backgroundColor:"teal"}}>
                            <Modal.Title>Delete Confirmation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <h3 className="fw-bold">This action cannot be undone.</h3>
                            <p>Are you sure you want to delete this complaint?</p>
                            
                        </Modal.Body>
                        <Modal.Footer className="bg-light text-dark">
                            <button onClick={()=>{
                                // Show Loading
                                setLoadingModal(true);
                                axios.delete(`${apiDomain}/admin/complaints`,{data:showDeleteConfirmModel,headers:{"Authorization":`Bearer ${authToken}`}})
                                .then(res=>{
                                    if (res.data.result === true){
                                        setLoadingModal(false);
                                        setShowDeleteConfirmModel(null);
                                        setShowDetailedView(null);
                                        handleRefreshComplaintList();
                                        setShowMessageBox({show:true,title:"Server Response",message:res.data.message});
                                    }
                                    else {
                                        setLoadingModal(false);
                                        setShowDeleteConfirmModel(null);
                                        setShowMessageBox({show:true,title:"Error Occured",message:"Server Rejected Your Request :("});
                                    }
                                })
                                .catch(error=>{
                                    console.error(error);
                                    setLoadingModal(false);
                                    setShowDeleteConfirmModel(null);
                                    setShowMessageBox({show:true,title:"Error Occured",message:"Server Rejected Your Request :("});
                                })
                            }} className="btn btn-danger"><i className="bi bi-trash3"></i> Delete Permanently</button>
                            <button onClick={()=>setShowDeleteConfirmModel(null)} className="btn btn-secondary"><i className="bi bi-x-square-fill"></i> Cancel</button>
                        </Modal.Footer>
            </Modal>
            :
            <></>
            }
            </>
    }

    // Modal For Delete Confirmation of Transaction
    const transactionDeleteConfirmModal = () => {
        return (
        <Modal centered show={showTransactionDeleteConfirm!=null} onHide={()=>setShowTransactionDeleteConfirm(null)} style={{backgroundColor:"rgba(0, 0, 0, 0.8)"}} backdrop='static' keyboard={false}>
            <Modal.Header style={{backgroundColor:"teal"}}>
            <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
                <h3 className="fw-bold">This action cannot be undone</h3>
                <p>You're about to delete a transaction.</p>
                <div className="d-flex" style={{justifyContent:"flex-end"}}>
                    <button type="button" onClick={()=>{
                        handleDeleteTransaction(showTransactionDeleteConfirm.id,showTransactionDeleteConfirm.email);
                    }} className="btn btn-danger mx-2"><i className="bi bi-trash3"></i> Delete</button>

                    <button type="button" onClick={()=>setShowTransactionDeleteConfirm(null)} className="btn btn-secondary mx-2"><i className="bi bi-x-circle"></i> Cancel</button>
                </div>
            </Modal.Body>
        </Modal>
        )
    }

    const messageBoxModal = () => {
        return (<>
        <Modal 
        show={showMessageBox.show === true && showMessageBox.hasOwnProperty("title") && showMessageBox.hasOwnProperty("message")}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }} 
        onHide={()=>{
            refreshClientList();
            setShowMessageBox({show:false,title:"",message:""}
            )}} 
        backdrop="static" 
        keyboard={false}
        centered
        >
            <Modal.Header closeButton className="text-light" style={{backgroundColor:"teal"}}>
                <Modal.Title>{showMessageBox.title}</Modal.Title>
            </Modal.Header>
        <Modal.Body className="bg-light text-dark">
            <p>
                {showMessageBox.message}
            </p>
            <div className="d-flex" style={{justifyContent:"flex-end"}}>
                <button className="btn btn-secondary" onClick={()=>{
                    refreshClientList();
                    setShowMessageBox({show:false,title:"",message:""});
                    }}><i className="bi bi-x-square-fill"></i> Close</button>
            </div>
        </Modal.Body>
        </Modal>
        </>)
    }

    const handleShowCreateClient = () => {
        setLoadingModal(true);
        const headers = {'Authorization':`Bearer ${authToken}`};
        axios.get(`${apiDomain}/admin/tariff`,{headers})
        .then(res=>{
            if (res.data.result === true){
                setLoadingModal(false);
                // Plans Found
                setTariffPlanList(res.data.data);
                // Opening Create Client Modal
                setShowWhichModal("create-client-modal");
            }
            else {
                setLoadingModal(false);
                setShowMessageBox({show:true,title:"No Tariff Plans Found",message:"Failed!, You need atleast one Tariff Plan which will be assigned to the client."});
            }
        })
        .catch(error=>{
            setLoadingModal(false);
            setShowMessageBox({show:true,title:"Connection Error",message:"Please Check Your Internet Connection or Try Later."});
        })

    }

    if (clientData === "loading") {
        return <Spinner />
    }

    else if (clientData === "error") {
        return(
            <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginLeft:"20vh",marginTop:"200px" }}>
        <div className="text-center">
          <i className="bi bi-wifi-off text-dark" style={{ fontSize: '8rem', color: 'gray' }}></i>
          <h2 className="mt-3">Server Not Accessible</h2>
          <p className="text-dark">Please check your internet connection or try again later.</p>
        </div>
    </div>)}

    else if(clientData === null) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
                <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
                    <div className="text-center">
                        <i className="bi bi-person-exclamation text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
                        <h2 className="mt-3 text-light">No Clients Found</h2>
                        <p className="text-light">It seems like there are no clients available in the database.</p>
                        <button onClick={()=>{
                                            handleShowCreateClient();
                                            }} className="btn btn-light fw-bold border text-dark">
                            <i className="bi bi-person-fill-add"></i> Create New Client
                        </button>
                    </div>
                </div>
            </div>
            {getCreateClientModal()}
            {messageBoxModal()}
            </>
        )
    }

    else if(clientData != null) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
                <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                    <div className="card dark-gradient w-50">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Client Management</h5>
                            <p className="card-text">Total Clients: {clientData.length}</p>
                        </div>
                    </div>
                </div>
                <div className="d-flex px-4" style={{minWidth:"900px",justifyContent: "center"}}>
                    <input className="bg-light text-dark px-3 rounded py-2" value={searchValue === null ? "" : searchValue} onChange={(event)=>setSearchValue(event.target.value)} style={{width:"700px", border:"solid", borderWidth:"1px"}} type="text" placeholder="Search" />
                    <button className="btn btn-light fw-bold border-dark mx-2" onClick={()=>{
                        handleShowCreateClient()
                    }}><i className="bi bi-person-plus-fill"></i> Add New Client</button>
                </div>
                <div className="custom-scrollwheel mb-4" style={{height:"610px",overflowY:"auto",overflowX:"hidden"}}>
                <div className="d-flex mt-3 px-4" style={{minWidth:"900px",height:"auto"}}>
                    <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1300px",borderRadius:"10px"}}>
                        <thead className="bg-dark border-dark">
                            <tr>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"80px",textAlign:"center"}}>#</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Name</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"70px",textAlign:"center"}}>Gender</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>City</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Tariff Plan</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"80px",textAlign:"center"}}>Plan Cost</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"80px",textAlign:"center"}}>Transactions</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"130px",textAlign:"center"}}>Phone</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Email</th>
                              <th scope="col" className="bg-dark border-secondary text-white" style={{width:"140px",textAlign:"center"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientData.map(item=>{
                                count+=1;
                                let target = `${item.name} ${item.email} ${item.phone}`.toLowerCase();
                                if (searchValue===null || searchValue==="" || target.includes(searchValue.toLowerCase())){
                                    return (
                                        <tr key={item.email} style={{fontSize:"15px"}}>
                                            {/* Serial Number */}
                                            <td scope="row" style={{width:"80px",textAlign:"center"}}>{count}</td>

                                            {/* Name */}
                                            <td style={{width:"150px",textAlign:"center"}}>{item.name}</td>

                                            {/* Gender */}
                                            <td style={{width:"70px",textAlign:"center"}}>{item.gender}</td>

                                            {/* City */}
                                            <td style={{width:"100px",textAlign:"center"}}>{item.city}</td>

                                            {/* Tariff Plan Name */}
                                            <td style={{width:"120px",textAlign:"center"}}>{item.plan_name}</td>

                                            {/* Tariff Plan Cost */}
                                            <td style={{width:"80px",textAlign:"center"}}>₹ {item.plan_cost}</td>

                                            {/* Transaction Count For Each User */}
                                            <td style={{width:"80px",textAlign:"center"}}>{item.user_transaction_count}</td>

                                            {/* Phone */}
                                            <td style={{width:"130px",textAlign:"center"}}>{item.phone}</td>

                                            {/* Email */}
                                            <td style={{width:"150px",textAlign:"center"}}>{item.email}</td>

                                            {/* Actions */}
                                            <td style={{width:"140px",textAlign:"center"}}>
                                                <a title="Profile" onClick={(event)=>{handleShowClientDetailButton(event,item.email)}} className="btn btn-light border-dark text-primary mx-1" style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"22px"}} className="bi bi-person-fill"></i></a>
                                                <a title="Transactions" onClick={(event)=>{handleShowClientTransaction(event,item)}} className="btn btn-light border-dark text-success mx-1" style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"22px"}} className="bi bi-currency-rupee"></i></a>
                                                <a title="Complaints" onClick={(event)=>{handleShowClientComplaints(event,item)}} className="btn btn-light border-dark text-danger mx-1" style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"22px"}} className="bi bi-emoji-frown"></i></a>
                                            </td>
                                        </tr>
                                    )}
                                else {return null}

                            })}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
            {getCreateClientModal()}
            {getClientProfileModal()}
            {getClientTransactionModal()}
            {messageBoxModal()}
            {transactionDeleteConfirmModal()}
            {getClientComplaintModal()}
            {complaintDetailModal()}
            {deleteConfirmModel()}
            </>
        )
    };
}