import { useEffect,useState,useRef } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";


// █▀▀ █▀▀ ▀█▀ █▀▀ █░█   ▀█▀ ▄▀█ █▀█ █ █▀▀ █▀▀   █▀█ █░░ ▄▀█ █▄░█ █▀
// █▀░ ██▄ ░█░ █▄▄ █▀█   ░█░ █▀█ █▀▄ █ █▀░ █▀░   █▀▀ █▄▄ █▀█ █░▀█ ▄█
// Fetching Tariff Plans From Backend Database
const fetchTariffPlans = async (apiDomain, authToken, setTariffData) => {
    const headers = {"Authorization": `Bearer ${authToken}`};
    await axios.get(`${apiDomain}/admin/tariff`, { headers })
    .then(res=>{
        if(res.data.result === true){
            // Fetched Tariff Plans Data
            setTariffData(res.data.data);
        }
        // No Tariff Plans in Database
        else if(res.data.result === false){
            setTariffData(null)
        }
    })
    .catch (error => {
        setTariffData("error")
        console.error('Error fetching tariff plans:', error);
    })
};

// █▀▀ █░█ █▄░█ █▀▀ ▀█▀ █ █▀█ █▄░█   █▄▄ █▀▀ █▀▀ █ █▄░█ █▀
// █▀░ █▄█ █░▀█ █▄▄ ░█░ █ █▄█ █░▀█   █▄█ ██▄ █▄█ █ █░▀█ ▄█

export default function TariffPlans({authToken, apiDomain}){

    // announcementData For Handling Multiple Scinarios (loading,error,null)
    const [tariffData, setTariffData] = useState("loading");
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState({
                                                                show:false,
                                                                type:"",
                                                                title:"",
                                                                message:""});
    
    // State For Creating New Plans
    const [ newPlanData, setNewPlanData ] = useState(null);

    // State For Showing Existing Plan in Detail
    const [ showPlanDetailModal, setShowPlanDetailModal ] = useState(null);

    // State For Updating Plan
    const [ updatePlanData, setUpdatePlanData ] = useState(null);

    // State For Deleting Plan
    const [ deletePlanData, setDeletePlanData ] = useState(null);

    // Detail Modal Nav State
    const [navSection, setNavSection] = useState("Plan Detail");

    // Plan Subscriber Data
    const [subscriberList, setSubscriberList] = useState(null);

    // Plan Migration List Data - it stores list of plans which users can be migrated to.
    const [migrationList, setMigrationList] = useState(null);
    


// █▀▄▀█ █▀▀ █▀ █▀ ▄▀█ █▀▀ █▀▀   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
// █░▀░█ ██▄ ▄█ ▄█ █▀█ █▄█ ██▄   █░▀░█ █▄█ █▄▀ █▀█ █▄▄
    // Modal For Showing API Responses and Errors
    const messageModal = () => {
        return (
            <>
                <Modal 
                    centered
                    style={{backgroundColor:"rgba(0,0,0,0.7)"}}
                    show={showMessageModal.show === true && showMessageModal.hasOwnProperty("title") && showMessageModal.hasOwnProperty("message")} 
                    onHide={()=>{
                        setShowMessageModal({show:false,type:"",title:"",message:""});
                        // Refreshing Tariff Plans
                        fetchTariffPlans(apiDomain, authToken, setTariffData);
                        }}
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header className={showMessageModal.type === "error" ? "bg-danger" : ""} style={showMessageModal.type === "error" ? {} : {backgroundColor:"teal"}} closeButton>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="bg-light text-dark">
                        <p>{showMessageModal.message}</p>
                        <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            {/* Close Message Modal Button */}
                            <button className="btn btn-secondary" 
                                onClick={()=>{
                                                setShowMessageModal({show:false,type:"",title:"",message:""});
                                                // Refreshing Tariff Plans
                                                fetchTariffPlans(apiDomain, authToken, setTariffData);
                                        }}>
                                <i className="bi bi-x-square-fill"></i> Close
                            </button>
                        </div>
                    </Modal.Body>
                </Modal>
            </>
        )
    }


    // █░░ █▀█ ▄▀█ █▀▄ █ █▄░█ █▀▀   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
    // █▄▄ █▄█ █▀█ █▄▀ █ █░▀█ █▄█   █░▀░█ █▄█ █▄▀ █▀█ █▄▄

    // Modal For Showing Loading Status
    const loadingModal = () => {
        return (
            <Modal 
                centered
                style={{backgroundColor:"rgba(0,0,0,0.7)"}}
                show={showLoadingModal === true} 
                backdrop="static" 
                keyboard={false}
            >
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


    // █▀▀ █▀█ █▀▀ ▄▀█ ▀█▀ █▀▀   █▀█ █░░ ▄▀█ █▄░█   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
    // █▄▄ █▀▄ ██▄ █▀█ ░█░ ██▄   █▀▀ █▄▄ █▀█ █░▀█   █░▀░█ █▄█ █▄▀ █▀█ █▄▄
    const createPlanModal = () => {
        return (
            <>
            {newPlanData != null && 
                <Modal
                    show={newPlanData!=null}
                    onHide={()=>setNewPlanData(null)}
                    centered
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header style={{backgroundColor:"teal"}} closeButton>
                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                            <div>
                                <h3>New Tariff Plan</h3>
                            </div>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                        <div className="d-flex p-4" style={{justifyContent:"center"}}>
                        <svg
                            height="120px"
                            width="120px"
                            version="1.1"
                            id="Layer_1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 503.607 503.607"
                            xmlSpace="preserve"
                            fill="#000000"
                        >
                            <g>
                                <g transform="translate(1 1)">
                                    <g>
                                        <polygon style={{ fill: "#FFE100" }} points="435.459,7.393 443.852,208.836 410.279,208.836 418.672,7.393" />
                                        <polygon style={{ fill: "#FFE100" }} points="401.885,317.951 452.246,317.951 452.246,208.836 401.885,208.836" />
                                        <polygon style={{ fill: "#FFE100" }} points="82.934,7.393 91.328,208.836 57.754,208.836 66.148,7.393" />
                                        <polygon style={{ fill: "#FFE100" }} points="49.361,317.951 99.721,317.951 99.721,208.836 49.361,208.836" />
                                        <polygon style={{ fill: "#FFE100" }} points="49.361,494.213 116.508,494.213 116.508,469.033 49.361,469.033" />
                                        <polygon style={{ fill: "#FFE100" }} points="385.098,494.213 452.246,494.213 452.246,469.033 385.098,469.033" />
                                        <path style={{ fill: "#FFE100" }} d="M24.18,317.951c-9.233,0-16.787,7.554-16.787,16.787v117.508c0,9.233,7.554,16.787,16.787,16.787h453.246c9.233,0,16.787-7.554,16.787-16.787V334.738c0-9.233-7.554-16.787-16.787-16.787H24.18z" />
                                    </g>
                                    <path style={{ fill: "#FFA800" }} d="M477.426,452.246V334.738c0-9.233-7.554-16.787-16.787-16.787h16.787c9.233,0,16.787,7.554,16.787,16.787v117.508c0,9.233-7.554,16.787-16.787,16.787h-16.787C469.872,469.033,477.426,461.479,477.426,452.246" />
                                    <path style={{ fill: "#FFFFFF" }} d="M24.18,452.246V334.738c0-9.233,7.554-16.787,16.787-16.787H24.18c-9.233,0-16.787,7.554-16.787,16.787v117.508c0,9.233,7.554,16.787,16.787,16.787h16.787C31.734,469.033,24.18,461.479,24.18,452.246" />
                                    <path d="M477.426,477.426H24.18C9.911,477.426-1,466.515-1,452.246V334.738c0-14.269,10.911-25.18,25.18-25.18h453.246c14.269,0,25.18,10.911,25.18,25.18v117.508C502.607,466.515,491.695,477.426,477.426,477.426z M24.18,326.344c-5.036,0-8.393,3.357-8.393,8.393v117.508c0,5.036,3.357,8.393,8.393,8.393h453.246c5.036,0,8.393-3.357,8.393-8.393V334.738c0-5.036-3.357-8.393-8.393-8.393H24.18z" />
                                    <path d="M443.852,217.229h-33.574c-2.518,0-4.197-0.839-5.875-2.518c-1.679-1.679-2.518-4.197-2.518-5.875l8.393-201.443c0-4.197,4.197-8.393,8.393-8.393h16.787c4.197,0,8.393,3.357,8.393,8.393l8.393,199.764c0,0.839,0,1.679,0,1.679C452.246,213.033,448.888,217.229,443.852,217.229z M418.672,200.443h16.787l-8.393-184.656l0,0L418.672,200.443z" />
                                    <path d="M452.246,250.803h-50.361c-5.036,0-8.393-3.357-8.393-8.393s3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393S457.282,250.803,452.246,250.803z" />
                                    <path d="M452.246,284.377h-50.361c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393S457.282,284.377,452.246,284.377z" />
                                    <path d="M116.508,502.607H49.361c-5.036,0-8.393-3.357-8.393-8.393v-25.18c0-5.036,3.357-8.393,8.393-8.393h67.148c5.036,0,8.393,3.357,8.393,8.393v25.18C124.902,499.249,121.544,502.607,116.508,502.607z M57.754,485.82h50.361v-8.393H57.754V485.82z" />
                                    <path d="M452.246,502.607h-67.148c-5.036,0-8.393-3.357-8.393-8.393v-25.18c0-5.036,3.357-8.393,8.393-8.393h67.148c5.036,0,8.393,3.357,8.393,8.393v25.18C460.639,499.249,457.282,502.607,452.246,502.607z M393.492,485.82h50.361v-8.393h-50.361V485.82z" />
                                    <path d="M452.246,326.344h-50.361c-5.036,0-8.393-3.357-8.393-8.393V208.836c0-5.036,3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393v109.115C460.639,322.987,457.282,326.344,452.246,326.344z M410.279,309.557h33.574v-92.328h-33.574V309.557z" />
                                    <path d="M91.328,217.229h-33.574c-2.518,0-4.197-0.839-5.875-2.518c-1.679-1.679-2.518-4.197-2.518-6.715l8.393-201.443c0-4.197,4.197-8.393,8.393-8.393h16.787c4.197,0,8.393,3.357,8.393,8.393l8.393,199.764c0,0.839,0,1.679,0,1.679C99.721,213.033,96.364,217.229,91.328,217.229z M66.148,200.443h16.787L74.541,15.787l0,0L66.148,200.443z" />
                                    <path d="M99.721,250.803H49.361c-5.036,0-8.393-3.357-8.393-8.393s3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393S104.757,250.803,99.721,250.803z" />
                                    <path d="M99.721,284.377H49.361c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393S104.757,284.377,99.721,284.377z" />
                                    <path d="M99.721,326.344H49.361c-5.036,0-8.393-3.357-8.393-8.393V208.836c0-5.036,3.357-8.393,8.393-8.393h50.361c5.036,0,8.393,3.357,8.393,8.393v109.115C108.115,322.987,104.757,326.344,99.721,326.344z M57.754,309.557h33.574v-92.328H57.754V309.557z" />
                                    <path style={{ fill: "#63D3FD" }} d="M292.77,393.492c0,23.502-18.466,41.967-41.967,41.967s-41.967-18.466-41.967-41.967 c0-23.502,18.466-41.967,41.967-41.967S292.77,369.99,292.77,393.492" />
                                    <path style={{ fill: "#3DB9F9" }} d="M250.803,351.525c-4.197,0-8.393,0.839-12.59,2.518c16.787,5.036,29.377,20.984,29.377,39.449 s-12.59,34.413-29.377,39.449c4.197,1.679,8.393,2.518,12.59,2.518c23.502,0,41.967-18.466,41.967-41.967C292.77,369.99,274.305,351.525,250.803,351.525" />
                                    <path d="M250.803,443.852c-27.698,0-50.361-22.662-50.361-50.361c0-27.698,22.662-50.361,50.361-50.361 s50.361,22.662,50.361,50.361C301.164,421.19,278.502,443.852,250.803,443.852z M250.803,359.918c-18.466,0-33.574,15.108-33.574,33.574s15.108,33.574,33.574,33.574s33.574-15.108,33.574-33.574S269.269,359.918,250.803,359.918z" />
                                    <path d="M66.148,401.885H49.361c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C74.541,398.528,71.184,401.885,66.148,401.885z" />
                                    <path d="M116.508,401.885H99.721c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C124.902,398.528,121.544,401.885,116.508,401.885z" />
                                    <path d="M166.869,401.885h-16.787c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C175.262,398.528,171.905,401.885,166.869,401.885z" />
                                    <path d="M351.525,401.885h-16.787c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C359.918,398.528,356.561,401.885,351.525,401.885z" />
                                    <path d="M401.885,401.885h-16.787c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C410.279,398.528,406.921,401.885,401.885,401.885z" />
                                    <path d="M452.246,401.885h-16.787c-5.036,0-8.393-3.357-8.393-8.393c0-5.036,3.357-8.393,8.393-8.393h16.787c5.036,0,8.393,3.357,8.393,8.393C460.639,398.528,457.282,401.885,452.246,401.885z" />
                                </g>
                            </g>
                        </svg>
                        </div>
                        {/*                         
                        █▀▀ █▀█ █▀▀ ▄▀█ ▀█▀ █▀▀   █▀▀ █▀█ █▀█ █▀▄▀█
                        █▄▄ █▀▄ ██▄ █▀█ ░█░ ██▄   █▀░ █▄█ █▀▄ █░▀░█ */}
                        <form className="px-2" onSubmit={(event)=>{
                                                event.preventDefault();
                                                setShowLoadingModal(true);

                                                const body = {
                                                    plan_name : event.target[0].value.toUpperCase(),
                                                    plan_speed : event.target[1].value,
                                                    speed_unit : event.target[2].value,
                                                    plan_validity : event.target[3].value,
                                                    validity_unit : event.target[4].value,
                                                    plan_cost : event.target[5].value
                                                }

                                                const headers = {'Authorization':`Bearer ${authToken}`}
                                                axios.post(`${apiDomain}/admin/tariff`,body,{headers})
                                                .then(res=>{
                                                    if (res.data.result === true){
                                                        setShowLoadingModal(false);
                                                        setNewPlanData(null);
                                                        setShowMessageModal({show:true,type:"success",title:"Server Response",message:res.data.message});
                                                    }
                                                    else {
                                                        setShowLoadingModal(false);
                                                        setShowMessageModal({show:true,type:"error",title:"Error Occured",message:res.data.message});
                                                    }
                                                })
                                                .catch(error=>{
                                                    setShowLoadingModal(false);
                                                    setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Failed!, Please Check Your Internet Connection or Try  Again Later :("});
                                                })
                            }}>
                            {/* Plan Name */}
                            <div className="form-group">
                                <label className="fw-bold mb-1">Plan Name</label>
                                <input className="form-control bg-light text-dark" type="text" placeholder="Enter Plan Name" required />
                            </div>


                            <div className="d-flex w-100 mt-2">

                                <div className="d-flex w-100" style={{justifyContent:"center",marginRight:"5px"}}>
                                    {/* Plan Speed */}
                                    <div className="form-group mt-2 w-100">
                                        <label className="fw-bold mb-1">Internet Speed</label>
                                        <input className="form-control bg-light text-dark" placeholder="Enter Speed" style={{border: "solid", borderWidth: "1px", borderColor: "black", borderRight: "none", borderTopRightRadius:"0px", borderBottomRightRadius:"0px"}} type="number" step={1} min={1} required />
                                    </div>
                                    {/* Speed Measurement Unit */}
                                    <div className="form-group mt-2 py-1">
                                        <select className="form-control bg-light text-dark mt-4" style={{width:"98px", border: "solid", borderWidth: "1px", borderColor: "black", borderTopLeftRadius:"0px", borderBottomLeftRadius:"0px"}} type="text" defaultValue={"Mbps"} required>
                                                <option value="Kbps">Kbps</option>
                                                <option value="Mbps">Mbps</option>
                                                <option value="Gbps">Gbps</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="d-flex w-100" style={{justifyContent:"center",marginLeft:"5px"}}>
                                    {/* Plan Validity */}
                                    <div className="form-group mt-2 w-100">
                                        <label className="fw-bold mb-1">Plan Validity</label>
                                        <input className="form-control bg-light text-dark" placeholder="Enter Duration" style={{border: "solid", borderWidth: "1px", borderColor: "black", borderRight: "none", borderTopRightRadius:"0px", borderBottomRightRadius:"0px"}} type="number" step={1} min={1} required />
                                    </div>
                                    {/* Validity Measurement Unit */}
                                    <div className="form-group mt-2 py-1">
                                        <select className="form-control bg-light text-dark mt-4" style={{width:"90px", border: "solid", borderWidth: "1px", borderColor: "black", borderTopLeftRadius:"0px", borderBottomLeftRadius:"0px"}} type="text" defaultValue={"Days"} required>
                                                <option value="Days">Days</option>
                                                <option value="Month">Month</option>
                                                <option value="Year">Year</option>
                                        </select>
                                    </div>
                                </div>

                            </div>

                            {/* Plan Cost */}
                            <div className="form-group mt-2">
                                <label className="fw-bold mb-1">Plan Cost (₹)</label>
                                <input className="form-control bg-light text-dark" type="number" min={1} step={1} placeholder="Enter Plan Price" required />
                            </div>


                            {/* Submit Button */}
                            <div className="d-flex mt-4" style={{justifyContent:"center"}}>
                                <button type="submit" style={{backgroundColor:"teal"}} className="btn btn-light text-light mt-4 mx-1"><i className="bi bi-plus-square"></i> Create</button>
                                <button type="button" className="btn btn-secondary mt-4 mx-1" onClick={()=>setNewPlanData(null)}><i className="bi bi-x-square"></i> Close</button>
                            </div>
                        </form>
                    </Modal.Body>

                </Modal>
            }
            </>
        )
    }

    
// █░█ █▀█ █▀▄ ▄▀█ ▀█▀ █▀▀   █▀█ █░░ ▄▀█ █▄░█   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
// █▄█ █▀▀ █▄▀ █▀█ ░█░ ██▄   █▀▀ █▄▄ █▀█ █░▀█   █░▀░█ █▄█ █▄▀ █▀█ █▄▄
    const updatePlanModal = () => {
        return (
            <>
            {updatePlanData != null && 
                <Modal
                    show={updatePlanData != null}
                    onHide={()=>{setUpdatePlanData(null)}}
                    centered
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header style={{backgroundColor:"teal"}} closeButton>
                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                            <div>
                                <h3>Update Tariff Plan</h3>
                            </div>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                        <div className="d-flex p-4" style={{justifyContent:"center"}}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlSpace="preserve"
                            id="Layer_1"
                            width="120"
                            height="120"
                            fill="#000"
                            version="1.1"
                            viewBox="0 0 512 512"
                        >
                            <g id="SVGRepo_iconCarrier">
                              <circle cx="256" cy="256" r="245.106" fill="#EFEFEF"></circle>
                              <path
                                fill="#FF7D46"
                                d="M267.385 299.566c-24.062.421-43.908-18.746-44.328-42.808s18.746-43.908 42.808-44.328c24.062-.419 191.668 40.236 191.668 40.236s-166.086 46.48-190.148 46.9"
                              ></path>
                              <g fill="#231F20">
                                <path d="M437.019 74.981C388.667 26.628 324.38 0 256 0S123.333 26.628 74.981 74.981C26.628 123.332 0 187.62 0 256s26.628 132.667 74.981 181.019S187.62 512 256 512s132.667-26.628 181.019-74.981S512 324.38 512 256s-26.628-132.668-74.981-181.019M256 490.213C126.854 490.213 21.787 385.145 21.787 256S126.854 21.787 256 21.787 490.213 126.855 490.213 256 385.146 490.213 256 490.213"></path>
                                <path d="M468.426 256c0-36.93-9.67-73.281-27.949-105.215a11 11 0 0 0-.511-.998c-3.008-5.208-9.667-6.995-14.881-3.987l-31.977 18.461c-5.21 3.008-6.996 9.67-3.987 14.881a10.89 10.89 0 0 0 14.881 3.987l22.235-12.837a190.2 190.2 0 0 1 19.59 68.353c-42.8-10.233-158.855-37.466-180.154-37.107-14.546.254-28.123 6.157-38.23 16.623s-15.533 24.24-15.278 38.788c.519 29.708 24.849 53.519 54.445 53.517q.482 0 .965-.009c21.313-.373 136.285-31.633 178.721-43.363-1.519 26.001-8.356 51.431-20.06 74.613l-22.235-12.837c-5.211-3.009-11.874-1.223-14.881 3.987-3.009 5.21-1.223 11.873 3.987 14.881l31.977 18.461a10.89 10.89 0 0 0 15.391-4.984c18.28-31.934 27.951-68.285 27.951-105.215m-201.232 32.674c-18.044.322-32.931-14.089-33.247-32.106-.153-8.728 3.104-16.993 9.168-23.272 6.063-6.28 14.21-9.822 22.939-9.974l.308-.002c14.24 0 85.508 15.615 147.38 30.111-61.788 16.77-133.067 35.008-146.548 35.243M256 102.285c6.015 0 10.894-4.877 10.894-10.894V54.468c0-6.017-4.878-10.894-10.894-10.894s-10.894 4.877-10.894 10.894v36.923c0 6.016 4.879 10.894 10.894 10.894M102.286 256c0-6.017-4.878-10.894-10.894-10.894H54.468c-6.015 0-10.894 4.877-10.894 10.894s4.878 10.894 10.894 10.894h36.924c6.015 0 10.894-4.877 10.894-10.894M107.998 328.871l-31.977 18.461c-5.21 3.008-6.996 9.67-3.987 14.881a10.89 10.89 0 0 0 14.881 3.987l31.977-18.461c5.21-3.008 6.996-9.67 3.987-14.881-3.009-5.21-9.67-6.996-14.881-3.987M164.668 76.021c-3.009-5.209-9.669-6.996-14.881-3.987-5.21 3.008-6.996 9.67-3.987 14.881l18.461 31.976a10.89 10.89 0 0 0 14.881 3.987c5.21-3.008 6.996-9.67 3.987-14.881zM118.892 164.262 86.915 145.8c-5.213-3.009-11.874-1.222-14.881 3.987-3.009 5.21-1.223 11.873 3.987 14.881l31.977 18.461a10.89 10.89 0 0 0 14.881-3.987c3.009-5.21 1.223-11.873-3.987-14.88M332.858 122.878a10.89 10.89 0 0 0 14.881-3.987L366.2 86.915c3.009-5.21 1.223-11.873-3.987-14.881-5.212-3.009-11.872-1.223-14.881 3.987l-18.461 31.976c-3.009 5.211-1.224 11.873 3.987 14.881M312.647 381.161h-73.895c-6.015 0-10.894 4.877-10.894 10.894s4.878 10.894 10.894 10.894h73.895c6.015 0 10.894-4.877 10.894-10.894-.001-6.017-4.879-10.894-10.894-10.894M200.443 381.161h-1.089c-6.015 0-10.894 4.877-10.894 10.894s4.878 10.894 10.894 10.894h1.089c6.015 0 10.894-4.877 10.894-10.894-.001-6.017-4.879-10.894-10.894-10.894"></path>
                              </g>
                            </g>
                        </svg>
                        </div>
                        {/*                         
                        █░█ █▀█ █▀▄ ▄▀█ ▀█▀ █▀▀   █▀▀ █▀█ █▀█ █▀▄▀█
                        █▄█ █▀▀ █▄▀ █▀█ ░█░ ██▄   █▀░ █▄█ █▀▄ █░▀░█*/}
                        <form className="px-2" onSubmit={(event)=>{
                                                event.preventDefault();
                                                setShowLoadingModal(true);

                                                const body = {
                                                    plan_id : updatePlanData.plan_id,
                                                    plan_name : event.target[0].value,
                                                    plan_speed : event.target[1].value,
                                                    speed_unit : event.target[2].value,
                                                    plan_validity : event.target[3].value,
                                                    validity_unit : event.target[4].value,
                                                    plan_cost : event.target[5].value
                                                }

                                                const headers = {'Authorization':`Bearer ${authToken}`}
                                                axios.put(`${apiDomain}/admin/tariff`,body,{headers})
                                                .then(res=>{
                                                    if (res.data.result === true){
                                                        setShowLoadingModal(false);
                                                        setUpdatePlanData(null);
                                                        setShowMessageModal({show:true,type:"success",title:"Server Response",message:res.data.message});
                                                    }
                                                    else {
                                                        setShowLoadingModal(false);
                                                        setShowMessageModal({show:true,type:"error",title:"Error Occured",message:res.data.message});
                                                    }
                                                })
                                                .catch(error=>{
                                                    setShowLoadingModal(false);
                                                    setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Failed!, Please Check Your Internet Connection or Try  Again Later :("});
                                                })
                            }}>
                            {/* Plan Name */}
                            <div className="form-group">
                                <label className="fw-bold mb-1">Plan Name</label>
                                <input defaultValue={updatePlanData.plan_name} className="form-control bg-light text-dark" type="text" placeholder="Enter Plan Name" required />
                            </div>


                            <div className="d-flex w-100 mt-2">

                                <div className="d-flex w-100" style={{justifyContent:"center",marginRight:"5px"}}>
                                    {/* Plan Speed */}
                                    <div className="form-group mt-2 w-100">
                                        <label className="fw-bold mb-1">Internet Speed</label>
                                        <input defaultValue={updatePlanData.plan_speed} className="form-control bg-light text-dark" placeholder="Enter Speed" style={{border: "solid", borderWidth: "1px", borderColor: "black", borderRight: "none", borderTopRightRadius:"0px", borderBottomRightRadius:"0px"}} type="number" step={1} min={1} required />
                                    </div>
                                    {/* Speed Measurement Unit */}
                                    <div className="form-group mt-2 py-1">
                                        <select defaultValue={updatePlanData.speed_unit} className="form-control bg-light text-dark mt-4" style={{width:"98px", border: "solid", borderWidth: "1px", borderColor: "black", borderTopLeftRadius:"0px", borderBottomLeftRadius:"0px"}} type="text" required>
                                                <option value="Kbps">Kbps</option>
                                                <option value="Mbps">Mbps</option>
                                                <option value="Gbps">Gbps</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="d-flex w-100" style={{justifyContent:"center",marginLeft:"5px"}}>
                                    {/* Plan Validity */}
                                    <div className="form-group mt-2 w-100">
                                        <label className="fw-bold mb-1">Plan Validity</label>
                                        <input defaultValue={updatePlanData.plan_validity} className="form-control bg-light text-dark" placeholder="Enter Duration" style={{border: "solid", borderWidth: "1px", borderColor: "black", borderRight: "none", borderTopRightRadius:"0px", borderBottomRightRadius:"0px"}} type="number" step={1} min={1} required />
                                    </div>
                                    {/* Validity Measurement Unit */}
                                    <div className="form-group mt-2 py-1">
                                        <select defaultValue={updatePlanData.validity_unit} className="form-control bg-light text-dark mt-4" style={{width:"90px", border: "solid", borderWidth: "1px", borderColor: "black", borderTopLeftRadius:"0px", borderBottomLeftRadius:"0px"}} type="text" required>
                                                <option value="Days">Days</option>
                                                <option value="Month">Month</option>
                                                <option value="Year">Year</option>
                                        </select>
                                    </div>
                                </div>

                            </div>

                            {/* Plan Cost */}
                            <div className="form-group mt-2">
                                <label className="fw-bold mb-1">Plan Cost (₹)</label>
                                <input defaultValue={updatePlanData.plan_cost} className="form-control bg-light text-dark" type="number" min={1} step={1} placeholder="Enter Plan Price" required />
                            </div>


                            {/* Submit Button */}
                            <div className="d-flex mt-4" style={{justifyContent:"center"}}>
                                <button type="submit" style={{backgroundColor:"teal"}} className="btn btn-light text-light mt-4 mx-1"><i className="bi bi-pencil-square"></i> Update</button>
                                <button type="button" className="btn btn-secondary mt-4 mx-1" onClick={()=>setUpdatePlanData(null)}><i className="bi bi-x-square"></i> Close</button>
                            </div>
                        </form>
                    </Modal.Body>

                </Modal>
            }
            </>
        )
    }


    // █▀▄ █▀▀ ▀█▀ ▄▀█ █ █░░   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
    // █▄▀ ██▄ ░█░ █▀█ █ █▄▄   █░▀░█ █▄█ █▄▀ █▀█ █▄▄
    // Modal For Plan Description
    const planDetailModal = () => {
        return (
            <>
                {showPlanDetailModal != null && 
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Modal 
                            show={()=>showPlanDetailModal != null}
                            onHide={()=>{
                                            setShowPlanDetailModal(null);
                                            setSubscriberList(null);
                                            setMigrationList(null);
                                            setNavSection("Plan Detail");
                                        }
                                    }
                            backdrop="static"
                            keyboard={false}
                            centered
                            dialogClassName="custom-plan-detail-modal"
                        >
                            <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                                <div className="d-flex w-100" style={{justifyContent:"center"}}>
                                    <h3>{showPlanDetailModal.plan_name}</h3>
                                </div>
                            </Modal.Header>
                            <Modal.Body className="bg-light text-dark">
                                    <div className="container-fluid text-center">
                                        {/* Plan Detail Button */}
                                        <button onClick={()=>setNavSection("Plan Detail")} className={navSection === "Plan Detail" ? "btn btn-light mx-1 mt-1 fw-bold bg-teal text-white" : "btn btn-light mx-1 mt-1"} style={{fontSize:"16px",color:"darkteal"}}>Plan Detail</button>
                                        
                                        {/* Subscriber Button */}
                                        <button onClick={()=>{
                                            setNavSection("Subscribers");
                                            setSubscriberList(null);
                                            const headers = {'Authorization':`Bearer ${authToken}`};
                                            axios.get(`${apiDomain}/admin/tariff-subscribers`,{params:{id:showPlanDetailModal.plan_id},headers})
                                            .then(res => {
                                                if(res.data.result === true){
                                                    setSubscriberList(res.data.data);
                                                }
                                                else {
                                                    setSubscriberList("error");
                                                }
                                            })
                                            .catch(error=>{
                                                setSubscriberList("error");
                                            })
                                        }} className={navSection === "Subscribers" ? "btn btn-light mx-1 mt-1 fw-bold bg-teal text-white" : "btn btn-light mx-1 mt-1"} style={{fontSize:"16px",color:"darkteal"}}>Subscribers</button>
                                        
                                        {/* Migration Button */}
                                        {/* 
                                        █▀▄▀█ █ █▀▀ █▀█ ▄▀█ ▀█▀ █▀▀   █▄▄ █░█ ▀█▀ ▀█▀ █▀█ █▄░█
                                        █░▀░█ █ █▄█ █▀▄ █▀█ ░█░ ██▄   █▄█ █▄█ ░█░ ░█░ █▄█ █░▀█ */}
                                        <button onClick={()=>{
                                            setNavSection("Migration")
                                            setSubscriberList(null);
                                            const headers = {'Authorization':`Bearer ${authToken}`};
                                            axios.get(`${apiDomain}/admin/tariff-migration`,{params:{id:showPlanDetailModal.plan_id},headers})
                                            .then(res => {
                                                if(res.data.result === true){
                                                    setMigrationList(res.data.data);
                                                }
                                                else {
                                                    setMigrationList("error");
                                                }
                                            })
                                            .catch(error=>{
                                                setMigrationList("error");
                                            })
                                        }} className={navSection === "Migration" ? "btn btn-light mx-1 mt-1 fw-bold bg-teal text-white" : "btn btn-light mx-1 mt-1"} style={{fontSize:"16px",color:"darkteal"}}>Migration</button>
                                    </div>
                                    <hr className="mt-4" />
                                    <div style={{height:"370px"}}>
                                        {/* Plan Detail Section */}
                                        {/* 
                                        █▀▄ █▀▀ ▀█▀ ▄▀█ █ █░░   █▀ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄░█
                                        █▄▀ ██▄ ░█░ █▀█ █ █▄▄   ▄█ ██▄ █▄▄ ░█░ █ █▄█ █░▀█ */}
                                        {navSection === "Plan Detail" && 
                                        <div>
                                            <div className="container-fluid text-center" style={{justifyContent:"center"}}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    xmlSpace="preserve"
                                                    id="router"
                                                    width="151"
                                                    height="151"
                                                    fill="#000"
                                                    version="1.1"
                                                    viewBox="0 0 224 174.32"
                                                >
                                                    <g id="SVGRepo_iconCarrier">
                                                      <circle cx="177" cy="139.32" r="7" fill="#D0E8FF"></circle>
                                                      <path
                                                        fill="#5CB0FF"
                                                        d="M204.03 114.32H19.97c-6.6 0-11.97 5.383-11.97 12v28c0 6.617 5.37 12 11.97 12h184.06c6.6 0 11.97-5.383 11.97-12v-28c0-6.617-5.37-12-11.97-12M32 148.32h-8v-20h8zm20 0h-8v-20h8zm20 0h-8v-20h8zm20 0h-8v-20h8zm20 0h-8v-20h8zm65 6c-8.271 0-15-6.729-15-15s6.729-15 15-15 15 6.728 15 15-6.728 15-15 15"
                                                      ></path>
                                                      <path
                                                        fill="#1C71DA"
                                                        d="M204.03 106.32H19.97c-11.011 0-19.97 8.972-19.97 20v28c0 11.027 8.959 20 19.97 20h184.06c11.011 0 19.97-8.973 19.97-20v-28c0-11.028-8.959-20-19.97-20m11.97 48c0 6.617-5.37 12-11.97 12H19.97c-6.6 0-11.97-5.383-11.97-12v-28c0-6.617 5.37-12 11.97-12h184.06c6.6 0 11.97 5.383 11.97 12z"
                                                      ></path>
                                                      <path
                                                        fill="#1C71DA"
                                                        d="M177 124.32c-8.271 0-15 6.728-15 15s6.729 15 15 15 15-6.729 15-15-6.728-15-15-15m0 22c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7"
                                                      ></path>
                                                      <path
                                                        fill="#FFF"
                                                        d="M24 128.32h8v20h-8zM44 128.32h8v20h-8zM64 128.32h8v20h-8zM84 128.32h8v20h-8zM104 128.32h8v20h-8z"
                                                      ></path>
                                                      <path fill="#1C71DA" d="M148 28.32h8v72h-8zM68 28.32h8v72h-8z"></path>
                                                      <path
                                                        fill="#FF5D5D"
                                                        d="M4.252 22.143a4 4 0 0 1-2.829-6.829L15.567 1.174a4 4 0 0 1 5.657 5.657L7.081 20.972a4 4 0 0 1-2.829 1.171"
                                                      ></path>
                                                      <path
                                                        fill="#FF5D5D"
                                                        d="M18.395 22.142a4 4 0 0 1-2.83-1.171L1.425 6.828A4 4 0 0 1 7.08 1.171l14.142 14.142a4 4 0 0 1-2.828 6.829"
                                                      ></path>
                                                      <path
                                                        fill="#00D40B"
                                                        d="M30.252 86.143c-7.72 0-14-6.28-14-14s6.28-14 14-14 14 6.28 14 14-6.28 14-14 14m0-20c-3.308 0-6 2.692-6 6s2.692 6 6 6 6-2.691 6-6-2.691-6-6-6"
                                                      ></path>
                                                      <path
                                                        fill="#FFC504"
                                                        d="M195.566 88.769a4 4 0 0 1-2.829-1.172l-11.313-11.313a4 4 0 0 1 0-5.657l11.313-11.314a4 4 0 0 1 5.657 0l11.314 11.314a4 4 0 0 1 0 5.657l-11.314 11.313a3.99 3.99 0 0 1-2.828 1.172m-5.657-15.314 5.657 5.657 5.657-5.657-5.657-5.656z"
                                                      ></path>
                                                    </g>
                                                </svg>
                                                <p className="fw-bold" style={{fontSize:"25px",marginTop:"-5px"}}>{`${showPlanDetailModal.plan_name}`}</p>

                                                <p className="fw-bold" style={{marginTop:"-15px"}}>{`Subscribers: ${showPlanDetailModal.subscribers}`}</p>
                                                <hr />
                                                <p style={{fontSize:"18px",marginTop:"0px", textAlign:"left"}}><span className="fw-bold">Internet Speed: </span>{`${showPlanDetailModal.plan_speed} ${showPlanDetailModal.speed_unit}`}</p>
                                                <p style={{fontSize:"18px",marginTop:"-10px", textAlign:"left"}}><span className="fw-bold">Tariff Validity: </span>{`${showPlanDetailModal.plan_validity} ${showPlanDetailModal.validity_unit}`}</p>
                                                <p style={{fontSize:"18px",marginTop:"-10px", textAlign:"left"}}><span className="fw-bold">Plan Cost: </span>{`₹ ${showPlanDetailModal.plan_cost}`}</p>

                                            </div>

                                            <small className="mx-2"><i className="bi bi-arrow-return-right"></i> 18% GST included in Plan Cost.</small>
                                        </div> }

                                        {/* 
                                        █▀ █░█ █▄▄ █▀ █▀▀ █▀█ █ █▄▄ █▀▀ █▀█   █▀ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄░█
                                        ▄█ █▄█ █▄█ ▄█ █▄▄ █▀▄ █ █▄█ ██▄ █▀▄   ▄█ ██▄ █▄▄ ░█░ █ █▄█ █░▀█ */}
                                        {/* Subscribers Section */}
                                        {navSection === "Subscribers" && 
                                        <div className="d-flex" style={{justifyContent:"center"}}>
                                            
                                            {/* Spinner */}
                                            {subscriberList === null && <>
                                                <div className="spinner-border" style={{marginTop:"150px"}} role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </>}

                                            {/* Error */}
                                            {subscriberList === "error" && <>
                                                <div style={{marginTop:"10px"}}>
                                                <div className="d-flex mt-5" style={{justifyContent:"center"}}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="120px"
                                                        height="120px"
                                                        className="icon"
                                                        viewBox="0 0 1024 1024"
                                                    >
                                                        <g id="SVGRepo_iconCarrier">
                                                          <path
                                                            fill="#FDDF6D"
                                                            d="M20.016 512.002a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0"
                                                          ></path>
                                                          <path
                                                            fill="#FCC56B"
                                                            d="M617.43 931.354c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.056 155.124 20.016 320.824 20.016 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.308-143.124 53.666-223.67 53.666"
                                                          ></path>
                                                          <path
                                                            fill="#7F184C"
                                                            d="M735.828 834.472H496.912c-11.056 0-20.014-8.958-20.014-20.014s8.958-20.014 20.014-20.014h238.914c11.056 0 20.014 8.958 20.014 20.014s-8.956 20.014-20.012 20.014M442.172 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188 7.082-8.484 19.702-9.62 28.188-2.536 17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.732-6.776 21.3-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.524 20.58-70.554 32.866-117.774 32.866m347.174 0c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188s19.706-9.62 28.188-2.536c17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.73-6.776 21.304-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.526 20.58-70.554 32.866-117.774 32.866M347.382 526.08c-7.438 0-14.36-.836-20.53-2.544-10.654-2.946-16.9-13.972-13.954-24.628 2.948-10.654 13.984-16.904 24.628-13.954 9.852 2.73 30.072.814 53.044-9.608 22.486-10.194 37.75-24.62 42.904-34.39 5.156-9.78 17.26-13.528 27.038-8.368 9.778 5.156 13.524 17.264 8.368 27.038-10.488 19.886-33.582 39.392-61.778 52.178-20.608 9.346-41.672 14.276-59.72 14.276m531.598 0c-18.05 0-39.108-4.928-59.724-14.278-28.194-12.782-51.288-32.288-61.774-52.174-5.158-9.776-1.41-21.882 8.368-27.038 9.778-5.164 21.882-1.406 27.038 8.368 5.156 9.77 20.418 24.194 42.898 34.388 22.974 10.42 43.2 12.338 53.044 9.61 10.666-2.938 21.68 3.298 24.628 13.952 2.946 10.654-3.298 21.68-13.952 24.628-6.166 1.706-13.09 2.544-20.526 2.544"
                                                          ></path>
                                                          <path d="M711.124 40.168c-10.176-4.304-21.922.464-26.224 10.646s.464 21.926 10.646 26.224c175.212 74.03 288.428 244.764 288.428 434.96 0 260.248-211.724 471.97-471.968 471.97S40.03 772.244 40.03 511.998 251.756 40.03 512.002 40.03c11.056 0 20.014-8.958 20.014-20.014S523.058 0 512.002 0c-282.32 0-512 229.68-512 511.998 0 282.32 229.68 512.002 512 512.002C794.318 1024 1024 794.32 1024 512c.002-206.322-122.812-391.528-312.876-471.832"></path>
                                                          <path d="M496.912 794.444c-11.056 0-20.014 8.958-20.014 20.014s8.958 20.014 20.014 20.014h238.914c11.056 0 20.014-8.958 20.014-20.014s-8.958-20.014-20.014-20.014zM350.194 564.46c-8.488-7.088-21.106-5.948-28.188 2.536-7.086 8.486-5.948 21.106 2.536 28.188 24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.778-8.738-19.348-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.408-.002-74.514-9.43-91.984-24.014m321.52 30.724c24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.776-8.738-19.35-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.404 0-74.508-9.426-91.98-24.012-8.486-7.088-21.104-5.948-28.188 2.536-7.09 8.48-5.954 21.104 2.532 28.186M347.382 526.08c18.048 0 39.108-4.926 59.718-14.272 28.196-12.786 51.294-32.29 61.778-52.176 5.158-9.776 1.41-21.882-8.368-27.038-9.778-5.164-21.882-1.41-27.038 8.368-5.156 9.77-20.418 24.194-42.904 34.388-22.972 10.42-43.19 12.34-53.042 9.608-10.646-2.936-21.68 3.298-24.628 13.952-2.946 10.65 3.296 21.68 13.952 24.628 6.17 1.704 13.094 2.542 20.532 2.542m471.878-14.272c20.616 9.346 41.674 14.272 59.722 14.272 7.434 0 14.362-.836 20.532-2.546 10.65-2.948 16.896-13.976 13.946-24.628a20.004 20.004 0 0 0-24.628-13.946c-9.842 2.714-30.062.812-53.042-9.61-22.48-10.192-37.746-24.618-42.898-34.388-5.156-9.778-17.26-13.53-27.038-8.368-9.778 5.156-13.524 17.264-8.368 27.038 10.482 19.888 33.576 39.39 61.774 52.176M618.1899999999999 37.682a20.014 20.014 0 1 0 40.028 0 20.014 20.014 0 1 0-40.028 0"></path>
                                                        </g>
                                                    </svg>
                                                </div>
                                                    <p className="mt-4 fw-bold text-center">This Plan Has 0 Subscribers</p>
                                                </div>
                                            </>}


                                            {/* Table List */}
                                            {Array.isArray(subscriberList) && <>
                                                <div style={{marginTop:"5px"}}>
                                                    <p className="fw-bold text-center">Total Subscriber: {showPlanDetailModal.subscribers}</p>
                                                    <div className="hide-scrollbar" style={{ maxHeight: '320px', overflowY: 'scroll' }}>
                                                        <table className="table table-light table-striped table-borderd" style={{minWidth:"480px",borderRadius:"10px",overflow:"hidden"}}>
                                                            <thead>
                                                                <tr>
                                                                  <th scope="col" style={{width:"40px",textAlign:"center",backgroundColor:"teal",color:"white"}}>#</th>
                                                                  <th scope="col" style={{width:"140px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Name</th>
                                                                  <th scope="col" style={{width:"120px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Phone</th>
                                                                  <th scope="col" style={{width:"160px",textAlign:"center",backgroundColor:"teal",color:"white"}}>Email</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {subscriberList.map((item,index)=>{
                                                                    return (
                                                                    <tr key={index} style={{fontSize:"13.5px"}}>
                                                                        {/* Serial Number */}
                                                                        <td scope="row" style={{width:"40px",textAlign:"center"}}>{index+1}</td>

                                                                        {/* Name */}
                                                                        <td style={{width:"140px",textAlign:"left"}}>{item.name.toUpperCase()}</td>

                                                                        {/* Phone */}
                                                                        <td style={{width:"120px",textAlign:"left"}}>{item.phone}</td>

                                                                        {/* Email */}
                                                                        <td style={{width:"160px",textAlign:"left"}}>{item.email}</td>
                                                                    </tr> )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </>}
                                        </div>
                                        }

                                        {/* 
                                        █▀▄▀█ █ █▀▀ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█   █▀ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄░█
                                        █░▀░█ █ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█   ▄█ ██▄ █▄▄ ░█░ █ █▄█ █░▀█ */}
                                        {/* Migration Section */}
                                        {navSection === "Migration" && 
                                        <div className="d-flex" style={{justifyContent:"center"}}>
                                            
                                            {/* Spinner */}
                                            {migrationList === null && showPlanDetailModal.subscribers > 0 && <>
                                                <div className="spinner-border" style={{marginTop:"150px"}} role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </>}

                                            {/* Error When No Subscribers Found */}
                                            {showPlanDetailModal.subscribers === 0 && <>
                                                <div style={{marginTop:"10px"}}>
                                                <div className="d-flex mt-5" style={{justifyContent:"center"}}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="120px"
                                                        height="120px"
                                                        className="icon"
                                                        viewBox="0 0 1024 1024"
                                                    >
                                                        <g id="SVGRepo_iconCarrier">
                                                          <path
                                                            fill="#FDDF6D"
                                                            d="M20.016 512.002a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0"
                                                          ></path>
                                                          <path
                                                            fill="#FCC56B"
                                                            d="M617.43 931.354c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.056 155.124 20.016 320.824 20.016 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.308-143.124 53.666-223.67 53.666"
                                                          ></path>
                                                          <path
                                                            fill="#7F184C"
                                                            d="M735.828 834.472H496.912c-11.056 0-20.014-8.958-20.014-20.014s8.958-20.014 20.014-20.014h238.914c11.056 0 20.014 8.958 20.014 20.014s-8.956 20.014-20.012 20.014M442.172 628.498c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188 7.082-8.484 19.702-9.62 28.188-2.536 17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.732-6.776 21.3-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.524 20.58-70.554 32.866-117.774 32.866m347.174 0c-48.674 0-92.65-12.454-117.634-33.316-8.486-7.082-9.62-19.706-2.536-28.188s19.706-9.62 28.188-2.536c17.472 14.586 53.576 24.012 91.98 24.012 37.486 0 74.086-9.604 93.242-24.464 8.73-6.776 21.304-5.188 28.08 3.546 6.776 8.732 5.188 21.304-3.546 28.08-26.526 20.58-70.554 32.866-117.774 32.866M347.382 526.08c-7.438 0-14.36-.836-20.53-2.544-10.654-2.946-16.9-13.972-13.954-24.628 2.948-10.654 13.984-16.904 24.628-13.954 9.852 2.73 30.072.814 53.044-9.608 22.486-10.194 37.75-24.62 42.904-34.39 5.156-9.78 17.26-13.528 27.038-8.368 9.778 5.156 13.524 17.264 8.368 27.038-10.488 19.886-33.582 39.392-61.778 52.178-20.608 9.346-41.672 14.276-59.72 14.276m531.598 0c-18.05 0-39.108-4.928-59.724-14.278-28.194-12.782-51.288-32.288-61.774-52.174-5.158-9.776-1.41-21.882 8.368-27.038 9.778-5.164 21.882-1.406 27.038 8.368 5.156 9.77 20.418 24.194 42.898 34.388 22.974 10.42 43.2 12.338 53.044 9.61 10.666-2.938 21.68 3.298 24.628 13.952 2.946 10.654-3.298 21.68-13.952 24.628-6.166 1.706-13.09 2.544-20.526 2.544"
                                                          ></path>
                                                          <path d="M711.124 40.168c-10.176-4.304-21.922.464-26.224 10.646s.464 21.926 10.646 26.224c175.212 74.03 288.428 244.764 288.428 434.96 0 260.248-211.724 471.97-471.968 471.97S40.03 772.244 40.03 511.998 251.756 40.03 512.002 40.03c11.056 0 20.014-8.958 20.014-20.014S523.058 0 512.002 0c-282.32 0-512 229.68-512 511.998 0 282.32 229.68 512.002 512 512.002C794.318 1024 1024 794.32 1024 512c.002-206.322-122.812-391.528-312.876-471.832"></path>
                                                          <path d="M496.912 794.444c-11.056 0-20.014 8.958-20.014 20.014s8.958 20.014 20.014 20.014h238.914c11.056 0 20.014-8.958 20.014-20.014s-8.958-20.014-20.014-20.014zM350.194 564.46c-8.488-7.088-21.106-5.948-28.188 2.536-7.086 8.486-5.948 21.106 2.536 28.188 24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.778-8.738-19.348-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.408-.002-74.514-9.43-91.984-24.014m321.52 30.724c24.984 20.86 68.96 33.316 117.634 33.316 47.218 0 91.248-12.286 117.778-32.864 8.734-6.776 10.322-19.348 3.546-28.08-6.776-8.738-19.35-10.32-28.08-3.546-19.158 14.858-55.758 24.464-93.242 24.464-38.404 0-74.508-9.426-91.98-24.012-8.486-7.088-21.104-5.948-28.188 2.536-7.09 8.48-5.954 21.104 2.532 28.186M347.382 526.08c18.048 0 39.108-4.926 59.718-14.272 28.196-12.786 51.294-32.29 61.778-52.176 5.158-9.776 1.41-21.882-8.368-27.038-9.778-5.164-21.882-1.41-27.038 8.368-5.156 9.77-20.418 24.194-42.904 34.388-22.972 10.42-43.19 12.34-53.042 9.608-10.646-2.936-21.68 3.298-24.628 13.952-2.946 10.65 3.296 21.68 13.952 24.628 6.17 1.704 13.094 2.542 20.532 2.542m471.878-14.272c20.616 9.346 41.674 14.272 59.722 14.272 7.434 0 14.362-.836 20.532-2.546 10.65-2.948 16.896-13.976 13.946-24.628a20.004 20.004 0 0 0-24.628-13.946c-9.842 2.714-30.062.812-53.042-9.61-22.48-10.192-37.746-24.618-42.898-34.388-5.156-9.778-17.26-13.53-27.038-8.368-9.778 5.156-13.524 17.264-8.368 27.038 10.482 19.888 33.576 39.39 61.774 52.176M618.1899999999999 37.682a20.014 20.014 0 1 0 40.028 0 20.014 20.014 0 1 0-40.028 0"></path>
                                                        </g>
                                                    </svg>
                                                </div>
                                                    <p className="mt-4 fw-bold text-center">This Plan Has 0 Subscribers</p>
                                                </div>
                                            </>}

                                            {/* Error When No Plan Found */}
                                            {migrationList === "error" && showPlanDetailModal.subscribers > 0 && <>
                                                <div style={{marginTop:"10px"}}>
                                                <div className="d-flex mt-5" style={{justifyContent:"center"}}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    xmlSpace="preserve"
                                                    id="Capa_1"
                                                    width="140"
                                                    height="140"
                                                    fill="#000"
                                                    version="1.1"
                                                    viewBox="0 0 47 47"
                                                >
                                                    <g id="SVGRepo_iconCarrier">
                                                      <path
                                                        fill="#FBD971"
                                                        d="M23.5 5c-2.013 0-3.953.3-5.796.829.501 1.608.796 3.181.796 4.171 0 2.75-2.25 5-5 5-2.352 0-4.326-1.65-4.852-3.847A20.94 20.94 0 0 0 2.5 26c0 11.598 9.402 21 21 21s21-9.402 21-21-9.402-21-21-21"
                                                      ></path>
                                                      <path
                                                        fill="#C03A2B"
                                                        d="M12.5 39c0-6.075 4.925-11 11-11s11 4.925 11 11z"
                                                      ></path>
                                                      <path
                                                        fill="#E64C3C"
                                                        d="M12.5 39c0-2.761 4.925-5 11-5s11 2.239 11 5"
                                                      ></path>
                                                      <path
                                                        fill="#48A0DC"
                                                        d="M13.5 15c-2.75 0-5-2.25-5-5s2.25-10 5-10 5 7.25 5 10-2.25 5-5 5"
                                                      ></path>
                                                      <path
                                                        fill="#F29C1F"
                                                        d="M36.5 25c-4.411 0-8-3.589-8-8a1 1 0 1 1 2 0c0 3.309 2.691 6 6 6a1 1 0 1 1 0 2M10.5 25a1 1 0 1 1 0-2c3.309 0 6-2.691 6-6a1 1 0 1 1 2 0c0 4.411-3.589 8-8 8"
                                                      ></path>
                                                    </g>
                                                </svg>
                                                </div>
                                                    <p className="mt-4 fw-bold text-center">You need atleast 2 Tariff Plan to use this feature.</p>
                                                </div>
                                            </>}


                                            {/* Migration Form */}
                                            {Array.isArray(migrationList) && showPlanDetailModal.subscribers > 0 && <>
                                                <div>
                                                    <div style={{marginTop:"5px"}}>
                                                        <p className="fw-bold text-center fs-5">Migrate Clients To Another Plan</p>
                                                        <div className="d-flex" style={{justifyContent:"center"}}>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            id="exchange-5"
                                                            width="140"
                                                            height="140"
                                                            fill="#000"
                                                            className="icon flat-line"
                                                            data-name="Flat Line"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <g id="SVGRepo_iconCarrier" strokeWidth="2">
                                                              <path
                                                                id="secondary"
                                                                fill="#2ca9bc"
                                                                d="M7 3a4 4 0 1 0 4 4 4 4 0 0 0-4-4m10 18a4 4 0 1 0-4-4 4 4 0 0 0 4 4"
                                                              ></path>
                                                              <path
                                                                id="primary"
                                                                fill="none"
                                                                stroke="#000"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M14.57 4.43a8 8 0 0 1 3.09 1.91 8.1 8.1 0 0 1 2 3.3"
                                                              ></path>
                                                              <path
                                                                id="primary-2"
                                                                fill="none"
                                                                stroke="#000"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m17.85 8.81 1.81.84.84-1.81"
                                                                data-name="primary"
                                                              ></path>
                                                              <path
                                                                id="primary-3"
                                                                fill="none"
                                                                stroke="#000"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M4.35 14.36a8.1 8.1 0 0 0 2 3.3 8 8 0 0 0 3.09 1.91"
                                                                data-name="primary"
                                                              ></path>
                                                              <path
                                                                id="primary-4"
                                                                fill="none"
                                                                stroke="#000"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m6.15 15.19-1.81-.84-.84 1.81"
                                                                data-name="primary"
                                                              ></path>
                                                              <path
                                                                id="primary-5"
                                                                fill="none"
                                                                stroke="#000"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M7 3a4 4 0 1 0 4 4 4 4 0 0 0-4-4m10 18a4 4 0 1 0-4-4 4 4 0 0 0 4 4"
                                                                data-name="primary"
                                                              ></path>
                                                            </g>
                                                        </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <form className="mt-3" onSubmit={(event)=>{
                                                                event.preventDefault();
                                                                setShowLoadingModal(true);
                                                                const current_plan_id = showPlanDetailModal.plan_id;
                                                                const new_plan_id = event.target[0].value;
                                                                const headers = {'Authorization':`Bearer ${authToken}`};
                                                                // blank {} object is passed because axios takes 2nd positional argument as data body and we're passing data via params that's why
                                                                axios.put(`${apiDomain}/admin/tariff-migration`,{},{params:{
                                                                                                                        current:current_plan_id,
                                                                                                                        target:new_plan_id
                                                                                                                        },
                                                                                                                headers
                                                                                                                }
                                                                )
                                                                .then(res=>{
                                                                    if(res.data.result === true){
                                                                        // Successfully Migrated To Another Plan
                                                                        setShowLoadingModal(false);
                                                                        setShowPlanDetailModal(null);
                                                                        setSubscriberList(null);
                                                                        setMigrationList(null);
                                                                        setNavSection("Plan Detail");
                                                                        setShowMessageModal({show:true,type:"success",title:"Server Response",message:res.data.message});
                                                                    }
                                                                    else {
                                                                        // Error Occured
                                                                        setShowLoadingModal(false);
                                                                        setShowPlanDetailModal(null);
                                                                        setSubscriberList(null);
                                                                        setMigrationList(null);
                                                                        setNavSection("Plan Detail");
                                                                        setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Failed!, Please check your internet connection or try later :("});
                                                                    }
                                                                })
                                                                .catch(error=>{
                                                                    console.error("error occured during plan migration"+error)
                                                                    setShowLoadingModal(false);
                                                                    setShowPlanDetailModal(null);
                                                                    setSubscriberList(null);
                                                                    setMigrationList(null);
                                                                    setNavSection("Plan Detail");
                                                                    setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Failed!, Please check your internet connection or try later :("});
                                                                })
                                                            }}
                                                        >
                                                            <div>
                                                                <label className="form-label">Select Tariff Plan</label>
                                                                <select type="text" className="form-control bg-light text-dark">
                                                                    {migrationList.map((item,index)=>{
                                                                        return <option key={index} value={item.plan_id}>{item.plan_name}</option>
                                                                    })}
                                                                </select>
                                                                <div className="d-flex mt-3" style={{justifyContent:"center"}}>
                                                                    <button type="submit" className="btn btn-secondary text-light bg-teal"><i className="bi bi-send"></i> Migrate</button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </>}
                                        </div>
                                        }

                                    </div>
                            </Modal.Body>
                            <Modal.Footer className="bg-light">
                                <div className="d-flex" style={{justifyContent:"flex-end"}}>
                                    <button onClick={()=>{
                                        setShowPlanDetailModal(null);
                                        setSubscriberList(null);
                                        setMigrationList(null);
                                        setNavSection("Plan Detail");
                                    }} type="button" className="btn btn-secondary">Close</button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                    </div>
                }
            </>
        )
    }

    
// █▀▄ █▀▀ █░░ █▀▀ ▀█▀ █▀▀   █▀▄▀█ █▀█ █▀▄ ▄▀█ █░░
// █▄▀ ██▄ █▄▄ ██▄ ░█░ ██▄   █░▀░█ █▄█ █▄▀ █▀█ █▄▄

const deleteModal = () => {
    return (
        <>
            {deletePlanData != null && 
            <>
                <Modal
                show = {deletePlanData != null}
                onHide={()=>setDeletePlanData(null)}
                centered
                backdrop="static"
                keyboard={false}
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                >
                    <Modal.Header className="bg-danger" closeButton>
                        <div className="d-flex w-100" style={{justifyContent:"center"}}>
                            <h3>Delete Confirmation</h3>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                        <h2 className="fw-bold">This action cannot be undone</h2>
                        <p>You're about to delete <span className="fw-bold">{deletePlanData.plan_name}</span></p>
                    </Modal.Body>
                    <Modal.Footer className="bg-light text-dark">
                        <div className="d-flex" style={{justifyContent:"flex-end"}}>
                            <button className="btn btn-danger mx-1" onClick={()=>{
                                // API FOR DELETING TARIFF PLAN
                                setShowLoadingModal(true);
                                const headers = {'Authorization':`Bearer ${authToken}`}
                                axios.delete(`${apiDomain}/admin/tariff`,{params:{"id":deletePlanData.plan_id},headers})
                                .then(res=>{
                                    if (res.data.result === true){
                                        // stop loading
                                        setDeletePlanData(null)
                                        setShowLoadingModal(false);
                                        setShowMessageModal({show:true,type:"success",title:"Server Response",message:res.data.message})
                                    }
                                    else {
                                        setShowLoadingModal(false);
                                        setShowMessageModal({show:true,type:"error",title:"Server Response",message:res.data.message})
                                    }
                                })
                                .catch(error=>{
                                    console.log(`error occured during tariff plan deletion`,error);
                                    setShowLoadingModal(false);
                                    setShowMessageModal({show:true,type:"error",title:"Server Response",message:"Failed!, Please check your internet connection or try later :("})
                                })
                            }}><i className="bi bi-trash"></i> Permanently Delete</button>
                            <button className="btn btn-secondary mx-1" onClick={()=>setDeletePlanData(null)}><i className="bi bi-x-square"></i> Cancel</button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </>
            }
        </>
    )
}

    

    useEffect(() => {
        fetchTariffPlans(apiDomain, authToken, setTariffData);
    }, []);
    
    if (tariffData === "error") {
        
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
    else if (tariffData === "loading"){
        return <Spinner/> 
    }
    else if (tariffData != null) {
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                <div className="card dark-gradient w-50">
                    <div className="card-body">
                        <h5 className="card-title fw-bold">Tariff Plan Manager</h5>
                        {Array.isArray(tariffData) ? <p className="card-text">Total Plans: {tariffData.length} </p> : <></>}
                    </div>
                </div>
            </div>

            <div className="d-flex mx-4" style={{justifyContent:"flex-end"}}>
                <button className="btn btn-light fw-bold border-dark mx-2" onClick={()=>setNewPlanData({})}><i className="bi bi-megaphone"></i> Create New Plan</button>
            </div>

            <div style={{height:"600px"}}>
                <div className="d-flex mt-3 px-4">
                    <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px",overflow:"hidden"}}>
                        <thead>
                            <tr>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"80px",textAlign:"center"}}>#</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"180px",textAlign:"center"}}>Plan Name</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Speed</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Validity</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Cost</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"50px",textAlign:"center"}}>Subscribers</th>
                                <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tariffData.map((item,index_number)=>{
                                return (
                                        <tr key={item.plan_id} style={{fontSize:"15px"}}>
                                            {/* Serial Number */}
                                            <td className="" scope="row" style={{width:"80px",textAlign:"center"}}>{index_number + 1}</td>
                                
                                            {/* Plan Name */}
                                            <td className="" style={{width:"180px",textAlign:"center"}}>{item.plan_name}</td>
                                
                                            {/* Plan Speed */}
                                            <td className="" style={{width:"120px",textAlign:"center"}}>{`${item.plan_speed} ${item.speed_unit}`}</td>

                                            {/* Plan Validity */}
                                            <td className="" style={{width:"120px",textAlign:"center"}}>{`${item.plan_validity} ${item.validity_unit}`}</td>

                                            {/* Plan Cost */}
                                            <td className="" style={{width:"120px",textAlign:"center"}}>{`₹ ${item.plan_cost}`}</td>

                                            {/* Subscriber Count */}
                                            <td className="" style={{width:"50px",textAlign:"center"}}>{`${item.subscribers}`}</td>
                                
                                            {/* Actions */}
                                            <td style={{width:"150px",textAlign:"center"}}>
                                                {/* Show Plan Detail Button */}
                                                <a title="Detailed View" className="btn btn-light border text-dark mx-1" onClick={()=>{
                                                                                                                                         setShowPlanDetailModal(item);
                                                                                                                                    }}
                                                    style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-eye-fill"></i>
                                                </a>
                                                {/* Show Plan Update Form Button */}
                                                <a title="Update Plan" className="btn btn-light border text-primary mx-1" onClick={()=>{
                                                                                                                                         setUpdatePlanData(item);
                                                                                                                                    }}
                                                    style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-pencil-square"></i>
                                                </a>
                                                {/* Show Plan Delete Button */}
                                                <a title="Delete Plan" className="btn btn-danger border-danger text-light mx-1" onClick={()=>{
                                                                                                                                         setDeletePlanData(item);
                                                                                                                                    }}
                                                    style={{paddingTop:"1px",paddingBottom:"1px",paddingLeft:"6px",paddingRight:"6px"}}><i style={{fontSize:"20px"}} className="bi bi-trash"></i>
                                                </a>
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
    </div>
    {messageModal()}
    {loadingModal()}
    {createPlanModal()}
    {planDetailModal()}
    {updatePlanModal()}
    {deleteModal()}
    </>
        )
    }
    else if (tariffData === null) {
        
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
        <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-router text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
              <h2 className="mt-3 text-light">No Tariff Plans Found</h2>
              <p className="text-light">Please, Create Your First Tariff Plan.</p>
              <button onClick={()=>{
                // Write Function Here
                setNewPlanData({});
              }} className="btn btn-light fw-bold border text-dark">
              <i className="bi bi-megaphone"></i> Create New Plan
              </button>
            </div>
        </div>
        </div>
        {messageModal()}
        {loadingModal()}
        {createPlanModal()}
        </>
        )
    };
}