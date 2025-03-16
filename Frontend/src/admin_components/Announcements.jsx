import { useEffect,useState,useRef } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

const fetchAnnouncements = async (apiDomain, authToken, setDisableBtn, page, dbLimit, setAnnouncementData, setTotalPages) => {
    setDisableBtn(true);
    const offset = (page - 1) * dbLimit;
    const headers = {"Authorization": `Bearer ${authToken}`};
    await axios.get(`${apiDomain}/admin/announcements`, { params: {offset: offset, limit: dbLimit }, headers })
    .then(res=>{
        if(res.data.result === true){
            const announcement_count = res.data.data[0].announcement_count;
            
            // Calculating Total Pages Required
            setTotalPages(Math.ceil(announcement_count / dbLimit));

            // Fetched Announcement Data
            setAnnouncementData(res.data.data);
        }
        // No Announcement Found in Database
        else if(res.data.result === false){
            setAnnouncementData(null)
        }
    })
    .catch (error => {
        setAnnouncementData("error")
        console.error('Error fetching announcements:', error);
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

export default function Announcements({authToken, apiDomain}){
    function convertTo12HourFormat(timestamp) {
        // Create a new Date object from the timestamp
        const date = new Date(timestamp);
    
        // Extract date components
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-indexed
        const year = date.getFullYear();
    
        // Extract time components
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
    
        // Determine AM or PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        // Convert 24-hour time to 12-hour time
        hours = hours % 12;
        hours = hours ? hours : 12; // If hours = 0, make it 12 (midnight)
    
        // Format minutes and seconds to always be two digits
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    
        // Format the final string
        const formattedDate = `${day}/${month}/${year}`; // DD/MM/YYYY
        const formattedTime = `${hours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    
        return `${formattedDate} ${formattedTime}`;
    }

    // announcementData For Handling Multiple Scinarios (loading,error,null)
    const [announcementData, setAnnouncementData] = useState("loading");
    const [showDetailedView, setShowDetailedView] = useState(null);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState({
                                                                show:false,
                                                                title:"",
                                                                message:""});
    // State For Deleting Announcement
    const [showDeleteConfirmModel, setShowDeleteConfirmModel] = useState(null);

    // State For Updating Announcement
    const messageTextAreaRef = useRef(null);
    const [inputReadOnly, setInputReadOnly] = useState(true);
    const [updateAnnouncementData, setUpdateAnnouncementData] = useState({id:"",title:"",message:""});

    // States For Creating Announcement
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [createAnnouncementData, setCreateAnnouncementData] = useState({title:"",message:""});

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
                 centered
                 style={{backgroundColor:"rgba(0,0,0,0.7)"}}
                 show={showMessageModal.show === true && showMessageModal.hasOwnProperty("title") && showMessageModal.hasOwnProperty("message")} 
                 onHide={()=>{
                    setShowMessageModal({show:false,title:"",message:""});
                    // Refreshing Announcement List
                    fetchAnnouncements(apiDomain, authToken, setDisableBtn, page, dbLimit, setAnnouncementData, setTotalPages);
                    }}
                 backdrop="static"
                 keyboard={false}
                >
                    <Modal.Header style={{backgroundColor:"teal"}} closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <p>{showMessageModal.message}</p>
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary" onClick={()=>{
                    setShowMessageModal({show:false,title:"",message:""});
                    // Refreshing Announcement List
                    fetchAnnouncements(apiDomain, authToken, setDisableBtn, page, dbLimit, setAnnouncementData, setTotalPages);
                    }}><i className="bi bi-x-square-fill"></i> Close</button>
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
                style={{backgroundColor:"rgba(0,0,0,0.7)"}}
                show={showLoadingModal === true} 
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

    // Modal For Showing AnnouncementDetail
    const announcementDetailModal = () => {
        return (<>
        {showDetailedView != null && <>
        <Modal 
            show={showDetailedView!=null} onHide={()=>{
                setShowDetailedView(null);
                setInputReadOnly(true);
            }} 
            backdrop="static" 
            keyboard={false}
            centered
            style={{backgroundColor:"rgba(0,0,0,0.7)"}}
            >
            <Modal.Header style={{backgroundColor:"teal"}} closeButton>
                <Modal.Title>
                    Announcement {inputReadOnly ? "Detail" : "Update"}
                    <p className="text-muted" style={{fontSize:"15px"}}><span style={{fontWeight:"bold",fontSize:"15px"}}>Date: </span>{convertTo12HourFormat(showDetailedView.timestamp)}</p>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
                {/* Title */}
                <p><span style={{fontWeight:"bold"}}>Subject: </span><input onChange={event=>{
                    setUpdateAnnouncementData({...updateAnnouncementData,title:event.target.value});
                }} type="text" className={inputReadOnly ? "form-control mt-1 bg-light text-dark" : "form-control mt-1 bg-light text-dark"} value={inputReadOnly ? showDetailedView.title : updateAnnouncementData.title} readOnly={inputReadOnly}></input></p>
                {/* Message */}
                <p><span style={{fontWeight:"bold"}}>Message: </span><textarea rows="10" style={{maxHeight:"400px"}} ref={messageTextAreaRef} onChange={event=>{
                    setUpdateAnnouncementData({...updateAnnouncementData,message:event.target.value});
                }} className={inputReadOnly ? "form-control mt-1 bg-light text-dark" : "form-control mt-1 bg-light text-dark"} value={inputReadOnly ? showDetailedView.message : updateAnnouncementData.message} readOnly={inputReadOnly}></textarea></p>
            
                {
                    inputReadOnly === false ? <>
                    <div className="d-flex" style={{justifyContent:"center"}}>
                    {/* Save Changes Button */}
                    <a className="btn mx-1"
                    style={{backgroundColor:"teal"}}
                    onClick={()=>{
                        setShowLoadingModal(true);
                        const body = updateAnnouncementData;
                        const headers = {"Authorization":`Bearer ${authToken}`}
                        axios.put(`${apiDomain}/admin/announcements`,body,{headers})
                        .then(res=>{
                            if (res.data.result === true){
                                setShowLoadingModal(false);
                                setShowDetailedView(null);
                                setInputReadOnly(true);
                                setShowMessageModal({show:true,title:"Server Response",message:res.data.message});
                            }
                            else {
                                setShowLoadingModal(false);
                                setShowDetailedView(null);
                                setInputReadOnly(true);
                                setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :-("});
                            }
                        })
                        .catch(error=>{
                            setShowLoadingModal(false);
                            console.error(error);
                            setShowDetailedView(null);
                            setInputReadOnly(true);
                            setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :-("});
                        });
                    }}><i className="bi bi-floppy2"></i> Save</a>
                    {/* Cancel Changes Button */}
                    <a className="btn btn-secondary mx-1" onClick={()=>{
                        setInputReadOnly(true);
                        setUpdateAnnouncementData({id:"",title:"",message:""});
                    }}><i className="bi bi-x-square"></i> Cancel</a>
                    </div>
                    </>
                    :
                    <>
                    <div className="d-flex" style={{justifyContent:"center"}}>
                    {/* Edit Button */}
                    <a className="btn" style={{backgroundColor:"teal"}} onClick={()=>{
                        setUpdateAnnouncementData({id:showDetailedView.id,title:showDetailedView.title,message:showDetailedView.message});
                        setInputReadOnly(false);
                    }}><i className="bi bi-pencil-square"></i> Edit</a>

                    {/* Delete Button */}
                    <a className="btn btn-danger mx-2" onClick={()=>{setShowDeleteConfirmModel(showDetailedView.id)}}><i className="bi bi-trash3"></i> Delete</a>

                    {/* Close Button */}
                    <a className="btn btn-secondary" onClick={()=>{
                        setShowDetailedView(null);
                        setInputReadOnly(true);
                    }}><i className="bi bi-x-square"></i> Close</a>
                    </div>
                    </>
                }
            </Modal.Body>
        </Modal>
        </>}
        </>)
    }

    // Modal For Creating New Announcement
    const createAnnouncementModal = () => {
        return (<>
        {showCreateAnnouncement != false && <>
        <Modal 
            style={{backgroundColor:"rgba(0,0,0,0.7)"}}
            show={showCreateAnnouncement != false} 
            onHide={()=>{
                setShowCreateAnnouncement(false);
                setCreateAnnouncementData({title:"",message:""});
            }} 
            backdrop="static" 
            keyboard={false}
            centered
        >
            <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                <Modal.Title>
                    Make Announcement
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
                {/* Title */}
                <p><span style={{fontWeight:"bold"}}>Subject: </span><input onChange={event=>{
                    setCreateAnnouncementData({...createAnnouncementData,title:event.target.value});
                }} type="text" className="form-control mt-1 bg-light text-dark" placeholder="Announcement Title" value={createAnnouncementData.title}></input></p>
                
                {/* Message */}
                <p><span style={{fontWeight:"bold"}}>Message: </span><textarea rows={10} onChange={event=>{
                    setCreateAnnouncementData({...createAnnouncementData,message:event.target.value});
                    event.target.style.height = 'auto';
                    event.target.style.height = event.target.scrollHeight + 'px';
                }} className="form-control mt-1 bg-light text-dark" placeholder="Announcement Content" value={createAnnouncementData.message}></textarea></p>
            </Modal.Body>
            <Modal.Footer className="bg-light text-dark">
            <div className="d-flex" style={{justifyContent:"center"}}>
                    {/* Create Announcement Button */}
                    <a className="btn mx-1" style={{backgroundColor:"teal"}} 
                    onClick={()=>{
                        if(createAnnouncementData.title != "" && createAnnouncementData.message != "") {
                            setShowLoadingModal(true);
                            const body = createAnnouncementData;
                            const headers = {"Authorization":`Bearer ${authToken}`}
                            axios.post(`${apiDomain}/admin/announcements`,body,{headers})
                            .then(res=>{
                                if (res.data.result === true){
                                    // Resetting Body Data
                                    setCreateAnnouncementData({title:"",message:""});
                                    // Stop Loading
                                    setShowLoadingModal(false);
                                    // Close Create Form
                                    setShowCreateAnnouncement(false);
                                    // Show Response Message
                                    setShowMessageModal({show:true,title:"Server Response",message:res.data.message});
                                }
                                else {
                                    // In Case of Error
                                    // Close Loading
                                    setShowLoadingModal(false);
                                    // Show Error Message
                                    setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :-("});
                                }
                            })
                            .catch(error=>{
                                // Same as Above Error
                                setShowLoadingModal(false);
                                console.error(error);
                                setShowMessageModal({show:true,title:"Server Response",message:"Server Rejected Your Request :-("});
                            });
                        }
                    }}><i className="bi bi-megaphone"></i> Create</a>
                    
                    {/* Cancel Changes Button */}
                    <a className="btn btn-secondary mx-1" onClick={()=>{
                        setShowCreateAnnouncement(false);
                        setCreateAnnouncementData({title:"",message:""});
                    }}><i className="bi bi-x-square"></i> Cancel</a>
                    </div>
            </Modal.Footer>
        </Modal>
        </>}
        </>)
    }

    // Modal For Announcement Delete Confirmation
    const deleteConfirmModel = () => {
        return <>
            { showDeleteConfirmModel != null ?
            <Modal style={{backgroundColor:"rgba(0,0,0,0.8)"}} centered show={showDeleteConfirmModel != null} onHide={()=>setShowDeleteConfirmModel(null)} backdrop="static" keyboard={false}>
                        <Modal.Header className="bg-danger">
                            <Modal.Title>Delete Confirmation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="bg-light text-dark">
                            <h3>This action is irreversible <br /> and cannot be undone.</h3>
                            <br />
                            <p>Are you sure you want to delete this announcement?</p>
                        </Modal.Body>
                        <Modal.Footer className="bg-light text-dark">
                            <button onClick={()=>{
                                // Show Loading
                                setShowLoadingModal(true);
                                axios.delete(`${apiDomain}/admin/announcements`,{params:{id:showDeleteConfirmModel},headers:{"Authorization":`Bearer ${authToken}`}})
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
                            <button onClick={()=>setShowDeleteConfirmModel(null)} className="btn btn-secondary"><i className="bi bi-x-square"></i> Cancel</button>
                        </Modal.Footer>
            </Modal>
            :
            <></>
            }
            </>
    }
    

    useEffect(() => {
        fetchAnnouncements(apiDomain, authToken, setDisableBtn, page, dbLimit, setAnnouncementData, setTotalPages);
    }, [page,dbLimit]);

    useEffect(() => {
        if (messageTextAreaRef.current) {
          messageTextAreaRef.current.style.height = "auto"; // Reset height to auto to allow shrinkage
          messageTextAreaRef.current.style.height = messageTextAreaRef.current.scrollHeight + "px"; // Set height to fit content
        }
      }, [updateAnnouncementData.message,showDetailedView]);
    
    if (announcementData === "error") {
        
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
    else if (announcementData === "loading" || disableBtn){
        return <Spinner/> 
    }
    else if (announcementData != null) {
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                <div className="card dark-gradient w-50">
                    <div className="card-body">
                        <h5 className="card-title fw-bold">Notice Management</h5>
                        <p className="card-text">Total Announcements: {announcementData[0].announcement_count}</p>
                    </div>
                </div>
            </div>

            <div className="d-flex mx-4" style={{justifyContent:"flex-end"}}>
                <button className="btn btn-light fw-bold border-dark mx-2" onClick={()=>{setShowCreateAnnouncement(true)}}><i className="bi bi-megaphone"></i> Make Announcement</button>
            </div>

            <div style={{height:"580px"}}>
                <div className="d-flex mt-3 px-4">
                    <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px",overflow:"hidden"}}>
                        <thead>
                            <tr>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"30px",textAlign:"center"}}>#</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Date</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"300px",textAlign:"center"}}>Title</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"20px",textAlign:"center"}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcementData.map((item,index_number)=>{
                                return (
                                        <tr key={item.id} style={{fontSize:"15px"}}>
                                            {/* Serial Number */}
                                            <td className="" scope="row" style={{width:"30px",textAlign:"center"}}>{item.announcement_count - (((page - 1) * dbLimit)+index_number)}</td>
                                
                                            {/* Date */}
                                            <td className="" style={{width:"120px",textAlign:"center"}}>{convertTo12HourFormat(item.timestamp)}</td>
                                
                                            {/* Title */}
                                            <td className="" style={{width:"300px",textAlign:"left",paddingLeft:"30px"}}>{item.title}</td>
                                
                                            {/* Actions */}
                                            <td style={{width:"20px",textAlign:"center"}}>
                                                {/* Show Announcement Info Button */}
                                                <a title="Detailed View" className="btn btn-light border text-dark mx-1" onClick={()=>{
                                                    setShowDetailedView(item);
                                                }}
                                                style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-eye-fill"></i></a>
                                            </td>
                                        </tr>
                                        )
                                    }
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="d-flex mx-4" style={{justifyContent: "flex-end"}}>
                {page > 1 ? <button disabled={disableBtn} onClick={()=>{handlePreviousPage(page,setPage,dbLimit)}} className="btn btn-light fw-bold border text-dark" style={{marginRight:"5px"}}>Previous Page</button> : <></>}
                {page < totalPages ? <button disabled={disableBtn} onClick={()=>{handleNextPage(page,totalPages,setPage,dbLimit)}} className="btn btn-light fw-bold border text-dark">Next Page</button> : <></>}
            </div>
    </div>
    {messageModal()}
    {loadingModal()}
    {announcementDetailModal()}
    {deleteConfirmModel()}
    {createAnnouncementModal()}
    </>
        )
    }
    else if (announcementData === null) {
        
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
        <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-file-earmark-excel text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
              <h2 className="mt-3 text-light">No Announcements Found</h2>
              <p className="text-light">Please, Create Your First Announcement.</p>
              <button onClick={()=>setShowCreateAnnouncement(true)} className="btn btn-light fw-bold border text-dark">
              <i className="bi bi-megaphone"></i> Make New Announcement
              </button>
            </div>
        </div>
        </div>
        {createAnnouncementModal()}
        {messageModal()}
        {loadingModal()}
        </>
        )
    };
}