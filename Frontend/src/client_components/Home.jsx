import { useState, useEffect } from "react"
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";
import Review from "./Review";

export default function Home({apiDomain, authToken, RAZORPAY_KEY_ID}){
    const [ transactionData, setTransactionData ] = useState(null);
    const [ clientData, setClientData ] = useState(null);
    const [ showLoadingModal, setShowLoadingModal ] = useState(false);
    const [ showMessageModal, setShowMessageModal ] = useState({show:false,title:"",message:""});
    const [ showClientProfile, setShowClientProfile ] = useState(false);
    const [spinner, setSpinner] = useState(true);
    const [serverError, setServerError] = useState(false);
    const [ showContactModal, setShowContactModal ] = useState(false);
    const [ showYourPlan, setShowYourPlan ] = useState(false);
    const [ showPayNow, setShowPayNow ] = useState(false);

    const [ defaultRadioCheck, setDefaultRadioCheck ] = useState(true);
    const [ customAmount, setCustomAmount ] = useState();

    const [ showTransactionStatus, setShowTransactionStatus ] = useState(null);

    const [ showFeedbackModal, setShowFeedbackModal ] = useState(false);

    useEffect(()=>{
        // showTransactionStatus is used to display Transaction Successful Message Modal with details.
        showTransactionStatus === null && setSpinner(true);
        
        const loadScript = async () => {
            const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!res) {
                setServerError(true);
            }
        };
        
        showTransactionStatus === null && loadScript();

        const headers = {'Authorization': `Bearer ${authToken}`}
        showTransactionStatus === null && axios.get(`${apiDomain}/client/home`,{headers})
        .then(res=>{
            if (res.data.result === true){
                // Storing Client Data
                setClientData(res.data.data.client);
                setCustomAmount(res.data.data.client.plan_cost);

                // Transaction Found
                if (res.data.data.transaction.result === true){
                    // Storing Most Recent Transaction
                    setTransactionData(res.data.data.transaction);
                }

                // Stopping Spinner
                setSpinner(false);

                // checking whether feedback given by client or not
                if (res.data.data.feedback_given_by_client === false){
                    // this modal will be displayed when no feedback given by client
                    setShowFeedbackModal(true);
                }
            }
            // Error Occured
            else {
                setServerError(true);
                setSpinner(false);
            }
        })
        .catch(error=>{
            // Error Occured
            console.error('Error Occured During Fetching Dashboard Data '+error);
            setServerError(true);
            setSpinner(false);
        })
    },[showTransactionStatus])

    const loadingModal = () => {
        
        return showLoadingModal === true ? <> 
                <Modal 
                centered 
                show={showLoadingModal === true} 
                backdrop="static" 
                keyboard={false}
                dialogClassName="profile-modal"
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                <Modal.Header style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                    <Modal.Title>Please Wait</Modal.Title>
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
                onHide={()=>{
                    setShowMessageModal({show:false,title:"",message:""});
                }}
                dialogClassName="profile-modal"
                backdrop="static"
                keyboard={false}
                >
                    <Modal.Header className={ showMessageModal.hasOwnProperty("type") && showMessageModal.type === "error" ? "bg-danger" : "bg-teal" } closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <p>{showMessageModal.message}</p>
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary" onClick={()=>{
                            setShowMessageModal({show:false,title:"",message:""});
                        }}><i className="bi bi-x-square"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    // This Modal Shows Payment Details After Transaction is Successfully Completed
    const transactionStatusModal = () => {
        
        return showTransactionStatus != null ? <> 
                <Modal 
                centered 
                show={showTransactionStatus != null} 
                onHide={()=>{
                    setShowTransactionStatus(null);
                }}
                backdrop="static"
                keyboard={false}
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                dialogClassName="modal-content-custom profile-modal"
                >
                    <Modal.Header className="bg-teal" closeButton>
                        <Modal.Title>Thank You</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    {/* SVG SMILE LOGO */}
                    <div className="d-flex mt-4" style={{justifyContent:"center"}}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlSpace="preserve"
                            id="Layer_1"
                            width="100"
                            height="100"
                            fill="#000"
                            version="1.1"
                            viewBox="0 0 512.003 512.003"
                        >
                            <g id="SVGRepo_iconCarrier">
                              <circle cx="256.001" cy="256.001" r="256.001" fill="#FDDF6D"></circle>
                              <path
                                fill="#FCC56B"
                                d="M310.859 474.208c-141.385 0-256-114.615-256-256 0-75.537 32.722-143.422 84.757-190.281C56.738 70.303 0 156.525 0 256c0 141.385 114.615 256 256 256 65.849 0 125.883-24.87 171.243-65.718-34.918 17.853-74.473 27.926-116.384 27.926"
                              ></path>
                              <g fill="#7F184C">
                                <path d="M293.248 427.894c-57.23 0-103.624-46.394-103.624-103.624h207.248c0 57.23-46.395 103.624-103.624 103.624M245.899 187.173c-5.752 0-10.414-4.663-10.414-10.414 0-13.433-10.928-24.362-24.362-24.362s-24.362 10.93-24.362 24.362c0 5.752-4.663 10.414-10.414 10.414-5.752 0-10.414-4.663-10.414-10.414 0-24.918 20.273-45.19 45.19-45.19s45.19 20.272 45.19 45.19c.001 5.751-4.662 10.414-10.414 10.414M421.798 187.173c-5.752 0-10.414-4.663-10.414-10.414 0-13.433-10.928-24.362-24.362-24.362s-24.362 10.93-24.362 24.362c0 5.752-4.663 10.414-10.414 10.414s-10.414-4.663-10.414-10.414c0-24.918 20.273-45.19 45.19-45.19s45.19 20.272 45.19 45.19c.001 5.751-4.662 10.414-10.414 10.414"></path>
                              </g>
                              <g fill="#F9A880">
                                <path d="M145.987 240.152c-19.011 0-34.423 15.412-34.423 34.423h68.848c-.002-19.011-15.414-34.423-34.425-34.423M446.251 235.539c-19.011 0-34.423 15.412-34.423 34.423h68.848c0-19.011-15.412-34.423-34.425-34.423"></path>
                              </g>
                              <path
                                fill="#F2F2F2"
                                d="M214.907 324.27v16.176c0 6.821 5.529 12.349 12.349 12.349h131.982c6.821 0 12.349-5.529 12.349-12.349V324.27z"
                              ></path>
                              <path
                                fill="#FC4C59"
                                d="M295.422 384.903c-28.011-13.014-59.094-11.123-84.3 2.374 18.94 24.686 48.726 40.616 82.245 40.616 14.772 0 28.809-3.112 41.526-8.682-9.329-14.434-22.706-26.519-39.471-34.308"
                              ></path>
                              <ellipse
                                cx="302.685"
                                cy="71.177"
                                fill="#FCEB88"
                                rx="29.854"
                                ry="53.46"
                                transform="rotate(-74.199 302.687 71.18)"
                              ></ellipse>
                            </g>
                        </svg>
                    </div>

                    {/* Success Heading */}
                    <div className="d-flex w-100 mt-3" style={{justifyContent:"center"}}>
                        <h3 className="fw-bold text-center">Transaction Successful</h3>
                    </div>

                    <div className="mt-4 px-2">
                        <p className="fw-bold">Transaction Details:</p>
                        <p style={{marginTop:"-10px"}}><span className="fw-bold">ID: </span>{showTransactionStatus.id}</p>
                        <p style={{marginTop:"-17px"}}><span className="fw-bold">Invoice: </span>{showTransactionStatus.invoice}</p>
                        <p style={{marginTop:"-17px"}}><span className="fw-bold">Amount: </span>{showTransactionStatus.amount}</p>
                        <p style={{marginTop:"-17px"}}><span className="fw-bold">Payment Method: </span>{showTransactionStatus.mode}</p>
                    </div>

                    <div className="d-flex mt-5 mb-3" style={{justifyContent:"center"}}>
                        {/* Invoice Button */}
                        <button onClick={()=>{
                            setShowLoadingModal(true);
                            axios.get(`${apiDomain}/invoice`,{params:{id:showTransactionStatus.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                            .then(res=>{
                                setShowLoadingModal(false);
                                window.open(URL.createObjectURL(res.data), '_blank');
                            })
                            .catch(error => {
                                setShowLoadingModal(false);
                                setShowMessageModal({show:true,type:"error",title:"Server Error",message:"Check Your Internet Connection or Try Again Later."});
                                console.error('Error fetching protected content:', error);
                            });
                        }} className="btn btn-teal mx-1"><i className="bi bi-receipt"></i> Invoice</button>
                        
                        
                        {/* Close Button */}
                        <button onClick={()=>{
                            setShowTransactionStatus(null);
                        }} className="btn btn-secondary mx-1"><i className="bi bi-x-square-fill"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const profileModal = () => {
        
        return showClientProfile === true ? <> 
                <Modal show={showClientProfile === true} 
                onHide={()=>{
                    setShowClientProfile(false);
                }}
                centered
                dialogClassName="profile-modal modal-content-custom"
                backdrop="static"
                keyboard={false}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                        <Modal.Title>Your Profile</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"#FAF9F6",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <center>
                        <img className="rounded-circle mt-2 border border-light img-fluid" style={{width:"115px",marginTop:"-10px"}} src={`data:image/png;base64,${clientData.picture}`} alt="Profile Picture" />
                        <h5 className="text-dark mt-2">{clientData.name}</h5>
                        <p className="text-secondary" style={{marginTop:"-10px"}}>{clientData.email}</p>
                    </center>

                    {/* EMAIL */}
                    {/* <p style={{marginLeft:"5px"}}><i className="bi bi-envelope-fill"></i> {clientData.email}</p> */}

                    {/* PHONE AND GENDER */}
                    <div className="d-flex" style={{marginTop:"-1px"}}>
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>Phone: </label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.phone} readOnly></input>
                        </div>
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>Gender: </label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.gender} readOnly></input>
                        </div>
                    </div>
                    
                    {/* ADDRESS */}
                    <label className="fw-bold mt-1" style={{marginLeft:"5px",marginBottom:"5px"}}>Address: </label>
                    <input type="text" className="form-control bg-light text-dark" value={clientData.address} readOnly></input>
                    
                    {/* CITY AND PINCODE */}
                    <div className="d-flex mt-1">
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>City: </label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.city} readOnly></input>
                        </div>
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>Pincode: </label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.area_code} readOnly></input>
                        </div>
                    </div>

                    {/* ID TYPE AND ID VALUE */}
                    <div className="d-flex mt-1">
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>Verification ID: </label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.id_type} readOnly></input>
                        </div>
                        <div className="mx-1">
                        <label className="fw-bold" style={{marginLeft:"5px",marginBottom:"5px"}}>ID Number:</label>
                        <input type="text" className="form-control bg-light text-dark" value={clientData.id_value} readOnly></input>
                        </div>
                    </div>

                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary mx-2 mt-4"
                        onClick={()=>setShowClientProfile(false)}
                        ><i className="bi bi-x-square-fill"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const contactModal = () => {
        
        return showContactModal === true ? <> 
                <Modal show={showContactModal === true} 
                onHide={()=>{
                    setShowContactModal(false);
                }}
                centered
                dialogClassName="profile-modal modal-content-custom"
                backdrop="static"
                keyboard={false}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                        <Modal.Title>Contact Us</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"#FAF9F6",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    
                    <div className="d-flex" style={{justifyContent:"center"}}>

                    <div className="mx-2">
                        {/* Whatsapp */}
                        <a className="btn" href="https://wa.me/919958557687" target="_blank">
                        <i className="bi bi-whatsapp" style={{fontSize:"50px",color:"green"}}></i>
                        </a>
                        <p className="text-center fw-bold" style={{marginTop:"-10px"}}>Whatsapp</p>
                    </div>
                    
                    <div className="mx-2">
                        {/* Email */}
                        <a className="btn" href="mailto:yadav.kunal.121@gmail.com" target="_blank">
                        <i className="bi bi-envelope-at-fill" style={{fontSize:"50px",color:"darkred"}}></i>    
                        </a>
                        <p className="text-center fw-bold" style={{marginTop:"-10px"}}>Email</p>
                    </div>
                    
                    {/* SMS */}
                    <div className="mx-2">
                        <a className="btn" href="sms:+919958557687" target="_blank">
                        <i className="bi bi-chat-dots-fill" style={{fontSize:"50px",color:"darkcyan"}}></i>
                        </a>
                        <p className="text-center fw-bold" style={{marginTop:"-10px"}}>SMS</p>
                    </div>

                    </div>

                    <hr />
                    {/* Contact Number, Email, Address */}
                    <div className="d-flex">
                        <div style={{width:"170px",marginLeft:"5px"}}>
                            <p className="mt-3 fw-bold"><i className="bi bi-telephone-fill text-primary"></i> Call:</p>
                            <p style={{marginTop:"-15px"}}>+91 9958557687</p>
                            <p style={{marginTop:"-20px"}}>+91 9311157687</p>
                            <p style={{marginTop:"-20px"}}>+91 9911666021</p>
                        </div>

                        <div style={{width:"190px"}}>
                            <p className="mt-3 fw-bold"><i className="bi bi-building-fill text-primary"></i> Address:</p>
                            <p style={{marginTop:"-15px"}}>102, Opp. Union Bank ATM, Rajokri, New Delhi 110038, India</p>
                        </div>
                    </div>
                    
                    <div className="d-flex">
                        <div style={{width:"300px",marginLeft:"5px"}}>
                            <p className="mt-3 fw-bold"><i className="bi bi-envelope-at-fill text-primary"></i> Email:</p>
                            <p style={{marginTop:"-15px"}}>gaurav@pulsenet.in</p>
                        </div>
                    </div>

                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary mx-2 mt-4"
                        onClick={()=>setShowContactModal(false)}
                        ><i className="bi bi-x-square-fill"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const yourPlanModal = () => {
        
        return showYourPlan === true ? <> 
                <Modal show={showYourPlan === true} 
                onHide={()=>{
                    setShowYourPlan(false);
                }}
                centered
                dialogClassName="profile-modal modal-content-custom"
                backdrop="static"
                keyboard={false}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                        <Modal.Title>Your Current Plan</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"#FAF9F6",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    <center>
                    <img className="mt-4" width={"150px"} src="data:image/png;base64,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" alt="" />
                    <p className="fw-bold mt-4 mb-2" style={{fontSize:"25px"}}>{clientData.plan_name}</p>
                    </center>
                    <hr />
                    <div className="px-3">
                        <p className="mt-4" style={{fontSize:"18px"}}><span className="fw-bold">Internet Speed: </span>{clientData.plan_speed} {clientData.speed_unit}</p>
                        <p style={{fontSize:"18px",marginTop:"-18px"}}><span className="fw-bold">Plan Validity: </span>{clientData.plan_validity} {clientData.validity_unit}</p>
                        <p style={{fontSize:"18px",marginTop:"-18px"}}><span className="fw-bold">Plan Cost: </span>&#8377; {clientData.plan_cost}</p>
                    </div>
                    <div className="mt-3 px-3"><small><i className="bi bi-arrow-return-right"></i> 18% GST Included in your Plan Cost.</small></div>
                    {/* Close Button */}
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary mx-2 mt-4"
                        onClick={()=>setShowYourPlan(false)}
                        ><i className="bi bi-x-square-fill"></i> Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
                </>
                :
                <></>
    }

    const payNowModal = () => {
        
        return showPayNow === true ? <> 
                <Modal show={showPayNow === true} 
                onHide={()=>{
                    setShowPayNow(false);
                    setDefaultRadioCheck(true)
                }}
                centered
                dialogClassName="profile-modal modal-content-custom"
                backdrop="static"
                keyboard={false}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal",borderTopLeftRadius:"1rem",borderTopRightRadius:"1rem"}}>
                        <Modal.Title>Online Payment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{backgroundColor:"#FAF9F6",color:"black",borderBottomLeftRadius:"1rem",borderBottomRightRadius:"1rem"}}>
                    {/* LOGO */}
                    <div className="d-flex mb-4 mt-4" style={{justifyContent:"center"}}>
                    <svg
                        width={"100px"}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#000"
                        version="1.1"
                        viewBox="0 0 512 512"
                        xmlSpace="preserve"
                    >
                      <g>
                        <path
                          fill="#FFD652"
                          d="M488.149 314.302H189.217c-8.781 0-15.901-7.119-15.901-15.901V113.954c0-8.781 7.119-15.901 15.901-15.901h298.932c8.781 0 15.901 7.119 15.901 15.901v184.447c0 8.782-7.12 15.901-15.901 15.901z"
                        ></path>
                        <path
                          fill="#5AC779"
                          d="M173.317 151.056H504.05V193.45800000000003H173.317z"
                        ></path>
                        <path fill="#FFF" d="M222.079 216.778H457.408V254.939H222.079z"></path>
                        <path
                          fill="#FB9D46"
                          d="M189.217 98.054c-8.781 0-15.901 7.119-15.901 15.901v184.447c0 8.781 7.119 15.901 15.901 15.901h130.385V98.054H189.217z"
                        ></path>
                        <path
                          fill="#00A085"
                          d="M173.317 151.056H319.603V193.45800000000003H173.317z"
                        ></path>
                        <path
                          fill="#E5E5E5"
                          d="M222.079 216.778H320.13300000000004V254.939H222.079z"
                        ></path>
                        <path
                          fill="#666"
                          d="M280.381 500.87H23.851c-8.781 0-15.901-7.119-15.901-15.901V63.072c0-8.781 7.119-15.901 15.901-15.901h256.53c8.781 0 15.901 7.119 15.901 15.901v421.896c0 8.782-7.12 15.902-15.901 15.902z"
                        ></path>
                        <path
                          fill="#4C4C4C"
                          d="M24.911 484.969V63.072c0-8.781 7.119-15.901 15.901-15.901H23.851c-8.781 0-15.901 7.119-15.901 15.901v421.896c0 8.781 7.119 15.901 15.901 15.901h16.961c-8.782.001-15.901-7.119-15.901-15.9z"
                        ></path>
                        <path
                          fill="#AFF078"
                          d="M246.46 314.302H57.772c-8.781 0-15.901-7.119-15.901-15.901v-57.242c0-8.781 7.119-15.901 15.901-15.901H246.46c8.781 0 15.901 7.119 15.901 15.901v57.242c-.001 8.782-7.12 15.901-15.901 15.901z"
                        ></path>
                        <g fill="#F2F2F2">
                          <path d="M246.46 225.259h-7.95l-89.043 89.043h36.571l76.046-76.046c-1.367-7.393-7.835-12.997-15.624-12.997z"></path>
                          <path d="M194.518 225.259L105.474 314.302 135.685 314.302 224.729 225.259z"></path>
                        </g>
                        <g fill="#B2B2B2">
                          <circle cx="75.793" cy="377.905" r="23.321"></circle>
                          <circle cx="228.439" cy="377.905" r="23.321"></circle>
                          <circle cx="152.116" cy="377.905" r="23.321"></circle>
                        </g>
                        <circle cx="75.793" cy="449.988" r="23.321" fill="#FF7452"></circle>
                        <circle cx="228.439" cy="449.988" r="23.321" fill="#5AC779"></circle>
                        <circle cx="152.116" cy="449.988" r="23.321" fill="#FFD652"></circle>
                        <path
                          fill="#F2F2F2"
                          d="M72.613 11.13h159.006c8.781 0 15.901 7.119 15.901 15.901v162.186H56.712V27.031c0-8.781 7.119-15.901 15.901-15.901z"
                        ></path>
                        <path
                          fill="#E5E5E5"
                          d="M106.232 11.13H72.613c-8.781 0-15.901 7.119-15.901 15.901v162.186h162.762L106.232 11.13z"
                        ></path>
                        <path d="M488.149 90.104h-73.143a7.95 7.95 0 000 15.9h73.143c4.384 0 7.95 3.566 7.95 7.95v29.151H304.232v-37.101h57.772a7.95 7.95 0 000-15.9h-57.772V63.072c0-13.152-10.699-23.851-23.851-23.851H255.47v-12.19c0-13.152-10.699-23.851-23.851-23.851H72.613c-13.152 0-23.851 10.699-23.851 23.851v12.19H23.851C10.699 39.222 0 49.921 0 63.072v143.106a7.95 7.95 0 0015.9 0V63.072c0-4.384 3.566-7.95 7.95-7.95h24.911v128.265h-11.13a7.95 7.95 0 000 15.9H266.6a7.95 7.95 0 000-15.9h-11.13V55.122h24.911c4.384 0 7.95 3.566 7.95 7.95v421.896c0 4.384-3.566 7.95-7.95 7.95H23.851c-4.384 0-7.95-3.566-7.95-7.95V263.42a7.95 7.95 0 00-15.901 0v221.549c0 13.152 10.699 23.851 23.851 23.851h256.53c13.152 0 23.851-10.699 23.851-23.851V322.253h183.917c13.152 0 23.851-10.699 23.851-23.851V113.954c0-13.151-10.699-23.85-23.851-23.85zM64.663 183.387V27.031c0-4.384 3.566-7.95 7.95-7.95h159.006c4.384 0 7.95 3.566 7.95 7.95v156.356H64.663zm431.436-24.381v26.501H304.232v-26.501h191.867zm-7.95 147.346H304.232V201.408h191.867v96.994c0 4.384-3.566 7.95-7.95 7.95z"></path>
                        <path d="M448.928 272.431H347.164a7.95 7.95 0 000 15.9h101.764a7.95 7.95 0 000-15.9zM270.311 298.402V241.16c0-13.152-10.699-23.851-23.851-23.851H57.772c-13.152 0-23.851 10.699-23.851 23.851v57.242c0 13.152 10.699 23.851 23.851 23.851H246.46c13.152 0 23.851-10.699 23.851-23.851zm-15.901 0c0 4.384-3.566 7.95-7.95 7.95H57.772c-4.384 0-7.95-3.566-7.95-7.95V241.16c0-4.384 3.566-7.95 7.95-7.95H246.46c4.384 0 7.95 3.566 7.95 7.95v57.242zM75.793 346.634c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271s31.271-14.029 31.271-31.271c0-17.243-14.028-31.271-31.271-31.271zm0 46.641c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371s15.371 6.896 15.371 15.371c0 8.476-6.896 15.371-15.371 15.371zM228.439 346.634c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271s31.271-14.029 31.271-31.271c0-17.243-14.028-31.271-31.271-31.271zm0 46.641c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371 8.475 0 15.371 6.896 15.371 15.371 0 8.476-6.896 15.371-15.371 15.371zM152.116 346.634c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271 17.243 0 31.271-14.029 31.271-31.271 0-17.243-14.028-31.271-31.271-31.271zm0 46.641c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371 8.475 0 15.371 6.896 15.371 15.371 0 8.476-6.896 15.371-15.371 15.371zM75.793 418.716c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271s31.271-14.029 31.271-31.271-14.028-31.271-31.271-31.271zm0 46.642c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371s15.371 6.896 15.371 15.371c0 8.476-6.896 15.371-15.371 15.371zM228.439 418.716c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271s31.271-14.029 31.271-31.271-14.028-31.271-31.271-31.271zm0 46.642c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371 8.475 0 15.371 6.896 15.371 15.371 0 8.476-6.896 15.371-15.371 15.371zM152.116 418.716c-17.243 0-31.271 14.029-31.271 31.271 0 17.243 14.029 31.271 31.271 31.271 17.243 0 31.271-14.029 31.271-31.271s-14.028-31.271-31.271-31.271zm0 46.642c-8.475 0-15.371-6.896-15.371-15.371 0-8.475 6.896-15.371 15.371-15.371 8.475 0 15.371 6.896 15.371 15.371 0 8.476-6.896 15.371-15.371 15.371zM101.234 55.122h59.362a7.95 7.95 0 000-15.9h-59.362a7.95 7.95 0 000 15.9zM202.998 90.104H101.234a7.95 7.95 0 000 15.9h101.764a7.95 7.95 0 000-15.9zM202.998 143.106H101.234a7.95 7.95 0 000 15.9h101.764a7.95 7.95 0 000-15.9z"></path>
                      </g>
                    </svg>
                    </div>
                    {/* RADIO BUTTONS */}
                    <div className="d-flex" style={{justifyContent:"center"}}>
                    <div className="form-check mx-2">
                        <input className={defaultRadioCheck ? "form-check-input" : "form-check-input bg-white"} onClick={event=>{setDefaultRadioCheck(true)}} type="radio" checked={defaultRadioCheck} readOnly/>
                        <label className="form-check-label fw-bold">
                            Plan Cost
                        </label>
                    </div>
                    <div className="form-check mx-2">
                        <input className={defaultRadioCheck ? "form-check-input bg-white" : "form-check-input"} onClick={event=>{setDefaultRadioCheck(false)}} type="radio" checked={!defaultRadioCheck} readOnly/>
                        <label className="form-check-label fw-bold">
                            Custom INR
                        </label>
                    </div>
                    </div>

                    <hr />

                    {/* AMOUNT INPUT */}
                    <div className="mt-4" style={{justifyContent:"center"}}>
                        <form onSubmit={(event)=>{
                            event.preventDefault();
                            const data = {amount:defaultRadioCheck ? clientData.plan_cost : customAmount};
                            createRazorPayOrder(data.amount);
                        }}>
                        <div className="d-flex" style={{justifyContent:"center"}}>
                        <div className="input-group" style={{width:"200px"}}>
                            <span style={{fontSize:"30px"}} className={defaultRadioCheck ? "input-group-text" : "input-group-text"}>₹</span>
                            <input type="number"
                            style={{fontSize:"30px"}}
                            className={defaultRadioCheck ? "form-control" : "form-control bg-white text-dark"} 
                            onChange={event=>{
                                    setCustomAmount(event.target.value);
                            }} 
                            value={defaultRadioCheck ? clientData.plan_cost : customAmount} 
                            readOnly={defaultRadioCheck}
                            min="1"
                            step="1"
                            required
                            />
                        </div>
                        <button type="submit" className="btn btn-success mx-2"><i className="bi bi-cash-stack" style={{fontSize:"25px"}}></i> Continue</button>
                        </div>
                        </form>
                    </div>

                    <div className="mt-5"><small><i className="bi bi-arrow-return-right"></i> 18% GST included in your Plan Cost.</small></div>
                    <div><small><i className="bi bi-arrow-return-right"></i> We do not Store your Card, UPI, etc.</small></div>
                    <div><small><i className="bi bi-arrow-return-right"></i> All Transactions are processed via Razorpay.</small></div>
                    <div><small><i className="bi bi-arrow-return-right"></i> Invoice will be generated after Transaction.</small></div>

                    {/* Close Button */}
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary mx-2 mt-4"
                        onClick={()=>{
                                    setShowPayNow(false);
                                    setDefaultRadioCheck(true);
                                }}
                        ><i className="bi bi-x-square-fill"></i> Close</button>
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

    // Function for loading javascripts in react
    const loadRazorpayScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Function for creating order for razorpay checkout
    const createRazorPayOrder = (amount) => {
        setShowLoadingModal(true);
        
        const body = { "amount": amount*100 };
        const headers = { "Authorization": `Bearer ${authToken}` };
        
        axios.post(`${apiDomain}/payment/create-order`,body,{headers})
            .then(res=>{
                if (res.data.result === true) {
                    setShowLoadingModal(false);
                    const order = res.data;
                    const options = {
                        key: RAZORPAY_KEY_ID,
                        amount: order.amount, // amount in paise
                        currency: "INR",
                        name: "CRM", // Replace With Your Company Name
                        description: "Transaction ID: "+order.transaction_id, // Replace With Suitable Description For Transaction
                        order_id: order.order_id,
                        handler: function (response) {
                                                        setShowPayNow(false);
                                                        setShowLoadingModal(true);
                                                        const payload = {
                                                                            razorpay_order_id: response.razorpay_order_id,
                                                                            razorpay_payment_id: response.razorpay_payment_id,
                                                                            razorpay_signature: response.razorpay_signature,
                                                                            amount: order.amount, // amount in paise
                                                                            transaction_id: order.transaction_id
                                                                        };
                                                        // Call backend to verify payment
                                                        axios.post(`${apiDomain}/payment/verify-order`,payload,{headers})
                                                        .then(response=>{
                                                            if (response.data.result === true) {
                                                                // Transaction is Successful
                                                                setShowLoadingModal(false);
                                                                setShowTransactionStatus(response.data.data);
                                                            }
                                                        })
                                                        .catch(error=>{
                                                            console.error("Payment Failed!",error);
                                                            setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Please check your internet connection, or try again later :("})
                                                        })
                        },
                        prefill: {
                          name: clientData.name,
                          email: clientData.email,
                          contact: clientData.phone,
                        },
                        theme: {
                          color: "#3399cc",
                        },
                    };
                    
                    // Initializing Razorpay Checkout
                    const razorpay = new window.Razorpay(options);
                    // When Transaction Failed
                    // razorpay.on('payment.failed', function (response){
                    //     alert("Transaction Failed!");
                    // });
                    razorpay.open();
                }
                else {
                    setShowLoadingModal(false);
                    setShowMessageModal({
                                    show:true,
                                    type:"error",
                                    title:"Error Occured",
                                    message:"Please check your internet connection, or try again later."
                                    });
                    console.error("Error occured during creating payment order");
                }
            })
            .catch(error=>{
                setShowLoadingModal(false);
                setShowMessageModal({
                                    show:true,
                                    type:"error",
                                    title:"Error Occured",
                                    message:"Please check your internet connection, or try again later."
                                    });
                console.error("Error occured during creating payment order",error);
            })
      };

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
        <div className="home-div-transparent rounded-2 container-fluid" style={{width:"370px",height:"650px",marginTop:"130px"}}>
            <center>

                <div className="d-flex justify-content-center">
                    {/* 
                        █▀█ ▄▀█ █▄█   █▄░█ █▀█ █░█░█
                        █▀▀ █▀█ ░█░   █░▀█ █▄█ ▀▄▀▄▀ */
                    }
                    <div className="d-flex mt-4">
                        <div className="container-fluid rounded-top-left client-home-btn" style={{width:"160px",height:"130px"}}
                        onClick={()=>setShowPayNow(true)}
                        >
                        <svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width={`105px`} height={`105px`} className="p-3" viewBox="0 0 64 64" enableBackground="new 0 0 64 64" xmlSpace="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><g><rect x="2" y="20" fill="#506C7F" width="60" height="8"></rect><g><path fill="#B4CCB9" d="M2,52c0,1.104,0.896,2,2,2h56c1.104,0,2-0.896,2-2V30H2V52z"></path><path fill="#B4CCB9" d="M60,10H4c-1.104,0-2,0.895-2,2v6h60v-6C62,10.895,61.104,10,60,10z"></path></g><path fill="#394240" d="M60,8H4c-2.211,0-4,1.789-4,4v40c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4V12C64,9.789,62.211,8,60,8z M62,52c0,1.104-0.896,2-2,2H4c-1.104,0-2-0.896-2-2V30h60V52z M62,28H2v-8h60V28z M62,18H2v-6c0-1.105,0.896-2,2-2h56c1.104,0,2,0.895,2,2V18z"></path><path fill="#394240" d="M11,40h14c0.553,0,1-0.447,1-1s-0.447-1-1-1H11c-0.553,0-1,0.447-1,1S10.447,40,11,40z"></path><path fill="#394240" d="M29,40h6c0.553,0,1-0.447,1-1s-0.447-1-1-1h-6c-0.553,0-1,0.447-1,1S28.447,40,29,40z"></path><path fill="#394240" d="M11,46h10c0.553,0,1-0.447,1-1s-0.447-1-1-1H11c-0.553,0-1,0.447-1,1S10.447,46,11,46z"></path><path fill="#394240" d="M45,46h8c0.553,0,1-0.447,1-1v-6c0-0.553-0.447-1-1-1h-8c-0.553,0-1,0.447-1,1v6C44,45.553,44.447,46,45,46z M46,40h6v4h-6V40z"></path><rect x="46" y="40" fill="#F9EBB2" width="6" height="4"></rect></g></g></svg>
                        <p className="" style={{marginTop:"-19px"}}>Pay Now</p>
                        </div>

                        {/* 
                        
                        █▄█ █▀█ █░█ █▀█   █▀█ █▀█ █▀█ █▀▀ █ █░░ █▀▀
                        ░█░ █▄█ █▄█ █▀▄   █▀▀ █▀▄ █▄█ █▀░ █ █▄▄ ██▄

                        */}
                        <div className="container-fluid rounded-top-right client-home-btn" style={{width:"160px",height:"130px"}} 
                        onClick={()=>setShowClientProfile(true)}
                        >
                        {/* <svg width="100px" height="100px" className="py-3 mt-1" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="user-circle-2" transform="translate(-2 -2)"><path id="secondary" fill="#a3f3ff" d="M12,3A9,9,0,0,0,5.55,18.27a7,7,0,0,1,4.28-3.92h0a4,4,0,1,1,4.34,0h0a7,7,0,0,1,4.28,3.92A9,9,0,0,0,12,3Z"></path><path id="primary" d="M16,11a4,4,0,1,1-4-4A4,4,0,0,1,16,11Zm-1.83,3.35a3.95,3.95,0,0,1-4.34,0,7,7,0,0,0-4.28,3.92,9,9,0,0,0,12.81.09l.09-.09a7,7,0,0,0-4.28-3.92ZM21,12h0a9,9,0,0,0-9-9h0a9,9,0,0,0-9,9H3a9,9,0,0,0,9,9h0a9,9,0,0,0,9-9Z" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.1"></path></g></g></svg> */}
                        <img className="rounded-circle img-fluid mt-2" style={{width:"92px", paddingTop:"10px", paddingLeft:"10px", paddingRight:"10px", paddingBottom:"5px"}} src={`data:image/png;base64,${clientData.picture}`} alt="Profile Picture" />
                        <p className="" style={{marginTop:"-8px"}}>Your Profile</p>
                        </div>
                    </div>
                </div>

                    {/* 
                        █▄█ █▀█ █░█ █▀█   █▀█ █░░ ▄▀█ █▄░█
                        ░█░ █▄█ █▄█ █▀▄   █▀▀ █▄▄ █▀█ █░▀█
                    */}

                <div className="d-flex justify-content-center">
                    <div className="d-flex">
                        <div className="container-fluid rounded-bottom-left client-home-btn" style={{width:"160px",height:"130px"}}
                        onClick={()=>{setShowYourPlan(true)}}
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlSpace="preserve"
                            id="Layer_1"
                            width="100px"
                            height="100px"
                            className="p-3"
                            fill="#000"
                            version="1.1"
                            viewBox="0 0 504 504"
                        >
                            <g id="SVGRepo_iconCarrier">
                              <circle cx="252" cy="252" r="252" fill="#90DFAA"></circle>
                              <g fill="#FFF">
                                <path d="M222.1 167.1c-1.2 0-2.5-.5-3.4-1.4-18.4-18.4-18.4-48.3 0-66.6 1.9-1.9 5-1.9 6.9 0s1.9 5 0 6.9c-14.6 14.6-14.6 38.3 0 52.9 1.9 1.9 1.9 5 0 6.9-1 .8-2.2 1.3-3.5 1.3M281.9 167.1c-1.2 0-2.5-.5-3.4-1.4-1.9-1.9-1.9-5 0-6.9 14.6-14.6 14.6-38.3 0-52.9-1.9-1.9-1.9-5 0-6.9s5-1.9 6.9 0c18.4 18.4 18.4 48.3 0 66.6-1 1-2.3 1.5-3.5 1.5"></path>
                                <path d="M204.6 184.6c-1.2 0-2.5-.5-3.4-1.4-28-28-28-73.7 0-101.7 1.9-1.9 5-1.9 6.9 0s1.9 5 0 6.9c-24.2 24.2-24.2 63.7 0 87.9 1.9 1.9 1.9 5 0 6.9-1 1-2.3 1.4-3.5 1.4M299.4 184.6c-1.2 0-2.5-.5-3.4-1.4-1.9-1.9-1.9-5 0-6.9 24.2-24.2 24.2-63.7 0-87.9-1.9-1.9-1.9-5 0-6.9s5-1.9 6.9 0c28 28 28 73.7 0 101.7-1 1-2.2 1.4-3.5 1.4"></path>
                                <path d="M185.3 203.9c-1.2 0-2.5-.5-3.4-1.4-38.7-38.7-38.7-101.6 0-140.2 1.9-1.9 5-1.9 6.9 0s1.9 5 0 6.9c-34.9 34.9-34.9 91.6 0 126.5 1.9 1.9 1.9 5 0 6.9-1 .8-2.2 1.3-3.5 1.3M318.7 203.9c-1.2 0-2.5-.5-3.4-1.4-1.9-1.9-1.9-5 0-6.9 34.9-34.9 34.9-91.6 0-126.5-1.9-1.9-1.9-5 0-6.9s5-1.9 6.9 0c38.7 38.7 38.7 101.6 0 140.2-1 1-2.3 1.5-3.5 1.5"></path>
                              </g>
                              <path
                                fill="#2C9984"
                                d="M30.7 372.6C73.4 450.9 156.5 504 252 504s178.6-53.1 221.3-131.4z"
                              ></path>
                              <g fill="#2B3B4E">
                                <path d="M274.3 273.2h-44.6l15-134.3c.4-3.7 3.6-6.6 7.3-6.6 3.8 0 6.9 2.8 7.3 6.6zM364.4 354.4h36.9v18.7h-36.9zM102.7 354.4h36.9v18.7h-36.9z"></path>
                              </g>
                              <path
                                fill="#324A5E"
                                d="M424.1 356.6H79.9c-1.9 0-3.5-1.6-3.5-3.5v-83.7c0-1.9 1.6-3.5 3.5-3.5h344.2c1.9 0 3.5 1.6 3.5 3.5v83.7c0 2-1.6 3.5-3.5 3.5"
                              ></path>
                              <path fill="#E6E9EE" d="M102.7 266h298.5v62H102.7z"></path>
                              <circle cx="136.4" cy="297" r="15.6" fill="#FF7058"></circle>
                              <circle cx="232.5" cy="297" r="7.8" fill="#2C9984"></circle>
                              <circle cx="264.3" cy="297" r="7.8" fill="#324A5E"></circle>
                              <circle cx="296.1" cy="297" r="7.8" fill="#FFD05B"></circle>
                              <circle cx="327.9" cy="297" r="7.8" fill="#54C0EB"></circle>
                              <circle cx="359.7" cy="297" r="7.8" fill="#FF7058"></circle>
                            </g>
                        </svg>
                        <p className="" style={{marginTop:"-10px"}}>Your Plan</p>
                        </div>

                    {/* 
                        █▀▀ █▀█ █▄░█ ▀█▀ ▄▀█ █▀▀ ▀█▀   █░█ █▀
                        █▄▄ █▄█ █░▀█ ░█░ █▀█ █▄▄ ░█░   █▄█ ▄█
                    */}
                        <div className="container-fluid rounded-bottom-right client-home-btn" style={{width:"160px",height:"130px"}}
                        onClick={()=>setShowContactModal(true)}
                        >
                        <svg width="95px" height="95px" viewBox="0 0 1024 1024" className="icon py-2 mb-1" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M66 485.5a399.2 315.1 0 1 0 798.4 0 399.2 315.1 0 1 0-798.4 0Z" fill="#FF5086"></path><path d="M198.6 666.6L148 866.1l197.3-80z" fill="#FF5086"></path><path d="M906.9 528.5C900.4 672.9 756.6 836 564.7 836c-30.9 0-60 1.3-88.6-4.3 50.1 34.6 118.4 43.7 191.5 43.7 155.9 0 269.3-84.5 276.1-212.4 3-56.3-19-106.4-36.8-134.5z" fill="#48A4FF"></path><path d="M890.3 764.4l35.8 135.5-139.5-54.3z" fill="#48A4FF"></path><path d="M309.6 470m-46.6 0a46.6 46.6 0 1 0 93.2 0 46.6 46.6 0 1 0-93.2 0Z" fill="#FFFFFF"></path><path d="M465.6 470m-46.6 0a46.6 46.6 0 1 0 93.2 0 46.6 46.6 0 1 0-93.2 0Z" fill="#FFFFFF"></path><path d="M620.8 470m-46.6 0a46.6 46.6 0 1 0 93.2 0 46.6 46.6 0 1 0-93.2 0Z" fill="#FFFFFF"></path></g></svg>
                        <p className="" style={{marginTop:"-12px"}}>Contact Us</p>
                        </div>
                    </div>
                </div>

                    {/* 
                        ▀█▀ █▀█ ▄▀█ █▄░█ █▀ ▄▀█ █▀▀ ▀█▀ █ █▀█ █▄░█   █▀▄ █▀▀ ▀█▀ ▄▀█ █ █░░ █▀
                        ░█░ █▀▄ █▀█ █░▀█ ▄█ █▀█ █▄▄ ░█░ █ █▄█ █░▀█   █▄▀ ██▄ ░█░ █▀█ █ █▄▄ ▄█
                    */}

                {/* Transaction Exist */}
                { transactionData != null ? <>
                        <div className="bg-light rounded-3 mt-3" style={{width:"320px",height:"320px"}}>
                                <div className="container-fluid rounded-top-3 border-top border-1 bg-dark text-dark" style={{width:"320px",height:"85px"}}>
                                    <p className="mt-3 fw-bold text-light">Your Recent Transaction Detail</p>
                                    <p className="text-light" style={{marginTop:"-15px"}}><span>{formatDate(transactionData.date)}, {formatTime(transactionData.transaction_timestamp)}</span></p>
                                    <hr />
                                </div>

                                <div className="container-fluid" style={{textAlign:"center"}}>
                                    <p className="text-dark fw-bold mt-2" style={{fontSize:"40px"}}><span>&#8377;</span>{transactionData.amount}</p>
                                    <center>
                                        <p className="text-light rounded-2 bg-success fw-bold" style={{width:"150px",marginTop:"-20px"}}>PAID</p>
                                    </center>
                                    <p className="text-dark mx-2" style={{textAlign:"left",marginTop:"-10px"}}><span className="fw-bold">ID: </span><span>{transactionData.id}</span></p>
                                    <p className="text-dark mx-2" style={{textAlign:"left",marginTop:"-18px"}}><span className="fw-bold">Invoice No: </span><span>{transactionData.invoice}</span></p>
                                    <p className="text-dark mx-2" style={{textAlign:"left",marginTop:"-18px"}}><span className="fw-bold">Mode: </span><span>{transactionData.mode}</span></p>
                                    {/* View Receipt Button */}
                                    <button className="btn btn-muted fw-bold border invoice-button" onClick={()=>{
                                            setShowLoadingModal(true);
                                            axios.get(`${apiDomain}/invoice`,{params:{id:transactionData.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                                            .then(res=>{
                                                setShowLoadingModal(false);
                                                window.open(URL.createObjectURL(res.data), '_blank');
                                            })
                                            .catch(error => {
                                                setShowLoadingModal(false);
                                                setShowMessageModal({show:true,title:"Server Error",type:"error",message:"Check Your Internet Connection or Try Again Later."});
                                                console.error('Error fetching protected content:', error);
                                            });
                                    }} style={{marginTop:"-1px"}}><i className="bi bi-receipt"></i> View Receipt</button>

                                </div>
                        </div>
                    </> 
                    :
                    <>
                        {/* No Transactions Done Yet */}
                        <div className="mt-4 bg-light rounded-3" style={{width:"320px",height:"320px"}}>
                                <div className="container-fluid rounded-top-3 border-top border-1 bg-dark text-dark" style={{width:"320px",height:"85px"}}>
                                    <p className="mt-4 fw-bold text-light">Your Recent Transaction Detail</p>
                                    <hr />
                                </div>

                                <div className="container-fluid" style={{textAlign:"center"}}>
                                    <svg className="mt-3" width={"100px"} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M512.004 512.002m-491.988 0a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0Z" fill="#FDDF6D"/><path d="M617.43 931.354c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.056 155.124 20.016 320.824 20.016 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.308-143.124 53.666-223.67 53.666z" fill="#FCC56B"/><path d="M735.828 834.472H496.912c-11.056 0-20.014-8.958-20.014-20.014s8.958-20.014 20.014-20.014h238.914c11.056 0 20.014 8.958 20.014 20.014s-8.956 20.014-20.012 20.014zM442.172 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188 7.082-8.484 19.702-9.62 28.188-2.536 17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.732-6.776 21.3-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.524 20.58-70.554 32.866-117.774 32.866zM789.346 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188s19.706-9.62 28.188-2.536c17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.73-6.776 21.304-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.526 20.58-70.554 32.866-117.774 32.866zM347.382 526.08c-7.438 0-14.36-0.836-20.53-2.544-10.654-2.946-16.9-13.972-13.954-24.628 2.948-10.654 13.984-16.904 24.628-13.954 9.852 2.73 30.072 0.814 53.044-9.608 22.486-10.194 37.75-24.62 42.904-34.39 5.156-9.78 17.26-13.528 27.038-8.368 9.778 5.156 13.524 17.264 8.368 27.038-10.488 19.886-33.582 39.392-61.778 52.178-20.608 9.346-41.672 14.276-59.72 14.276zM878.98 526.08c-18.05 0-39.108-4.928-59.724-14.278-28.194-12.782-51.288-32.288-61.774-52.174-5.158-9.776-1.41-21.882 8.368-27.038 9.778-5.164 21.882-1.406 27.038 8.368 5.156 9.77 20.418 24.194 42.898 34.388 22.974 10.42 43.2 12.338 53.044 9.61 10.666-2.938 21.68 3.298 24.628 13.952 2.946 10.654-3.298 21.68-13.952 24.628-6.166 1.706-13.09 2.544-20.526 2.544z" fill="#7F184C"/><path d="M711.124 40.168c-10.176-4.304-21.922 0.464-26.224 10.646s0.464 21.926 10.646 26.224c175.212 74.03 288.428 244.764 288.428 434.96 0 260.248-211.724 471.97-471.968 471.97S40.03 772.244 40.03 511.998 251.756 40.03 512.002 40.03c11.056 0 20.014-8.958 20.014-20.014S523.058 0 512.002 0c-282.32 0-512 229.68-512 511.998 0 282.32 229.68 512.002 512 512.002C794.318 1024 1024 794.32 1024 512c0.002-206.322-122.812-391.528-312.876-471.832z" fill=""/><path d="M496.912 794.444c-11.056 0-20.014 8.958-20.014 20.014s8.958 20.014 20.014 20.014h238.914c11.056 0 20.014-8.958 20.014-20.014s-8.958-20.014-20.014-20.014H496.912zM350.194 564.46c-8.488-7.088-21.106-5.948-28.188 2.536-7.086 8.486-5.948 21.106 2.536 28.188 24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.778-8.738-19.348-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.408-0.002-74.514-9.43-91.984-24.014zM671.714 595.184c24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.776-8.738-19.35-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.404 0-74.508-9.426-91.98-24.012-8.486-7.088-21.104-5.948-28.188 2.536-7.09 8.48-5.954 21.104 2.532 28.186zM347.382 526.08c18.048 0 39.108-4.926 59.718-14.272 28.196-12.786 51.294-32.29 61.778-52.176 5.158-9.776 1.41-21.882-8.368-27.038-9.778-5.164-21.882-1.41-27.038 8.368-5.156 9.77-20.418 24.194-42.904 34.388-22.972 10.42-43.19 12.34-53.042 9.608-10.646-2.936-21.68 3.298-24.628 13.952-2.946 10.65 3.296 21.68 13.952 24.628 6.17 1.704 13.094 2.542 20.532 2.542zM819.26 511.808c20.616 9.346 41.674 14.272 59.722 14.272 7.434 0 14.362-0.836 20.532-2.546 10.65-2.948 16.896-13.976 13.946-24.628a20.004 20.004 0 0 0-24.628-13.946c-9.842 2.714-30.062 0.812-53.042-9.61-22.48-10.192-37.746-24.618-42.898-34.388-5.156-9.778-17.26-13.53-27.038-8.368-9.778 5.156-13.524 17.264-8.368 27.038 10.482 19.888 33.576 39.39 61.774 52.176z" fill=""/><path d="M638.204 37.682m-20.014 0a20.014 20.014 0 1 0 40.028 0 20.014 20.014 0 1 0-40.028 0Z" fill=""/></svg>
                                    <p className="text-dark mx-2 fw-bold" style={{textAlign:"center", fontSize:"22px"}}>No Transaction Found</p>
                                    <p className="text-dark" style={{marginTop:"-18px"}}>Do Your First Transaction</p>
                                    <button className="btn btn-dark" onClick={()=>setShowPayNow(true)}><i className="bi bi-currency-rupee"></i>Pay Now</button>

                                </div>
                        </div>
                    </>
                }
                
            </center>
            {loadingModal()}
            {messageModal()}
            {profileModal()}
            {contactModal()}
            {yourPlanModal()}
            {payNowModal()}
            {transactionStatusModal()}
            <Review {...{apiDomain,authToken,showFeedbackModal,setShowFeedbackModal,setShowLoadingModal,setShowMessageModal}} />
        </div>
        </>
    }
}