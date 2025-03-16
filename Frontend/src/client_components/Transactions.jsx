import { useState, useEffect } from "react"
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

export default function Transactions({apiDomain,authToken}){
    const [ transactionCount, setTransactionCount ] = useState(0);
    const [ transactionList, setTransactionList ] = useState(null);
    const [ showLoadingModal, setShowLoadingModal ] = useState(false);
    const [ showMessageModal, setShowMessageModal ] = useState({show:false,title:"",message:""});
    const [ spinner, setSpinner ] = useState(true);
    const [ serverError, setServerError ] = useState(false);

    const [hasMore, setHasMore] = useState(true); // Determines if more data is available
    const [offset, setOffset] = useState(0); // Tracks pagination offset
    const limit = 10; // Number of transactions to load per request

    const [showTransactionDetail, setShowTransactionDetail] = useState(null);

    useEffect(()=>{
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/transactions`,{params:{limit:limit,offset:0}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Transaction Count
                if (transactionCount != res.data.transaction_count){
                    setTransactionCount(res.data.transaction_count);
                }
                
                // Check if all transactions have been loaded
                if (res.data.data.length >= res.data.transaction_count) {
                    setHasMore(false);
                }

                // Transaction Found
                setTransactionList(res.data.data);
                
                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);
                
                // Stopping Spinner
                setSpinner(false);
            }
            // Transaction Not Found
            else {
                setTransactionList(null);
                setSpinner(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Transactions '+error);
            setServerError(true);
            setSpinner(false);
        })
    },[])

    // Function For Fetching More Transaction For Scroll Pagination
    const fetchTransactions = () => {
        setShowLoadingModal(true);
        const headers = {'Authorization': `Bearer ${authToken}`}
        axios.get(`${apiDomain}/client/transactions`,{params:{limit:limit,offset:offset}, headers})
        .then(res=>{
            if (res.data.result === true){
                // Set Transaction Count
                if (transactionCount != res.data.transaction_count){
                    setTransactionCount(res.data.transaction_count);
                }

                // Check if all transactions have been loaded
                if (transactionList.length + res.data.data.length >= res.data.transaction_count) {
                    setHasMore(false);
                }

                // Transaction Found
                setTransactionList((prevTransactions) => [
                    ...prevTransactions,
                    ...res.data.data,
                ]);

                // Setting Offset
                setOffset((prevOffset) => prevOffset + limit);

                // Stopping Loading
                setShowLoadingModal(false);
            }
            // Transaction Not Found
            else {
                setShowLoadingModal(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Transactions '+error);
            setShowMessageModal({show:true,title:"Server Error Occured",message:"Please Check Your Internet Connection or Try Again Later."});
            setShowLoadingModal(false);
        })
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !showLoadingModal) {
            fetchTransactions();
        }
    };

    const loadingModal = () => {
        
        return showLoadingModal === true ? <> 
                <Modal centered show={showLoadingModal === true} backdrop="static" keyboard={false}
                dialogClassName="modal-content-custom profile-modal"
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                <Modal.Header style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
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
                    <Modal.Header style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}} closeButton>
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

    const transactionDetailModal = () => {
        
        return showTransactionDetail != null ? <> 
                <Modal 
                    centered 
                    show={showTransactionDetail != null} 
                    dialogClassName="modal-content-custom profile-modal"
                    onHide={()=>{
                        setShowTransactionDetail(null);
                    }}
                    backdrop="static"
                    keyboard={false}
                    style={{backgroundColor:"rgba(0,0,0,0.7)"}}
                >
                    <Modal.Header style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}} closeButton>
                        <div>
                        <Modal.Title>Invoice Detail</Modal.Title>
                        <p className="py-1 text-muted" style={{marginTop:"-8px",marginBottom:"-5px", fontSize:"13px"}}>{showTransactionDetail.id}</p>
                        </div>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"#f0e9e9",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <div className="text-center mt-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlSpace="preserve"
                            id="Layer_1"
                            width="100"
                            height="100"
                            fill="#000"
                            stroke="#000"
                            version="1.1"
                            viewBox="0 0 512 512"
                        >
                            <g id="SVGRepo_iconCarrier">
                              <path
                                fill="#FFDC64"
                                d="M418.472 367.165H25.119c-9.446 0-17.102-7.656-17.102-17.102V93.528c0-9.446 7.656-17.102 17.102-17.102h393.353c9.446 0 17.102 7.656 17.102 17.102v256.534c0 9.446-7.656 17.103-17.102 17.103z"
                              ></path>
                              <g fill="#FFC850">
                                <path d="M136.284 204.693H67.875a8.55 8.55 0 0 1-8.551-8.551v-51.307a8.55 8.55 0 0 1 8.551-8.551h68.409a8.55 8.55 0 0 1 8.551 8.551v51.307a8.55 8.55 0 0 1-8.551 8.551zM401.37 204.693c-70.839 0-128.267 57.427-128.267 128.267 0 11.865 1.739 23.3 4.753 34.205h140.616c9.445 0 17.102-7.658 17.102-17.102V209.448c-10.904-3.016-22.34-4.755-34.204-4.755z"></path>
                              </g>
                              <circle cx="294.48" cy="166.213" r="38.48" fill="#FF507D"></circle>
                              <circle cx="345.787" cy="166.213" r="38.48" fill="#FFC850"></circle>
                              <path
                                fill="#FF8C66"
                                d="M307.307 166.213c0 11.352 5.008 21.451 12.827 28.493 7.819-7.043 12.827-17.142 12.827-28.493 0-11.352-5.008-21.451-12.827-28.493-7.819 7.042-12.827 17.141-12.827 28.493z"
                              ></path>
                              <circle cx="401.37" cy="332.96" r="102.614" fill="#74b989"></circle>
                              <path
                                fill="#74b989"
                                d="M452.676 415.051c-56.672 0-102.614-45.942-102.614-102.614 0-33.271 15.905-62.756 40.449-81.505-51.564 5.426-91.756 49.025-91.756 102.028 0 56.672 45.942 102.614 102.614 102.614 23.401 0 44.901-7.922 62.165-21.108-3.57.376-7.189.585-10.858.585z"
                              ></path>
                              <path d="M273.102 359.148H25.119c-5.01 0-9.086-4.076-9.086-9.086V93.528c0-5.01 4.076-9.086 9.086-9.086h393.353c5.01 0 9.086 4.076 9.086 9.086v111.167a8.017 8.017 0 0 0 16.034 0V93.528c0-13.851-11.268-25.119-25.119-25.119H25.119C11.268 68.409 0 79.677 0 93.528v256.534c0 13.851 11.268 25.119 25.119 25.119h247.983a8.017 8.017 0 0 0 0-16.033z"></path>
                              <path d="M401.37 222.33c-61.002 0-110.63 49.629-110.63 110.63s49.629 110.63 110.63 110.63S512 393.962 512 332.96s-49.629-110.63-110.63-110.63zm0 205.227c-52.161 0-94.597-42.436-94.597-94.597s42.436-94.597 94.597-94.597 94.597 42.436 94.597 94.597-42.437 94.597-94.597 94.597zM67.875 212.71h68.409c9.136 0 16.568-7.432 16.568-16.568v-51.307c0-9.136-7.432-16.568-16.568-16.568H67.875c-9.136 0-16.568 7.432-16.568 16.568v51.307c0 9.136 7.432 16.568 16.568 16.568zm68.943-67.875v51.307a.534.534 0 0 1-.534.534h-34.739v-18.171h9.086a8.017 8.017 0 0 0 0-16.034h-9.086V144.3h34.739c.295.001.534.24.534.535zm-69.478 0c0-.295.239-.534.534-.534h17.637v52.376H67.875a.534.534 0 0 1-.534-.534zM320.155 127.445a46.47 46.47 0 0 0-25.675-7.729c-25.638 0-46.497 20.858-46.497 46.497s20.858 46.497 46.497 46.497c9.47 0 18.284-2.853 25.641-7.735a46.52 46.52 0 0 0 25.666 7.735c25.638 0 46.497-20.858 46.497-46.497s-20.858-46.497-46.497-46.497a46.22 46.22 0 0 0-25.632 7.729zm-56.138 38.768c0-16.798 13.666-30.463 30.463-30.463 4.781 0 9.448 1.127 13.652 3.234-5.555 7.66-8.842 17.065-8.842 27.229a46.43 46.43 0 0 0 8.824 27.23 30.3 30.3 0 0 1-13.634 3.233c-16.797 0-30.463-13.665-30.463-30.463zm112.234 0c0 16.798-13.666 30.463-30.463 30.463a30.5 30.5 0 0 1-13.65-3.237c5.554-7.66 8.84-17.064 8.84-27.227a8.017 8.017 0 0 0-16.034 0 30.27 30.27 0 0 1-4.814 16.404 30.4 30.4 0 0 1-4.806-16.404c0-16.798 13.666-30.463 30.463-30.463s30.464 13.666 30.464 30.464zM59.324 272.568h68.409a8.017 8.017 0 0 0 0-16.034H59.324a8.017 8.017 0 0 0 0 16.034zM59.324 323.875h205.228a8.017 8.017 0 0 0 0-16.034H59.324a8.017 8.017 0 0 0 0 16.034zM230.347 272.568a8.017 8.017 0 0 0 0-16.034h-68.409a8.017 8.017 0 0 0 0 16.034zM281.653 256.534h-17.102a8.017 8.017 0 0 0 0 16.034h17.102a8.017 8.017 0 0 0 0-16.034z"></path>
                              <path d="M466.896 293.087a8.016 8.016 0 0 0-11.337 0l-71.292 71.291-37.087-37.087a8.016 8.016 0 0 0-11.337 0 8.016 8.016 0 0 0 0 11.337l42.756 42.756c1.565 1.566 3.617 2.348 5.668 2.348s4.103-.782 5.668-2.348l76.96-76.96a8.015 8.015 0 0 0 .001-11.337z"></path>
                            </g>
                        </svg>
                        <h3 className="fw-bold fs-1" style={{marginLeft:"-5px"}}>&#x20b9;{showTransactionDetail.amount}</h3>
                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                            <p className="bg-success text-light fw-bold rounded-3 py-1" style={{width:"200px"}}>PAID</p>
                    
                        </div>
                    </div>
                    <div className="px-2">
                        <p className="mt-2"><span className="fw-bold">Invoice No: </span> {showTransactionDetail.invoice}</p>
                        <p style={{marginTop:"-15px"}}><span className="fw-bold">ID: </span> {showTransactionDetail.id}</p>
                        <p style={{marginTop:"-15px"}}><span className="fw-bold">Payment Method: </span> {showTransactionDetail.mode}</p>
                        <p style={{marginTop:"-15px"}}><span className="fw-bold">Date: </span> {formatDate(showTransactionDetail.date)} {formatTime(showTransactionDetail.transaction_timestamp)}</p>
                    </div>
                    <div className="d-flex text-center mt-5 mb-4" style={{justifyContent:"center"}}>
                        <button onClick={()=>{
                                            setShowLoadingModal(true);
                                            axios.get(`${apiDomain}/invoice`,{params:{id:showTransactionDetail.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                                            .then(res=>{
                                                setShowLoadingModal(false);
                                                window.open(URL.createObjectURL(res.data), '_blank');
                                            })
                                            .catch(error => {
                                                setShowLoadingModal(false);
                                                setShowMessageModal({show:true,title:"Server Error",message:"Check Your Internet Connection or Try Again Later."});
                                                console.error('Error fetching protected content:', error);
                                            });
                                    }} className="btn btn-teal mx-1"><i className="bi bi-receipt"></i> Invoice</button>
                        <button onClick={()=>setShowTransactionDetail(null)} className="btn btn-secondary mx-1"><i className="bi bi-x-square"></i> Close</button>
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
    else if (transactionList === null ){ 
        return(
          <>
            <div className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="text-center" style={{marginTop:"150px"}}>
                    <i className="bi bi-database-exclamation text-light" style={{ fontSize: '100px', color: 'gray' }}></i>
                    <h2 className="px-1 text-light">No Transactions Found!</h2>
                    <p className="text-light">Please Do Your First Transaction</p>
                </div>
            </div>
          </>
    )}
    else {
        return <>
        <div onScroll={handleScroll} className="home-div-transparent rounded-2 container-fluid py-4 hide-scrollbar" style={{width:"370px",height:"650px",marginTop:"130px", overflowY: "auto"}}>
                <div className="container-fluid mt-1 bg-dark rounded-2 mb-4" style={{width:"250px"}}>
                    <p className="fw-bold text-center py-2">Total Transactions: {transactionCount}</p>
                </div>
                {transactionList.map((item,index)=>{
                    return (
                        <div className="rounded-5 d-flex w-100 px-2 mt-3 position-relative mb-4" style={{justifyContent:"flex-start"}} key={item.invoice}>
                            <span style={{fontSize:"15px",marginLeft:"20px"}} className="mt-1 position-absolute top-0 start-0 translate-middle  badge badge-circle bg-dark fw-bold"># {transactionCount - index}</span>
                            {/* Dark Block */}
                            <div className="bg-light text-dark w-100 px-3 py-2" style={{height:"95px",borderTopLeftRadius:"1rem",borderBottomLeftRadius:"1rem"}}>
                                <div className="d-flex w-100 py-2">
                                    <div className="d-flex w-100" style={{justifyContent:"flex-start"}}>
                                        <h1 className="fw-bold">&#8377;{item.amount}</h1>
                                    </div>
                                    <div className="d-flex w-100" style={{justifyContent:"flex-end"}}>
                                        <p className="fw-bold bg-success text-light px-4 py-1 mt-2">PAID</p>
                                    </div>
                                </div>
                                <div className="d-flex w-100" style={{fontSize:"14px"}}>
                                    <div className="d-flex w-100" style={{justifyContent:"flex-start",minWidth:"150px"}}>
                                        <p className="text-dark fw-bold" style={{marginTop:"-12px",fontSize:"13px"}}>{`${formatDate(item.date)} ${formatTime(item.transaction_timestamp)}`}</p>
                                    </div>
                                    <div className="d-flex w-100" style={{justifyContent:"flex-end"}}>
                                        <p className="text-dark fw-bold" style={{marginTop:"-12px",fontSize:"13px"}}>{`${item.mode}`}</p>
                                    </div>
                                </div>
                            </div>
                            <div onClick={()=>setShowTransactionDetail(item)} className="d-flex bg-dark invoice-three-dot" style={{justifyContent:"flex-end",borderTopRightRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                                <i style={{fontSize:"40px"}} className="bi bi-three-dots-vertical py-3 invoice-three-dot"></i>
                            </div>
                        </div>
                    )
                })}
        </div>
        {loadingModal()}
        {messageModal()}
        {transactionDetailModal()}
        </>
    }
}