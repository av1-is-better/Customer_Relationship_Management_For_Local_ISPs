import { useState, useEffect } from "react"
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

export default function Notice({apiDomain,authToken}){
    const [ announcementCount, setAnnouncementCount ] = useState(0);
    const [ announcementList, setAnnouncementList ] = useState(null);
    const [ showLoadingModal, setShowLoadingModal ] = useState(false);
    const [ showMessageModal, setShowMessageModal ] = useState({show:false,title:"",message:""});
    const [ spinner, setSpinner ] = useState(true);
    const [ serverError, setServerError ] = useState(false);

    const [hasMore, setHasMore] = useState(true); // Determines if more data is available
    const [offset, setOffset] = useState(0); // Tracks pagination offset
    const limit = 10; // Number of announcements to load per request

    const [showAnnouncementDetail, setShowAnnouncementDetail] = useState(null);

    useEffect(()=>{
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/announcements`,{params:{limit:limit,offset:0}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Announcement Count
                if (announcementCount != res.data.announcement_count){
                    setAnnouncementCount(res.data.announcement_count);
                }
                
                // Check if all announcements have been loaded
                if (res.data.data.length >= res.data.announcement_count) {
                    setHasMore(false);
                }

                // Announcement Found
                setAnnouncementList(res.data.data);
                
                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);
                
                // Stopping Spinner
                setSpinner(false);
            }
            // Announcement Not Found
            else {
                setAnnouncementList(null);
                setSpinner(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Announcements '+error);
            setServerError(true);
            setSpinner(false);
        })
    },[])

    // Function For Fetching More Announcements For Scroll Pagination
    const fetchAnnouncements = () => {
        setShowLoadingModal(true);
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/announcements`,{params:{limit:limit,offset:offset}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Announcement Count
                if (announcementCount != res.data.announcement_count){
                    setAnnouncementCount(res.data.announcement_count);
                }

                // Check if all announcement have been loaded
                if (announcementList.length + res.data.data.length >= res.data.announcement_count) {
                    setHasMore(false);
                }

                // Announcement Found
                setAnnouncementList((prevAnnouncement) => [
                    ...prevAnnouncement,
                    ...res.data.data,
                ]);

                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);

                // Stopping Loading
                setShowLoadingModal(false);
            }
            // Announcement Not Found
            else {
                setShowLoadingModal(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Announcements '+error);
            setShowMessageModal({show:true,title:"Server Error Occured",message:"Please Check Your Internet Connection or Try Again Later."});
            setShowLoadingModal(false);
        })
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !showLoadingModal) {
            fetchAnnouncements();
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
                    }}
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                    <Modal.Header style={{backgroundColor:"#003546",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}} closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"white",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <p>{showMessageModal.message}</p>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const announcementDetailModal = () => {
        
        return showAnnouncementDetail != null ? <> 
                <Modal 
                    centered 
                    show={showAnnouncementDetail != null} 
                    dialogClassName="modal-content-custom profile-modal"
                    onHide={()=>{
                        setShowAnnouncementDetail(null);
                    }}
                >
                    <Modal.Header style={{backgroundColor:"#003546",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}} closeButton>
                        <div>
                        <Modal.Title>Announcement</Modal.Title>
                        </div>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"white",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    {/* Body Content Here */}
                    <div className="d-flex text-center" style={{justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowAnnouncementDetail(null)} className="btn btn-secondary mx-1"><i className="bi bi-x-square"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
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

    else if (announcementList === null ){ 
        return(
          <>
            <div className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="text-center" style={{marginTop:"150px"}}>
                    <i className="bi bi-megaphone text-light" style={{ fontSize: '100px', color: 'gray' }}></i>
                    <h2 className="px-1 text-light">Nothing Here!</h2>
                    <p className="text-light">Stay Tuned! There are currently no Announcements.</p>
                </div>
            </div>
          </>
    )}

    else {
        return <>
        <div onScroll={handleScroll} className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="container-fluid bg-dark rounded-2" style={{width:"250px"}}>
                    <p className="fw-bold text-center py-2">Total Announcements: {announcementCount}</p>
                </div>
                {announcementList.map((item,index)=>{
                    return (
                        <div className="d-flex px-1 mt-3 position-relative mx-2" key={item.id} style={{borderRadius: "20px"}}>
                            <span style={{fontSize:"15px",marginLeft:"22px"}} className="mt-1 position-absolute top-0 start-0 fs-6 rounded-3 translate-middle  badge badge-circle bg-light text-dark fw-bold">📢 {announcementCount - index}</span>
                            <div className="bg-light text-dark" style={{width:"400px", borderTopLeftRadius:"20px", borderTopRightRadius:"20px", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px"}}>
                                <div className="bg-dark text-light text-center px-3 py-2" style={{borderTopLeftRadius:"20px", borderTopRightRadius:"20px"}}>
                                    <p className="py-1 text-light text-center fw-bold px-3" style={{overflowWrap:"break-word", fontSize:"18px"}}>{item.title}</p>
                                    <p className="py-1 text-light" style={{marginTop:"-28px"}}>{`${formatDate(item.timestamp)} ${formatTime(item.timestamp)}`}</p>
                                </div>
                                <div className="px-1 mt-2 w-100 d-flex mb-2" style={{textAlign:"center"}}>
                                    <textarea rows={17} className="form-control bg-light text-dark border-0 custom-scrollwheel" style={{overflowY:"auto", fontFamily:"monospace"}} defaultValue={item.message} readOnly></textarea>
                                </div>
                            </div>
                        </div>
                    )
                })}
        </div>
        {loadingModal()}
        {messageModal()}
        {announcementDetailModal()}
        </>
    }
}