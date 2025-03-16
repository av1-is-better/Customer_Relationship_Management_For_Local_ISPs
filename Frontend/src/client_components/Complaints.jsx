import { useState, useEffect } from "react"
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

export default function Complaints({apiDomain,authToken}){
    const [ complaintCount, setComplaintCount ] = useState(0); // for storing complaint count
    const [ complaintList, setComplaintList ] = useState(null); // for storing complaint data fetched via api
    const [ complaintType, setComplaintType ] = useState("active"); // for active/resolved complaint switching

    const [ showLoadingModal, setShowLoadingModal ] = useState(false);
    const [ showMessageModal, setShowMessageModal ] = useState({show:false,type:"",title:"",message:""});

    // State for showing delete confirmation modal
    const [ showDeleteConfirmationModal,  setShowDeleteConfirmationModal ] = useState(null);
    
    // State for showing update modal
    const [ showUpdateModal, setShowUpdateModal ] = useState(null);
    
    const [ spinner, setSpinner ] = useState(true);
    const [ serverError, setServerError ] = useState(false);

    const [hasMore, setHasMore] = useState(true); // Determines if more data is available
    const [offset, setOffset] = useState(0); // Tracks pagination offset
    const limit = 10; // Number of announcements to load per request

    useEffect(()=>{
        setSpinner(true);
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/complaints`,{params:{limit:limit,offset:offset,status:complaintType}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Complaint Count
                if (complaintCount != res.data.data[0].complaint_count){
                    setComplaintCount(res.data.data[0].complaint_count);
                }
                
                // Check if all complaints have been loaded
                if (res.data.data.length >= res.data.data[0].complaint_count) {
                    setHasMore(false);
                }

                // Announcement Found
                setComplaintList(res.data.data);
                // console.log(res.data.data);
                
                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);
                
                // Stopping Spinner
                setSpinner(false);
            }
            // Complaint Not Found
            else {
                setComplaintList(null);
                setSpinner(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Complaints '+error);
            setServerError(true);
            setSpinner(false);
        })
    },[complaintType])

    // Function For Fetching More Complaints For Scroll Pagination
    const fetchComplaints = () => {
        // Showing Loading Modal
        setShowLoadingModal(true);
        // API Request Headers
        const headers = {'Authorization': `Bearer ${authToken}`}
        // Making API Request
        axios.get(`${apiDomain}/client/complaints`,{params:{limit:limit,offset:offset,status:complaintType}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Complaint Count
                if (complaintCount != res.data.data.complaint_count){
                    setComplaintCount(res.data.data.complaint_count);
                }

                // Check if all complaints have been loaded
                if (complaintList.length + res.data.data.length >= res.data.data.complaint_count) {
                    setHasMore(false);
                }

                // Complaints Found
                setComplaintList((prevComplaint) => [
                    ...prevComplaint,
                    ...res.data.data,
                ]);

                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);

                // Stopping Loading
                setShowLoadingModal(false);
            }
            // Complaints Not Found
            else {
                setShowLoadingModal(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Complaints '+error);
            setShowMessageModal({show:true,type:"error",title:"Server Error Occured",message:"Please Check Your Internet Connection or Try Again Later."});
            setShowLoadingModal(false);
        })
    };

    // Function to Refresh Complaint List
    const refreshComplaints = () => {
        setSpinner(true);
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/complaints`,{params:{limit:limit,offset:offset,status:complaintType}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Complaint Count
                if (complaintCount != res.data.data[0].complaint_count){
                    setComplaintCount(res.data.data[0].complaint_count);
                }
                
                // Check if all complaints have been loaded
                if (res.data.data.length >= res.data.data[0].complaint_count) {
                    setHasMore(false);
                }

                // Announcement Found
                setComplaintList(res.data.data);
                // console.log(res.data.data);
                
                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);
                
                // Stopping Spinner
                setSpinner(false);
            }
            // Complaint Not Found
            else {
                setComplaintList(null);
                setSpinner(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Complaints '+error);
            setServerError(true);
            setSpinner(false);
        })
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !showLoadingModal) {
            fetchComplaints();
        }
    };

    const loadingModal = () => {
        
        return showLoadingModal === true ? <> 
                <Modal centered show={showLoadingModal === true} backdrop="static" keyboard={false}
                dialogClassName="modal-content-custom profile-modal"
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                <Modal.Header style={{backgroundColor:"#003546",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                    <Modal.Title>Fetching Data</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{backgroundColor:"white",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <center>
                    <div className="spinner-border" role="status">
                        <span className="sr-only" hidden>Loading...</span>
                    </div>
                    </center>
                </Modal.Body>
                </Modal>
                </>
                :
                <></>        
    }

    const messageModal = () => {
        
        return showMessageModal.show === true ? <> 
                <Modal 
                    centered 
                    show={showMessageModal.show === true && showMessageModal.hasOwnProperty("title") && showMessageModal.hasOwnProperty("message")} 
                    dialogClassName="modal-content-custom profile-modal"
                    onHide={()=>{
                        setShowMessageModal({show:false,title:"",message:""});
                        if (showMessageModal.type === "success"){
                            refreshComplaints();
                        }
                    }}
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                    <Modal.Header style={{
                                        backgroundColor: showMessageModal.type === "error" ? "red" : "#003546", 
                                        borderTopLeftRadius:"1rem", 
                                        borderTopRightRadius:"1rem"
                                        }}
                    closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"white",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <p>{showMessageModal.message}</p>
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary" onClick={()=>{
                            setShowMessageModal({show:false,title:"",message:""});
                            if (showMessageModal.type === "success"){
                                refreshComplaints();
                            }
                        }}><i className="bi bi-x-square"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const DeleteConfirmationModal = () => {
        if (showDeleteConfirmationModal != null){
            return ( <>
                    <Modal
                    show={showDeleteConfirmationModal != null}
                    onHide={()=>{
                        setShowDeleteConfirmationModal(null);
                    }}
                    centered
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                    backdrop="static"
                    keyboard={false}
                    dialogClassName="profile-modal"
                    >
                        <Modal.Header className="bg-danger text-light" closeButton>
                            <Modal.Title>Confirm Deletion</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <h3 className="fw-bold">This action is irreverible</h3>
                            <p style={{marginTop:"-1px"}}>You're about to delete this complaint.</p>
                            <div className="d-flex" style={{justifyContent:"flex-end"}}>
                                <button type="button" className="btn btn-danger text-light mx-1" onClick={()=>deleteComplaint(showDeleteConfirmationModal)}><i className="bi bi-trash3"></i> Delete</button>
                                <button type="button" className="btn btn-secondary text-light mx-1" onClick={()=>setShowDeleteConfirmationModal(null)}><i className="bi bi-x-square"></i> Cancel</button>
                            </div>
                        </Modal.Body>
                    </Modal>
                </>)
        }
    }

    const UpdateComplaintModal = () => {
        if (showUpdateModal != null){
            return ( <>
                    <Modal
                    show={showUpdateModal != null}
                    onHide={()=>{
                        setShowUpdateModal(null);
                    }}
                    centered
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                    backdrop="static"
                    keyboard={false}
                    dialogClassName="profile-modal"
                    >
                        <Modal.Header className="bg-teal text-light" closeButton>
                            <Modal.Title><i className="bi bi-pencil-square"></i> Edit Complaint</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <form onSubmit={(event)=>{
                                    // calling update complaint API
                                    event.preventDefault();
                                    setShowLoadingModal(true);
                                    const body = {
                                        issue_no: showUpdateModal.issue_no,
                                        subject: event.target[0].value,
                                        complaint: event.target[1].value
                                    };
                                    const headers = {"Authorization": `Bearer ${authToken}`};
                                    axios.put(`${apiDomain}/client/complaints`,body,{headers})
                                    .then(res => {
                                        if (res.data.result === true){
                                            // Complaint Updated Successfully
                                            setShowLoadingModal(false);
                                            setShowUpdateModal(null);
                                            setComplaintCount(0);
                                            setComplaintList(null);
                                            setHasMore(true);
                                            setOffset(0);
                                            setShowMessageModal({
                                                show:true,
                                                type:"success",
                                                title:"Complaint Modified",
                                                message:res.data.message
                                            });
                                        }
                                        else {
                                            // error occured
                                            setShowLoadingModal(false);
                                            setShowMessageModal({
                                                show:true,
                                                type:"error",
                                                title:"Error Occured",
                                                message:"Please check your internet connection or try again later :("
                                            });
                                        }
                                    })
                                    .catch(error=>{
                                        setShowLoadingModal(false);
                                        setShowMessageModal({
                                            show:true,
                                            type:"error",
                                            title:"Error Occured",
                                            message:"Please check your internet connection or try again later :("
                                        });
                                        console.error("Error occured during editing a complaint"+error);
                                    })
                            }}>
                                {/* Subject Input */}
                                <div className="mb-3 mt-4" style={{textAlign:"left"}}>
                                  <label htmlFor="subject" className="form-label mx-1 text-dark">Subject</label>
                                  <input type="text" defaultValue={showUpdateModal.subject} className="form-control bg-light text-dark" placeholder="Enter the subject" required />
                                </div>
                                {/* Complaint Details */}
                                <div className="mb-3" style={{textAlign:"left"}}>
                                  <label htmlFor="details" className="form-label mx-1 text-dark">Complaint Details</label>
                                  <textarea defaultValue={showUpdateModal.complaint} className="form-control bg-light text-dark" rows="12" placeholder="Describe your complaint" required></textarea>
                                </div>
                                {/* Submit Button */}
                                <div className="d-flex text-center" style={{justifyContent:"center"}}>
                                  <button type="submit" className="btn btn-teal mx-1"><i className="bi bi-floppy2"></i> Save Changes</button>
                                  <button type="button" className="btn btn-secondary mx-1" onClick={()=>setShowUpdateModal(null)}><i className="bi bi-x-square"></i> Cancel</button>
                                </div>
                            </form>
                        </Modal.Body>
                    </Modal>
                </>)
        }
    }

    // function for changing complaint type (active/resolved)
    const switchComplaintType = (type) => {
        if (type === complaintType) {
            // Do Nothing
        }
        else if (type === "active") {
            // Change Complaint Type To Active
            setComplaintCount(0);
            setComplaintList(null);
            setHasMore(true);
            setOffset(0);
            setComplaintType("active");
        }
        else if (type === "resolved") {
            // Change Complaint Type To Resolved
            setComplaintCount(0);
            setComplaintList(null);
            setHasMore(true);
            setOffset(0);
            setComplaintType("resolved");
        }
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

    const deleteComplaint = (issue_no) => {
        setShowDeleteConfirmationModal(null);
        setShowLoadingModal(true);
        axios.delete(`${apiDomain}/client/complaints`,{
            params:{ "issue_no":issue_no },
            headers:{ "Authorization": `Bearer ${authToken}` }
        })
        .then(res=>{
            if (res.data.result === true) {
                setShowLoadingModal(false);
                setShowDeleteConfirmationModal(null);
                setComplaintCount(0);
                setComplaintList(null);
                setHasMore(true);
                setOffset(0);
                setShowMessageModal({
                                        show:true,
                                        type:"success",
                                        title:"Complaint Deleted",
                                        message:res.data.message
                                    });
            }
            else {
                setShowLoadingModal(false);
                setShowMessageModal({
                                        show:true,
                                        type:"error",
                                        title:"Error Occured",
                                        message:"Check your internet connection or try again later :("
                                    });
            }
        })
        .catch(error=>{
            setShowLoadingModal(false);
            setShowMessageModal({
                                    show:true,
                                    type:"error",
                                    title:"Error Occured",
                                    message:"Check your internet connection or try again later :("
                                    });
            console.error("Error occured during deleting client complaint",error);
        })
    }

    if (spinner) {
        return <Spinner />
    }

    else if (serverError === true ){ 
        return(
          <>
          <div className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="text-center" style={{marginTop:"150px"}}>
                    <i className="bi bi-wifi-off text-light" style={{ fontSize: '100px', color: 'gray' }}></i>
                    <h4 className="px-1 text-light">Server Not Accessible!</h4>
                    <p className="text-light">Please check your internet connection<br/>or try again later.</p>
                </div>
            </div>
          </>
    )}

    else {
        return <>
        <div onScroll={handleScroll} className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="d-flex w-100" style={{width:"350px"}}>
                    <button className={complaintType === "active" ? "btn btn-dark--client-complaint fw-bold w-100 border-0 rounded-0" : "btn btn-secondary w-100 border-0 rounded-0"} onClick={()=>switchComplaintType("active")}><i className="bi bi-file-earmark-post"></i> Complaint</button>
                    <button className={complaintType === "resolved" ? "btn btn-dark--client-complaint fw-bold w-100 border-0 rounded-0" : "btn btn-secondary w-100 border-0 rounded-0"} onClick={()=>switchComplaintType("resolved")}><i className="bi bi-clock-history"></i> Resolved</button>
                </div>

                {/* Resolved complaint count */}
                {complaintList != null && complaintType === "resolved" && 
                    <div className="container-fluid mt-3 bg-dark rounded-2" style={{width:"250px"}}>
                        <p className="fw-bold text-center py-2">Resolved Complaints: {complaintCount}</p>
                    </div>
                }

                {/* Active complaint count */}
                {/* {complaintList != null && complaintType === "active" && 
                    <div className="container-fluid mt-4 bg-dark rounded-2 mb-3" style={{width:"250px"}}>
                        <p className="fw-bold text-center py-2">Active Complaint: {complaintCount}</p>
                    </div>
                } */}

                {/* When there is no active complaint */}
                {complaintList === null && complaintType === "active" && 
                    <div className="container-fluid text-center w-100" style={{marginTop:"10px"}}>
                        <p className="text-light fw-bold bg-dark rounded-2 py-2" style={{fontSize:"21px" ,marginTop:"20px"}}>Complaint Form</p>
                        {/* 
                        █▀▀ █▀█ █▀▄▀█ █▀█ █░░ ▄▀█ █ █▄░█ ▀█▀   █▀▀ █▀█ █▀█ █▀▄▀█
                        █▄▄ █▄█ █░▀░█ █▀▀ █▄▄ █▀█ █ █░▀█ ░█░   █▀░ █▄█ █▀▄ █░▀░█ */}
                        <form onSubmit={(event)=>{
                            // write submit function here
                            event.preventDefault();
                            setShowLoadingModal(true);
                            const body = {
                                subject:event.target[0].value,
                                complaint:event.target[1].value
                            };
                            const headers = {"Authorization": `Bearer ${authToken}`};
                            axios.post(`${apiDomain}/client/complaints`,body,{headers})
                            .then(res => {
                                if (res.data.result === true){
                                    // Complaint Successfully Created
                                    setShowLoadingModal(false);
                                    setComplaintCount(0);
                                    setComplaintList(null);
                                    setHasMore(true);
                                    setOffset(0);
                                    refreshComplaints();
                                }
                                else {
                                    // error occured
                                    setShowLoadingModal(false);
                                    setShowMessageModal({
                                        show:true,
                                        type:"error",
                                        title:"Error Occured",
                                        message:"Please check your internet connection or try again later :("
                                    });
                                }
                            })
                            .catch(error=>{
                                setShowLoadingModal(false);
                                console.error("Error occured during filing a complaint"+error);
                            })
                        }}>
                            {/* Subject Input */}
                            <div className="mb-3 mt-3" style={{textAlign:"left"}}>
                              <label htmlFor="subject" className="form-label mx-1 text-light">Subject</label>
                              <input type="text" className="form-control bg-light text-dark" placeholder="Enter the subject" required />
                            </div>
                            {/* Complaint Details */}
                            <div className="mb-3" style={{textAlign:"left"}}>
                              <label htmlFor="details" className="form-label mx-1 text-light">Complaint Details</label>
                              <textarea className="form-control bg-light text-dark" rows="12" placeholder="Describe your complaint" required></textarea>
                            </div>
                            {/* Submit Button */}
                            <div className="text-center">
                              <button type="submit" className="btn btn-dark"><i className="bi bi-cloud-arrow-up-fill"></i> Submit Complaint</button>
                            </div>
                        </form>
                    </div>
                }

                {/* When there is no resolved complaint */}
                {complaintList === null && complaintType === "resolved" && 
                    <div className="d-flex text-center" style={{justifyContent:"center"}}>
                        <div className="container-fluid text-center w-100" style={{marginTop:"125px"}}>
                            <i style={{fontSize:"100px"}} className="bi bi-database-exclamation text-light"></i>
                            <h2 className="text-light">Nothing Here!</h2>
                            <div className="d-flex" style={{justifyContent:"center"}}>
                            <p className="text-center text-light" style={{width:"250px"}}>Once the Complaint is Resolved, You Can See it Here.</p>
                            </div>
                        </div>
                    </div>
                }

                
                
                {/* Listing Resolved Complaints */}
                {complaintList != null && complaintType === "resolved" && Array.isArray(complaintList) && complaintList.map((item,index)=>{
                    return (
                        <div className={index === 0 ? "d-flex" : "d-flex mt-3"} style={{justifyContent:"center"}} key={index}>
                        <div className="bg-dark rounded-4 d-flex w-100 position-relative" style={{maxWidth:"320px",justifyContent:"flex-start", height:"490px"}}>
                            <div className="bg-dark text-light rounded-4" style={{width:"420px",overflowX:"hidden"}}>
                                <div className="bg-dark text-light text-center rounded-4 w-100" >
                                    <div className="bg-dark rounded-4 w-100">
                                        <p className="py-2 mt-2 text-light text-center fw-bold px-3" style={{overflowWrap:"break-word", fontSize:"18px"}}>{item.issue_title}</p>
                                        <p className="py-1 text-light" style={{marginTop:"-30px"}}>{`${formatDate(item.issue_timestamp)} ${formatTime(item.issue_timestamp)}`}</p>
                                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                                            <p className="bg-success text-light fw-bold text-center" style={{width:"210px", marginTop:"-15px"}}>COMPLAINT RESOLVED</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex" style={{justifyContent:"center"}}>
                                    <textarea rows={13} className="mt-1 mx-2 form-control bg-light text-dark border-0 rounded-1 custom-scrollwheel" style={{maxWidth:"310px", overflowY:"scroll",marginTop:"-5px", fontFamily:"helvetica"}} defaultValue={item.issue_content} readOnly></textarea>
                                </div>
                            </div>
                        </div>
                        </div>
                    )
                })}

                {/* Listing Active Complaints */}
                {complaintList != null && complaintType === "active" && Array.isArray(complaintList) && complaintList.map((item,index)=>{
                    return (
                        <div className="d-flex" style={{justifyContent:"center"}} key={index}>
                        <div className="mt-3 rounded-2 bg-dark d-flex w-100 position-relative" style={{maxWidth:"320px",justifyContent:"flex-start"}}>
                            <div className="bg-dark text-light rounded-2" style={{width:"400px",overflowX:"hidden"}}>
                                <div className="bg-dark text-light text-center rounded-2 w-100" >
                                    <div className="bg-dark rounded-2 w-100">
                                        <p className="py-2 mt-2 text-light text-center fw-bold px-3" style={{overflowWrap:"break-word", fontSize:"18px"}}>{item.issue_title}</p>
                                        <p className="py-1 text-light" style={{marginTop:"-30px"}}>{`${formatDate(item.issue_timestamp)} ${formatTime(item.issue_timestamp)}`}</p>
                                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                                            <p className="bg-warning text-dark fw-bold text-center" style={{width:"220px", marginTop:"-15px"}}>COMPLAINT SUBMITTED</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex" style={{justifyContent:"center"}}>
                                    <textarea rows={15} className="mt-1 mx-2 form-control bg-light text-dark border-0 rounded-1 custom-scrollwheel" style={{maxWidth:"300px", overflowY:"scroll",marginTop:"-13px", fontFamily:"helvetica"}} defaultValue={item.issue_content} readOnly></textarea>
                                </div>
                                <div className="mt-1 bg-dark text-light text-center px-3 py-1">
                                    <button className="btn btn-dark mx-1" style={{color:"#ff6666"}} onClick={()=>setShowDeleteConfirmationModal(item.issue_no)}><i className="bi bi-trash"></i> Delete</button>
                                    <button className="btn btn-dark text-light mx-1" onClick={()=>setShowUpdateModal({
                                        issue_no: item.issue_no,
                                        subject: item.issue_title,
                                        complaint: item.issue_content
                                    })}><i className="bi bi-pencil-square"></i> Edit</button>
                                </div>
                            </div>
                        </div>
                        </div>
                    )
                })}
        </div>
        {loadingModal()}
        {messageModal()}
        {DeleteConfirmationModal()}
        {UpdateComplaintModal()}
        </>
    }
}