import { useEffect,useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

const fetchComplaints = async (apiDomain, authToken, setDisableBtn, page, dbLimit, setComplaintData, setTotalPages, complaintType) => {
    setDisableBtn(true);
    const offset = (page - 1) * dbLimit;
    const headers = {"Authorization": `Bearer ${authToken}`};
    await axios.get(`${apiDomain}/admin/complaints`, { params: {status:complaintType, offset: offset, limit: dbLimit }, headers })
    .then(res=>{
        if(res.data.result === true){
            const complaint_count = res.data.data[0].complaint_count;
            
            // Calculating Total Pages Required
            setTotalPages(Math.ceil(complaint_count / dbLimit));

            // Fetched Complaints Data
            setComplaintData(res.data.data);
        }
        // No Complaints Found in Database
        else if(res.data.result === false){
            setComplaintData([])
        }
    })
    .catch (error => {
        setComplaintData("error")
        console.error('Error fetching complaints:', error);
    })
    setDisableBtn(false)
};

const handleNextPage = (page,totalPages,setPage) => {
    if (page < totalPages) {
        setPage(page + 1);
    };
};

const handlePreviousPage = (page,setPage) => {
    if (page > 1){
        setPage(page - 1);
    }
};

export default function Complaints({authToken, apiDomain}){

    // complaintData For Handling Multiple Scinarios (loading,error,null)
    const [complaintData, setComplaintData] = useState("loading");
    const [complaintType, setComplaintType] = useState("active");
    const [showDetailedView, setShowDetailedView] = useState(null);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState({
                                                                show:false,
                                                                title:"",
                                                                message:""});
    
    const [showDeleteConfirmModel, setShowDeleteConfirmModel] = useState(null);

    // Table Handlers
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Change Table Limit Through This Hook
    const [dbLimit, setDbLimit] = useState(10);

    // Disable Button During API Calls
    const [disableBtn, setDisableBtn] = useState(false);

    // Modal For Showing API Responses and Errors
    const messageModal = () => {
        return (
            <>
                <Modal 
                    show={showMessageModal.show === true && showMessageModal.hasOwnProperty("title") && showMessageModal.hasOwnProperty("message")} 
                    centered
                    onHide={()=>{
                        setShowMessageModal({show:false,title:"",message:""});
                        // Refreshing Complaint List
                        fetchComplaints(apiDomain, authToken, setDisableBtn, page, dbLimit, setComplaintData, setTotalPages, complaintType);
                    }}
                    backdrop="static"
                    keyboard={false}
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <p>{showMessageModal.message}</p>
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary" onClick={()=>{
                            setShowMessageModal({show:false,title:"",message:""});
                            // Refreshing Complaint List
                            fetchComplaints(apiDomain, authToken, setDisableBtn, page, dbLimit, setComplaintData, setTotalPages, complaintType);
                        }} ><i className="bi bi-x-square"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
            </>
        )
    }
    // Modal For Showing Loading Status
    const loadingModal = () => {
        return (
            <Modal
            centered 
            show={showLoadingModal === true}
            style={{backgroundColor:"rgba(0,0,0,0.7)"}} 
            backdrop="static" 
            keyboard={false}>
                        <Modal.Header style={{backgroundColor:"teal"}}>
                            <Modal.Title>Please Wait</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <center>
                            <div className="spinner-border" role="status">
                                <span className="sr-only" hidden>Loading...</span>
                            </div>
                            </center>
                        </Modal.Body>
            </Modal>
        )
    }

    // Modal For Complaint Delete Confirmation
    const deleteConfirmModel = () => {
        return <>
            { showDeleteConfirmModel != null ?
            <Modal 
                show={showDeleteConfirmModel != null} 
                onHide={()=>setShowDeleteConfirmModel(null)} 
                centered
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                backdrop="static" 
                keyboard={false}>
                        <Modal.Header className="bg-danger">
                            <Modal.Title>Delete Confirmation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <p>Are you sure you want to delete this complaint?</p>
                            <p style={{marginTop:"-15px"}}>This action is irreversible and cannot be undone.</p>
                        </Modal.Body>
                        <Modal.Footer className="bg-light">
                            <button onClick={()=>{
                                // Show Loading
                                setShowLoadingModal(true);
                                axios.delete(`${apiDomain}/admin/complaints`,{data:showDeleteConfirmModel,headers:{"Authorization":`Bearer ${authToken}`}})
                                .then(res=>{
                                    if (res.data.result === true){
                                        setShowLoadingModal(false);
                                        setShowDeleteConfirmModel(null);
                                        setShowDetailedView(null);
                                        setShowMessageModal({show:true,title:"Server Response",message:res.data.message});
                                    }
                                    else {
                                        setShowLoadingModal(false);
                                        setShowDeleteConfirmModel(null);
                                        setShowMessageModal({show:true,title:"Error Occured",message:"Server Rejected Your Request :("});
                                    }
                                })
                                .catch(error=>{
                                    console.error(error);
                                    setShowLoadingModal(false);
                                    setShowDeleteConfirmModel(null);
                                    setShowMessageModal({show:true,title:"Error Occured",message:"Server Rejected Your Request :("});
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

    // Modal For Showing ComplaintDetail
    const complaintDetailModal = () => {
        return (<>
        {showDetailedView != null && <>
        <Modal 
            show={showDetailedView!=null} 
            onHide={()=>setShowDetailedView(null)} 
            backdrop="static" 
            centered
            keyboard={false}
            style={{backgroundColor:"rgba(0,0,0,0.7)"}} 
            >
            <Modal.Header closeButton style={{backgroundColor:"teal"}} >
                <Modal.Title>
                    Client Complaint
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
                <p><span style={{fontWeight:"bold"}}>Status: </span> <span className="fw-bold" style={complaintType === "active" ? {color:"darkred"} : {color:"darkgreen"}}>{complaintType === "active" ? "Not Resolved" : "Resolved"}</span></p>
                <p><span style={{fontWeight:"bold"}}>Subject: </span><input className="form-control bg-light text-dark mt-1" value={showDetailedView.issue_title} type="text" readOnly></input></p>
                <p><span style={{fontWeight:"bold"}}>Message: </span><textarea rows={10} className="form-control bg-light text-dark mt-1" value={showDetailedView.issue_content} readOnly></textarea></p>
            </Modal.Body>
            <Modal.Footer className="bg-light text-dark">
                <button onClick={()=>{
                    setShowDetailedView(null)
                    setShowLoadingModal(true);

                    // Calling API To Change Complaint Status
                    const body = {
                        email:showDetailedView.email,
                        issue_status: complaintType==="active" ? false : true,
                        issue_no: showDetailedView.issue_no
                    };

                    const headers = {
                        'Authorization':`Bearer ${authToken}`
                    };
                    
                    axios.put(`${apiDomain}/admin/complaints`,body,{headers})
                    .then(res => {
                        setShowLoadingModal(false);
                        if (res.data.result === true){
                            setShowMessageModal({show:true,title:"Server Response",message:res.data.message});
                        }
                        else {
                            setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :("});
                        }
                    })
                    .catch(error=>{
                        setShowLoadingModal(false);
                        setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :("});
                    })

                }} className={ complaintType === "active" ? "btn btn-light text-success border-success" : "btn btn-light text-dark border-dark" }>{ complaintType === "active" ? <><i className="bi bi-emoji-laughing"></i> Mark Resolved</> : <><i className="bi bi-emoji-frown"></i> Mark Not Resolved</> }</button>
                {/* DELETE BUTTON */}
                <button onClick={()=>{
                    const body = {
                        email:showDetailedView.email,
                        issue_no: showDetailedView.issue_no
                    };
                    setShowDeleteConfirmModel(body);
                }} className="btn btn-danger" hidden={complaintType === "active"}><i className="bi bi-trash3"></i> Delete</button>
                <button className="btn btn-secondary" onClick={()=>setShowDetailedView(null)}><i className="bi bi-x-square"></i> Close</button>
            </Modal.Footer>
        </Modal>
        </>}
        </>)
    }
    

    useEffect(() => {
        fetchComplaints(apiDomain, authToken, setDisableBtn, page, dbLimit, setComplaintData, setTotalPages, complaintType);
    }, [page,dbLimit,complaintType]);
    
    if (complaintData === "error") {
        
        return (
            <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginLeft:"20vh",marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-wifi-off text-dark" style={{ fontSize: '8rem', color: 'gray' }}></i>
              <h2 className="mt-3">Server Not Accessible</h2>
              <p className="text-dark">Please check your internet connection or try again later.</p>
            </div>
        </div>
        )
    }
    else if (complaintData === "loading" || disableBtn){
        return <Spinner/> 
    }
    else if (complaintData != null) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
                <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                    <div className="card dark-gradient w-50">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Complaint Management</h5>
                            <p className="card-text">{complaintType === "active" ? "Total Active Issues:" : "Total Resolved Issues:"} {complaintData.length != 0 ? complaintData[0].complaint_count : 0}</p>
                        </div>
                    </div>
                </div>


                <div className="d-flex mx-auto justify-content-center text-center" style={{width:"800px"}}>
                    {/* We Can Add Buttons Here */}
                    <button style={{fontSize:"18px",borderTopLeftRadius:"20px",borderBottomLeftRadius:"20px",borderTopRightRadius:"0px",borderBottomRightRadius:"0px"}} className={complaintType==="active" ? "btn border-2 btn-light w-100 border-light text-danger fw-bold" : "btn bg-dark fw-bold border-dark w-100"}
                    onClick={()=>{
                        setComplaintType("active");
                        setPage(1);
                    }}
                    >
                        <div className="d-flex" style={{justifyContent:"center",height:"30px"}}>
                        <svg width="30px" height="30px" viewBox="0 0 1024 1024" className="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                              <path d="M512.004 512.002m-491.988 0a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0Z" fill="#FDDF6D"></path>
                              <path d="M617.43 931.354c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.056 155.124 20.016 320.824 20.016 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.308-143.124 53.666-223.67 53.666z" fill="#FCC56B"></path>
                              <path d="M735.828 834.472H496.912c-11.056 0-20.014-8.958-20.014-20.014s8.958-20.014 20.014-20.014h238.914c11.056 0 20.014 8.958 20.014 20.014s-8.956 20.014-20.012 20.014zM442.172 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188 7.082-8.484 19.702-9.62 28.188-2.536 17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.732-6.776 21.3-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.524 20.58-70.554 32.866-117.774 32.866zM789.346 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188s19.706-9.62 28.188-2.536c17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.73-6.776 21.304-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.526 20.58-70.554 32.866-117.774 32.866zM347.382 526.08c-7.438 0-14.36-0.836-20.53-2.544-10.654-2.946-16.9-13.972-13.954-24.628 2.948-10.654 13.984-16.904 24.628-13.954 9.852 2.73 30.072 0.814 53.044-9.608 22.486-10.194 37.75-24.62 42.904-34.39 5.156-9.78 17.26-13.528 27.038-8.368 9.778 5.156 13.524 17.264 8.368 27.038-10.488 19.886-33.582 39.392-61.778 52.178-20.608 9.346-41.672 14.276-59.72 14.276zM878.98 526.08c-18.05 0-39.108-4.928-59.724-14.278-28.194-12.782-51.288-32.288-61.774-52.174-5.158-9.776-1.41-21.882 8.368-27.038 9.778-5.164 21.882-1.406 27.038 8.368 5.156 9.77 20.418 24.194 42.898 34.388 22.974 10.42 43.2 12.338 53.044 9.61 10.666-2.938 21.68 3.298 24.628 13.952 2.946 10.654-3.298 21.68-13.952 24.628-6.166 1.706-13.09 2.544-20.526 2.544z" fill="#7F184C"></path>
                              <path d="M711.124 40.168c-10.176-4.304-21.922 0.464-26.224 10.646s0.464 21.926 10.646 26.224c175.212 74.03 288.428 244.764 288.428 434.96 0 260.248-211.724 471.97-471.968 471.97S40.03 772.244 40.03 511.998 251.756 40.03 512.002 40.03c11.056 0 20.014-8.958 20.014-20.014S523.058 0 512.002 0c-282.32 0-512 229.68-512 511.998 0 282.32 229.68 512.002 512 512.002C794.318 1024 1024 794.32 1024 512c0.002-206.322-122.812-391.528-312.876-471.832z" fill=""></path>
                              <path d="M496.912 794.444c-11.056 0-20.014 8.958-20.014 20.014s8.958 20.014 20.014 20.014h238.914c11.056 0 20.014-8.958 20.014-20.014s-8.958-20.014-20.014-20.014H496.912zM350.194 564.46c-8.488-7.088-21.106-5.948-28.188 2.536-7.086 8.486-5.948 21.106 2.536 28.188 24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.778-8.738-19.348-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.408-0.002-74.514-9.43-91.984-24.014zM671.714 595.184c24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.776-8.738-19.35-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.404 0-74.508-9.426-91.98-24.012-8.484-7.082-21.106-5.946-28.188 2.536-7.082 8.482-5.948 21.106 2.536 28.188zM328.566 488.978c9.852 2.73 30.072 0.814 53.044-9.608 22.486-10.194 37.75-24.62 42.904-34.39 5.156-9.78 1.41-21.882-8.368-27.038-9.778-5.156-21.88-1.41-27.038 8.368-4.92 9.342-18.66 21.202-36.214 28.81-17.878 7.66-38.494 10.402-48.99 7.718-10.654-2.95-21.68 3.3-24.628 13.954-2.948 10.656 3.3 21.68 13.954 24.628 6.166 1.706 13.088 2.542 20.528 2.542zM878.98 526.08c18.05 0 39.108-4.928 59.724-14.278 28.194-12.782 51.288-32.288 61.774-52.174 5.158-9.776 1.41-21.882-8.368-27.038-9.778-5.164-21.882-1.406-27.038 8.368-5.156 9.77-20.418 24.194-42.898 34.388-22.974 10.42-43.2 12.338-53.044 9.61-10.666-2.938-21.68 3.298-24.628 13.952-2.946 10.654 3.298 21.68 13.952 24.628 6.166 1.706 13.09 2.544 20.526 2.544z" fill=""></path>
                            </g>
                        </svg>
                            <p style={{marginLeft:"5px"}}>Active Issues</p>
                        </div>
                    </button>
                    <button style={{fontSize:"18px",borderTopLeftRadius:"0px",borderBottomLeftRadius:"0px",borderTopRightRadius:"20px",borderBottomRightRadius:"20px"}} className={complaintType==="resolved" ? "btn border-2 btn-light w-100 border-light text-success fw-bold" : "btn bg-dark fw-bold border-dark w-100"}
                    onClick={()=>{
                        setComplaintType("resolved");
                        setPage(1);
                    }}
                    >
                        <div className="d-flex" style={{justifyContent:"center",height:"30px"}}>
                        <svg width={"30px"} height={"30px"} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                            <path d="M512.002 512.002m-491.988 0a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0Z" fill="#FDDF6D"></path>
                            <path d="M617.43 931.356c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.054 155.124 20.014 320.828 20.014 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.31-143.124 53.668-223.668 53.668z" fill="#FCC56B"></path>
                            <path d="M583.584 842.35c-109.984 0-199.146-89.162-199.146-199.146h398.292c0 109.984-89.162 199.146-199.146 199.146z" fill="#7F184C"></path>
                            <path d="M426.314 359.704m-60.044 0a60.044 60.044 0 1 0 120.088 0 60.044 60.044 0 1 0-120.088 0Z" fill="#FFFFFF"></path>
                            <path d="M764.374 359.704m-60.044 0a60.044 60.044 0 1 0 120.088 0 60.044 60.044 0 1 0-120.088 0Z" fill="#FFFFFF"></path>
                            <path d="M587.53 759.732c-53.832-25.01-113.568-21.376-162.01 4.564 36.4 47.442 93.642 78.058 158.06 78.058a198.412 198.412 0 0 0 79.806-16.684c-17.928-27.748-43.638-50.97-75.856-65.938z" fill="#FC4C59"></path>
                            <path d="M300.572 481.542c-36.536 0-66.156 29.62-66.156 66.156h132.314c0-36.536-29.618-66.156-66.158-66.156zM877.628 472.678c-36.536 0-66.156 29.62-66.156 66.156h132.314c-0.002-36.538-29.622-66.156-66.158-66.156z" fill="#F9A880"></path>
                            <path d="M436.782 643.204v31.086c0 13.108 10.626 23.732 23.732 23.732H714.16c13.108 0 23.732-10.626 23.732-23.732v-31.086H436.782z" fill="#F2F2F2"></path>
                            <path d="M598.670912 212.010313a102.74 57.374 15.801 1 0 31.245541-110.412045 102.74 57.374 15.801 1 0-31.245541 110.412045Z" fill="#FCEB88"></path>
                            <path d="M935.442 224.096c-56.546-83.01-135.324-147.116-227.816-185.386-10.212-4.224-21.922 0.63-26.148 10.842-4.224 10.216 0.628 21.92 10.842 26.148 85.266 35.28 157.894 94.39 210.04 170.934 53.388 78.38 81.612 170.14 81.612 265.368 0 260.248-211.724 471.97-471.97 471.97S40.03 772.244 40.03 512 251.752 40.03 512 40.03c11.054 0 20.014-8.962 20.014-20.014S523.054 0 512 0C229.68 0 0 229.68 0 512s229.68 512 512 512 512-229.68 512-512c0-103.3-30.622-202.856-88.558-287.904z" fill=""></path>
                            <path d="M506.386 359.712c0-44.144-35.914-80.058-80.058-80.058s-80.058 35.914-80.058 80.058c0 44.144 35.914 80.058 80.058 80.058s80.058-35.914 80.058-80.058z m-120.088 0c0-22.072 17.958-40.03 40.03-40.03s40.03 17.958 40.03 40.03c0 22.072-17.958 40.03-40.03 40.03s-40.03-17.958-40.03-40.03zM844.43 359.712c0-44.144-35.914-80.058-80.058-80.058s-80.058 35.914-80.058 80.058c0 44.144 35.914 80.058 80.058 80.058s80.058-35.914 80.058-80.058z m-120.088 0c0-22.072 17.958-40.03 40.03-40.03s40.03 17.958 40.03 40.03c0 22.072-17.958 40.03-40.03 40.03s-40.03-17.958-40.03-40.03zM364.422 643.204c0 120.846 98.314 219.16 219.16 219.16s219.16-98.314 219.16-219.16c0-11.054-8.962-20.014-20.014-20.014H384.436c-11.052-0.002-20.014 8.96-20.014 20.014z m397.182 20.014c-9.984 89.39-86.012 159.116-178.022 159.116-92.008 0-168.038-69.726-178.022-159.116h356.044z" fill=""></path>
                            <path d="M628.862 33.734m-20.014 0a20.014 20.014 0 1 0 40.028 0 20.014 20.014 0 1 0-40.028 0Z" fill=""></path>
                        </svg>
                            <p style={{marginLeft:"5px"}}>Resolved Issues</p>
                        </div>
                    </button>
                </div>

            
            <div style={{height:"600px"}}>
            <div className="d-flex mt-4 px-4">
                <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px",overflow:"hidden"}}>
                    <thead>
                        <tr>
                            <th scope="col" className="bg-dark border-dark text-light" style={{width:"30px",textAlign:"center"}}>#</th>
                            <th scope="col" className="bg-dark border-dark text-light" style={{width:"100px",textAlign:"center"}}>Date</th>
                            <th scope="col" className="bg-dark border-dark text-light" style={{width:"80px",textAlign:"center"}}>From</th>
                            <th scope="col" className="bg-dark border-dark text-light" style={{width:"180px",textAlign:"center"}}>Subject</th>
                            <th scope="col" className="bg-dark border-dark text-light" style={{width:"50px",textAlign:"center"}}>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {complaintData.map((item,index_number)=>{
                            return (
                                <tr key={item.issue_no} style={{fontSize:"15px"}}>
                                    {/* Serial Number */}
                                    <td scope="row" style={{width:"30px",textAlign:"center"}}>{item.complaint_count - (((page - 1) * dbLimit)+index_number)}</td>

                                    {/* Date */}
                                    <td style={{width:"100px",textAlign:"center"}}>{item.issue_date}</td>

                                    {/* From */}
                                    <td style={{width:"80px",textAlign:"center"}}>{item.name.toUpperCase()}</td>

                                    {/* Subject */}
                                    <td style={{width:"180px",textAlign:"center"}}>{item.issue_title}</td>

                                    {/* Actions */}
                                    <td style={{width:"50px",textAlign:"center"}}>
                                        {/* Show Complaint Info Button */}
                                        <a title="Detailed View" className="btn btn-light border-dark text-dark mx-1" onClick={()=>{
                                            setShowLoadingModal(true);
                                            const body = {email: item.email};
                                            const headers = {'Authorization': `Bearer ${authToken}`};
                                            axios.post(`${apiDomain}/admin/client-profile`,body,{headers})
                                            .then(res=>{
                                                if (res.data.result === true){
                                                    setShowLoadingModal(false);
                                                    setShowDetailedView({...item, picture:res.data.data[0].picture});
                                                }
                                                else {
                                                    setShowLoadingModal(false);
                                                    setShowMessageModal({show:true, title:"Server Error",message:"Server Rejected Your Request :("});
                                                }
                                            })
                                            .catch(error=>{
                                                console.log(`Error Occured While Fetching Client Profile ${error}`);
                                                setShowLoadingModal(false);
                                                setShowMessageModal({show:true, title:"Server Error",message:"Server Rejected Your Request :("});
                                            })

                                        }}
                                        style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-eye-fill"></i></a>
                                    </td>
                                </tr>
                            )})}
                    </tbody>
                </table>
            </div>
            {complaintData.length === 0 && 
                <>
                    <div className="d-flex" style={{justifyContent:"center",alignSelf:"center"}}> 
                         <i style={{fontSize:"200px"}} className="bi bi-database-slash"></i>
                    </div>
                    <h2 className="text-center w-100">There are no {complaintType==="active" ? "Active" : "Resolved"} Complaints</h2>
                </>
            }
            </div>


            <div className="d-flex mx-4" style={{justifyContent: "flex-end"}}>
                {page > 1 ? <button disabled={disableBtn} onClick={()=>{handlePreviousPage(page,setPage,dbLimit)}} className="btn btn-light text-dark fw-bold" style={{marginRight:"5px"}}>Previous Page</button> : <></>}
                {page < totalPages ? <button disabled={disableBtn} onClick={()=>{handleNextPage(page,totalPages,setPage,dbLimit)}} className="btn btn-light text-dark fw-bold">Next Page</button> : <></>}
            </div>
    </div>
    {messageModal()}
    {loadingModal()}
    {complaintDetailModal()}
    {deleteConfirmModel()}
    </>
        )
    }
}