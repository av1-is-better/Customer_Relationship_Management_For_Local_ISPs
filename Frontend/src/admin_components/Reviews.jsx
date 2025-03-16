import { useEffect,useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

const fetchReviews = async (apiDomain, authToken, setDisableBtn, page, dbLimit, setReviewData, setTotalPages) => {
    setDisableBtn(true);
    const offset = (page - 1) * dbLimit;
    const headers = {"Authorization": `Bearer ${authToken}`};
    await axios.get(`${apiDomain}/admin/reviews`, { params: {offset: offset, limit: dbLimit }, headers })
    .then(res=>{
        if(res.data.result === true){
            const review_count = res.data.data[0].review_count;
            
            // Calculating Total Pages Required
            setTotalPages(Math.ceil(review_count / dbLimit));

            // Fetched Review Data
            setReviewData(res.data.data);
        }
        // No Reviews Found in Database
        else if(res.data.result === false){
            setReviewData(null)
        }
    })
    .catch (error => {
        setReviewData("error")
        console.error('Error fetching reviews:', error);
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

export default function Reviews({authToken, apiDomain}){
    // Function that returns single fill/unfill star
    const Star = ({ type }) => {
        if (type === 'filled') {
            return <i className="bi bi-star-fill text-danger"></i>; // Filled star
        } else if (type === 'half') {
            return <i className="bi bi-star-half text-danger"></i>; // Half star
        } else {
            return <i className="bi bi-star text-danger"></i>; // Unfilled star
        }
    };
       

    // function that returns rating in stars
    const Rating = ({ rating }) => {
        const stars = [];
    
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5; // Check if there's a half star
    
        // Push full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={`filled-${i}`} type="filled" />);
        }
    
        // Push half star if needed
        if (hasHalfStar) {
            stars.push(<Star key="half" type="half" />);
        }
    
        // Push empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Star key={`empty-${i}`} type="unfilled" />);
        }
    
        return <div>{stars}</div>;
    };
    

    // reviewData For Handling Multiple Scinarios (loading,error,null)
    const [reviewData, setReviewData] = useState("loading");
    const [showDetailedView, setShowDetailedView] = useState(null);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState({
                                                                show:false,
                                                                title:"",
                                                                message:""});

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
                    onHide={()=>{
                        setShowMessageModal({show:false,title:"",message:""});
                        // Refreshing Review List
                        fetchReviews(apiDomain, authToken, setDisableBtn, page, dbLimit, setReviewData, setTotalPages);
                    }}
                    centered
                    keyboard={false}
                    backdrop="static"
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                    <Modal.Header className="bg-teal text-light" closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <p>{showMessageModal.message}</p>
                    </Modal.Body>
                </Modal>
            </>
        )
    }
    // Modal For Showing Loading Status
    const loadingModal = () => {
        return (
            <Modal show={showLoadingModal === true} 
                    backdrop="static" 
                    keyboard={false}
                    centered
                    style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                    >
                        <Modal.Header className="bg-teal text-light">
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

    // Modal For Showing ReviewDetail
    const reviewDetailModal = () => {
        return (<>
        {showDetailedView != null && <>
        <Modal 
            show={showDetailedView!=null} 
            onHide={()=>setShowDetailedView(null)} 
            backdrop="static" 
            keyboard={false}
            centered
            style={{backgroundColor:"rgba(0,0,0,0.8)"}}
            >
            <Modal.Header className="bg-teal text-light" closeButton>
                <Modal.Title>
                    Client Review
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
                <p><span style={{fontWeight:"bold"}}>Rating: </span> <Rating rating={showDetailedView.review_rating} /></p>
                <p><span style={{fontWeight:"bold"}}>Feedback: </span><textarea style={{overflowY:"scroll"}} rows={8} className="custom-scrollwheel form-control mt-1 bg-light text-dark" value={showDetailedView.review_description} readOnly></textarea></p>
            </Modal.Body>
        </Modal>
        </>}
        </>)
    }
    

    useEffect(() => {
        fetchReviews(apiDomain, authToken, setDisableBtn, page, dbLimit, setReviewData, setTotalPages);
    }, [page,dbLimit]);
    
    if (reviewData === "error") {
        
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
    else if (reviewData === "loading" || disableBtn){
        return <Spinner/> 
    }
    else if (reviewData != null) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                <div className="card dark-gradient w-50">
                    <div className="card-body">
                        <h5 className="card-title fw-bold">Customer Feedback</h5>
                        <p className="card-text">Total Reviews: {reviewData[0].review_count}</p>
                        <div className="d-flex w-100 text-center" style={{justifyContent:"center",marginTop:"-13px"}}>
                        <p><span>Avg. Rating:&nbsp;</span></p>
                            <Rating rating={reviewData[0].average_rating}></Rating>
                        </div>
                        
                    </div>
                </div>
            </div>
            
            <div className="custom-scrollwheel mb-4" style={{height:"600px",overflowY:"auto",overflowX:"hidden"}}>
            <div className="d-flex mt-3 px-4" style={{minWidth:"900px",height:"auto"}}>
            <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px"}}>
                <thead>
                  <tr>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"30px",textAlign:"center"}}>#</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>Date</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"80px",textAlign:"center"}}>From</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"180px",textAlign:"center"}}>Rating</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"50px",textAlign:"center"}}>Read Feedback</th>
                  </tr>
                </thead>
            <tbody>
                {reviewData.map((item,index_number)=>{
                    return (
                            <tr key={item.review_no} style={{fontSize:"15px"}}>
                                {/* Serial Number */}
                                <td scope="row" style={{width:"30px",textAlign:"center", color:"black"}}>{item.review_count - (((page - 1) * dbLimit)+index_number)}</td>

                                {/* Date */}
                                <td style={{width:"100px",textAlign:"center", color:"black"}}>{item.review_date}</td>

                                {/* From */}
                                <td style={{width:"80px",textAlign:"center", color:"black"}}>{item.name.toUpperCase()}</td>

                                {/* Rating */}
                                <td style={{width:"180px",textAlign:"center", color:"black"}}><Rating rating={item.review_rating}></Rating></td>

                                {/* Actions */}
                                <td style={{width:"50px",textAlign:"center"}}>
                                    {/* Show Review Info Button */}
                                    <a title="Detailed View" className="btn btn-light text-dark border-dark mx-1" onClick={()=>{
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
    {reviewDetailModal()}
    </>
        )
    }
    else if (reviewData === null) {
        
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
        <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-stars text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
              <h2 className="mt-3 text-light">No Feedback Found</h2>
              <p className="text-light">It seems like there are no reviews given by clients.</p>
            </div>
        </div>
        </div>
        </>
        )
    };
}