import { useEffect,useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

export default function Transactions({authToken, apiDomain}){

    // Transactions Data For Handling Multiple Scinarios (loading,error,null)
    const [transactionData, setTransactionData] = useState("loading");
    const [ transactionCount, setTransactionCount ] = useState(0);
    const [clientData, setClientData] = useState([]);

    // For Storing New Transaction Data Which Will Be Sent To Backend for Creating New Transaction
    const [newTransaction, setNewTransaction] = useState({});
    
    const [showWhichModal, setShowWhichModal] = useState(null);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState({
                                                                show:false,
                                                                title:"",
                                                                message:""});
    const [searchValue, setSearchValue] = useState("");
    const [selectedClientData, setSelectedClientData] = useState(null);

    
    // Change Table Limit Through This Hook
    const [dbLimit, setDbLimit] = useState(15);

    const [hasMore, setHasMore] = useState(true); // Determines if more data is available
    const [offset, setOffset] = useState(0); // Tracks pagination offset

    const [showTransactionInfoModal, setShowTransactionInfoModal] = useState(null);

    const [showTransactionUpdateForm, setShowTransactionUpdateForm] = useState(false);

    const [showTransactionDeleteConfirm, setShowTransactionDeleteConfirm] = useState(null);

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

    function formatINR(number) {
        // Convert number to string and split into integer and decimal parts
        const [integerPart, decimalPart] = number.toString().split('.');
    
        // Define the Indian numbering system formatting
        const regex = /(\d)(?=(\d\d)+\d(\.|$))/g;
        const formattedIntegerPart = integerPart.replace(regex, '$1,');
    
        // Combine integer and decimal parts if decimal part exists
        return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
    }

    // Modal For Showing API Responses and Errors
    const messageModal = () => {
        return (
            <>
                <Modal show={showMessageModal.show === true && showMessageModal.hasOwnProperty("title") && showMessageModal.hasOwnProperty("message")} 
                centered
                style={{backgroundColor:"rgba(0,0,0,0.8)"}}
                onHide={()=>{
                    setShowMessageModal({show:false,title:"",message:""});
                    // Refreshing Transaction List
                    refreshTransactions();
                }}
                >
                    <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                        <Modal.Title>{showMessageModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-light text-dark">
                    <p>{showMessageModal.message}</p>
                    <div className="d-flex" style={{justifyContent:"flex-end"}}>
                        <button className="btn btn-secondary" onClick={()=>{
                            setShowMessageModal({show:false,title:"",message:""});
                            // Refreshing Transaction List
                            refreshTransactions();
                        }}>Close</button>
                    </div>
                    </Modal.Body>
                </Modal>
            </>
        )
    }
    // Modal For Showing Loading Status
    const loadingModal = () => {
        return (
            <Modal show={showLoadingModal === true} centered backdrop="static" keyboard={false} style={{backgroundColor:"rgba(0,0,0,0.8)"}}>
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
    // Modal For Creating New Transactions
    const createTransactionModal = () => {
        return( 
        <>
            <Modal show={showWhichModal==="create-transaction-modal"} onHide={()=>{
                // Executes When Modal Closes
                setShowWhichModal(null);
                setSelectedClientData(null);
                setSearchValue("");
                setNewTransaction({});
            }}
            style={{backgroundColor:"rgba(0,0,0,0.8)"}}
            dialogClassName="custom-modal"
            centered
            backdrop="static" keyboard={false}
            >
                <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                    <Modal.Title>Create Transaction</Modal.Title>
                </Modal.Header>
    
                <Modal.Body className="bg-light text-dark">
                    { selectedClientData === null ? <div>
                    <h4 className="fw-bold text-center">Select Client</h4>
                    {/* Search Box */}
                    <div className="px-3">
                    <input className="text-light px-3 rounded py-2 bg-white text-dark mt-4" value={searchValue === null ? "" : searchValue} onChange={(event)=>setSearchValue(event.target.value)} style={{width:"98%"}} type="text" placeholder="Search Client" />
                    </div>
                    {/* Listing Clients */}
                    <div className="d-flex mt-4 custom-scrollwheel" style={{maxWidth:"550px",overflowY:"auto",height:"385px",overflowX:"hidden"}}>
                        <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"550px",borderRadius:"10px",overflow:"hidden"}}>
                            <thead>
                                <tr>
                                    <th scope="col" className="border-secondary text-white" style={{width:"50px",textAlign:"center",backgroundColor:"teal"}}>Name</th>
                                    <th scope="col" className="border-secondary text-white" style={{width:"50px",textAlign:"center",backgroundColor:"teal"}}>Phone</th>
                                    <th scope="col" className="border-secondary text-white" style={{width:"20px",textAlign:"center",backgroundColor:"teal"}}>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientData.map(client=>{
                                    let client_info_string = `${client.name.toLowerCase()} ${client.phone} ${client.email.toLowerCase()}`
                                    if (searchValue === "" || client_info_string.includes(searchValue.toLowerCase())){ 
                                    return (
                                        <tr key={client.email} style={{fontSize:"15px"}}>

                                            {/* Name */}
                                            <td style={{width:"50px",textAlign:"center"}}>{client.name}</td>

                                            {/* Phone */}
                                            <td style={{width:"50px",textAlign:"center"}}>{client.phone}</td>

                                            {/* Select */}
                                            <td style={{width:"20px",textAlign:"center"}}>
                                                <a title="Select" onClick={()=>{
                                                    setShowLoadingModal(true);
                                                    const headers = {"Authorization":`Bearer ${authToken}`};
                                                    const body = {email:client.email};
                                                    axios.post(`${apiDomain}/admin/client-profile`,body,{headers})
                                                    .then(res=>{
                                                        if (res.data.result === true){
                                                            // Successfully Fetched The Client Profile From API
                                                            setShowLoadingModal(false);
                                                            setSelectedClientData(res.data.data[0]);
                                                            // setting default amount as plan_cost for new transaction
                                                            setNewTransaction({...newTransaction, amount: res.data.data[0].plan_cost});
                                                        }
                                                    })
                                                    .catch(error=>{
                                                        console.error(error);
                                                        setShowLoadingModal(false);
                                                        setShowMessageModal({show:true,title:"Server Error",message:"Server Rejected Your Request :("});
                                                    })
                                                }} className="btn btn-light border text-dark"><i className="bi bi-check2-square"></i> Select</a>
                                            </td>
                                        </tr>
                                        )
                                    } else { return null }
                            })}
                            </tbody>
                        </table>
                    </div>
                    </div>:
                    <>
                    {/* This Will Render When Client is Selected */}
                    {/* Transaction Form */}
                    {/* Client Picture */}
                    <div className="d-flex" style={{justifyContent:"center"}}>
                            <img className="border p-1" width={"150px"} style={{borderRadius:"20px"}} src={`data:image/jpg;base64,${selectedClientData.picture}`} alt={selectedClientData.name} />
                    </div>
                    <div className="text-left">
                            <h5 className="mt-2 text-center">{selectedClientData.name}</h5>
                            <p className="text-secondary text-center" style={{marginTop:"-5px"}}>{selectedClientData.email}</p>
                            <p className="text-secondary text-center" style={{marginTop:"-18px"}}>{selectedClientData.phone}</p>
                            <p className="text-secondary text-center" style={{marginTop:"-18px"}}>Tariff Plan: {selectedClientData.plan_name} ₹{selectedClientData.plan_cost} [{selectedClientData.plan_validity} {selectedClientData.validity_unit}]</p>
                        </div>
                    <div>
                        <h4 className="text-center mt-4 mb-4 fw-bold">New Transaction Form</h4>
                        <form onSubmit={(event)=>{
                            setShowLoadingModal(true);
                            event.preventDefault();
                            if (newTransaction.hasOwnProperty("date") && newTransaction.hasOwnProperty("mode") && newTransaction.hasOwnProperty("amount")){
                                const body = {...newTransaction, "email":selectedClientData.email};
                                const headers = {"Authorization":`Bearer ${authToken}`}
                                axios.post(`${apiDomain}/admin/create-transaction`,body,{headers})
                                .then(res=>{
                                    if (res.data.result===true){
                                        setShowLoadingModal(false);
                                        setShowMessageModal({show:true, title:"Successful", message:"New Transaction Created :)"});
                                        setShowWhichModal(null);
                                        setSelectedClientData(null);
                                        setSearchValue("");
                                        setNewTransaction({});
                                    }
                                }).catch(error=>{
                                    setShowLoadingModal(false);
                                    console.error(error);
                                    setShowMessageModal({show:true, title:"Server Error", message:"Server Rejected Your Request :("});
                                    setShowWhichModal(null);
                                    setSelectedClientData(null);
                                    setSearchValue("");
                                    setNewTransaction({});

                                })
                            }
                        }}>
                            <div className="d-flex form-group" style={{justifyContent:"center"}}>
                                {/* DATE */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="date">Transaction Date</label>
                                    <input type="date" onChange={(e)=>setNewTransaction({...newTransaction, date: e.target.value})} className="form-control bg-light text-dark" name="Transaction Date" required/>
                                </div>
                                {/* PAYMENT METHOD */}
                                <div className="mx-2" style={{minWidth:"250px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Mode">Transaction Mode</label>
                                    <select className="form-control bg-light text-dark" name="Transaction Mode"
                                    onChange={(e)=>{setNewTransaction({...newTransaction,mode:e.target.value})}}
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
                                    <input type="number" defaultValue={selectedClientData.plan_cost} onChange={(e)=>setNewTransaction({...newTransaction, amount: e.target.value})} className="form-control bg-light text-dark" min="1" name="Transaction Amount" placeholder="Amount" required />
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="d-flex mt-4 mb-4" style={{justifyContent:"center"}}>
                                    <button type="submit" className="btn mx-2" style={{backgroundColor:"teal"}}><i className="bi bi-floppy"></i> Create</button>
                                    <button type="button" className="btn btn-secondary mx-2" onClick={()=>{
                                        setNewTransaction({});
                                        setSelectedClientData(null);
                                    }}><i className="bi bi-backspace"></i> Go Back</button>
                            </div>
                        </form>
                    </div>
                    </>
                    }
                </Modal.Body>
    
            </Modal>
        </>)
    }

    // Function That Handles Create Transaction Button
    const handleCreateTransactionButton = (event) => {
            // Shows Spinner Loading Modal
            setShowLoadingModal(true);
            // Fetching Client List
            axios.get(`${apiDomain}/admin/clients`,{headers:{'Authorization':`Bearer ${authToken}`}})
            .then(res=>{
                if (res.data.result === true){
                    // Fetched Data
                    setClientData(res.data.data);

                    // Creating Wait Timer
                    setTimeout(()=>{
                        // Hiding Loading Spinner Modal
                        setShowLoadingModal(false);
                        // Modal
                        setShowWhichModal("create-transaction-modal");
                    },100)
    
                }
                // No Client Found
                else {
                    setShowLoadingModal(false);
                    setShowMessageModal({
                        show:true,
                        title:"No Clients Found",
                        message:"Please, Create a New Client First, After That You Can Create Transactions"
                    })
    
                }
            })
            .catch(error=>{
                console.error(error);
            })
    }

    // Modal For Showing and Updating Client Transactions
    const transactionInfoModal = () => {
        return (
            <Modal show={showTransactionInfoModal!=null} onHide={()=>{
                setShowTransactionInfoModal(null);
                setShowTransactionUpdateForm(false);

            }}
            style={{backgroundColor:"rgba(0,0,0,0.6)"}}
            centered 
            backdrop='static' 
            keyboard={false}
            dialogClassName="custom-admin-transaction-detail-modal"
            >
            {showTransactionUpdateForm === false ? 
            // Transaction Info Model
            <>
                <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                    <Modal.Title>
                        Received ₹ {formatINR(showTransactionInfoModal.amount)} <br />
                        <p className="text-light" style={{fontSize:"12px"}}>{showTransactionInfoModal.id}</p>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light text-dark">
                    {/* Client Picture */}
                    <div className="d-flex mb-4" style={{justifyContent:"center"}}>
                        <img className="border p-1" src={`data:image/png;base64, ${showTransactionInfoModal.client_data.picture}`} width={"150px"} alt="Client Picture" style={{borderRadius:"10px"}} />
                    </div>
                    <div style={{justifyContent:"center"}}>
                        <p className="text-center fw-bold" style={{marginTop:"-10px",fontSize:"20px"}}>{showTransactionInfoModal.name}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>{showTransactionInfoModal.email}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>{showTransactionInfoModal.phone}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>Tariff Plan: {showTransactionInfoModal.client_data.plan_name} ₹{showTransactionInfoModal.client_data.plan_cost} [{showTransactionInfoModal.client_data.plan_validity} {showTransactionInfoModal.client_data.validity_unit}]</p>
                    </div>
                    {/* TRANSACTION ID */}
                    <div className="px-3 mt-5">
                    <p style={{marginBottom:"1px"}}><span className="fw-bold">ID : </span>{showTransactionInfoModal.id}</p>
                    <p style={{marginBottom:"1px"}}><span className="fw-bold">INVOICE : </span>{showTransactionInfoModal.invoice}</p>
                    <p style={{marginBottom:"1px"}}><span className="fw-bold">DATE : </span>{formatDate(showTransactionInfoModal.date)} {formatTime(showTransactionInfoModal.transaction_timestamp)}</p>
                    <p style={{marginBottom:"1px"}}><span className="fw-bold">MODE : </span>{showTransactionInfoModal.mode}</p>
                    <p><span className="fw-bold">RECEIVED : </span>₹ {formatINR(showTransactionInfoModal.amount)}</p>
                    </div>

                    {/* Transaction Auto Generated Message */}
                    { ! showTransactionInfoModal.auto_generated ? <></> : <>
                        <p className="fw-bold px-3" style={{color:"red",fontSize:"14px"}}>This Transaction is Auto Generated by Razorpay,<br /> So It Cannot be Deleted or Modified.</p>
                    </> }
                </Modal.Body>
                <Modal.Footer className="bg-light text-dark" style={{justifyContent:"center"}}>
                    <div className="d-flex" style={{justifyContent:"center"}}>
                        {/* INVOICE BUTTON */}
                        <button className="btn btn-teal border text-white mx-2" onClick={()=>{
                            setShowLoadingModal(true);
                            axios.get(`${apiDomain}/invoice`,{params:{id:showTransactionInfoModal.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
                            .then(res=>{
                                setShowLoadingModal(false);
                                window.open(URL.createObjectURL(res.data), '_blank');
                            })
                            .catch(error => {
                                setShowLoadingModal(false);
                                setShowMessageModal({show:true,title:"Server Error",message:"Check Your Internet Connection or Try Again Later."});
                                console.error('Error fetching protected content:', error);
                            });
                        }} title="View Invoice"><i className="bi bi-receipt-cutoff"></i> Open Invoice</button>

                        {showTransactionInfoModal.auto_generated ? <></> : 
                        <>
                        {/* Button Displayed When Transaction is Manually Generated */}
                                                {/* EDIT TRANSACTION BUTTON */}
                                                <button onClick={()=>{
                                                    setShowTransactionInfoModal({...showTransactionInfoModal, 
                                                        newDate:showTransactionInfoModal.date,
                                                        newMode:showTransactionInfoModal.mode,
                                                        newAmount:showTransactionInfoModal.amount
                                                        });
                                                    setShowTransactionUpdateForm(true);
                                                }} className="btn btn-dark mx-2" title="Edit"><i className="bi bi-pencil-square"></i> Edit</button>
                    
                                                {/* DELETE TRANSACTION BUTTON */}
                                                <button className="btn btn-danger text-light mx-2" onClick={()=>setShowTransactionDeleteConfirm({id:showTransactionInfoModal.id,email:showTransactionInfoModal.email})} title="Delete"><i className="bi bi-trash3"></i> Delete</button>
                        </>}
                    </div>
                </Modal.Footer>
            </>
            :
            // Transaction Update Form
            <>
                <Modal.Header closeButton style={{backgroundColor:"teal"}}>
                    <Modal.Title>
                        Update Transaction <br />
                        <p className="text-light" style={{fontSize:"12px"}}>{showTransactionInfoModal.id}</p>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light text-dark">
                    {/* Client Picture */}
                    <div className="d-flex mb-4" style={{justifyContent:"center"}}>
                        <img className="border p-1" src={`data:image/png;base64, ${showTransactionInfoModal.client_data.picture}`} width={"150px"} alt="Client Picture" style={{borderRadius:"10px"}} />
                    </div>
                    <div style={{justifyContent:"center"}}>
                        <p className="text-center fw-bold" style={{marginTop:"-10px",fontSize:"20px"}}>{showTransactionInfoModal.name}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>{showTransactionInfoModal.email}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>{showTransactionInfoModal.phone}</p>
                        <p className="text-center text-secondary" style={{marginTop:"-15px",fontSize:"14px"}}>Tariff Plan: {showTransactionInfoModal.client_data.plan_name} ₹{showTransactionInfoModal.client_data.plan_cost} [{showTransactionInfoModal.client_data.plan_validity} {showTransactionInfoModal.client_data.validity_unit}]</p>
                    </div>
                    {/* UPDATE TRANSACTION FORM */}
                    <div style={{width:"100%"}}>
                    <form className="mt-2" onSubmit={(event)=>{
                            event.preventDefault();
                            setShowLoadingModal(true);
                            const body = {
                                id : showTransactionInfoModal.id,
                                date : showTransactionInfoModal.newDate,
                                mode : showTransactionInfoModal.newMode,
                                amount : showTransactionInfoModal.newAmount
                            }
                            const headers = {
                                "Authorization" : `Bearer ${authToken}`
                            }
                            axios.put(`${apiDomain}/admin/update-transaction`,body,{headers})
                            .then(res=>{
                                // SUCCESSFUL UPDATE
                                if (res.data.result === true){
                                    setShowTransactionInfoModal({...showTransactionInfoModal, 
                                                                date:showTransactionInfoModal.newDate,
                                                                mode:showTransactionInfoModal.newMode,
                                                                amount:showTransactionInfoModal.newAmount
                                                                });
                                    setShowLoadingModal(false);
                                    setShowMessageModal({
                                        show: true,
                                        title: "Transaction Updated",
                                        message: res.data.message
                                    })
                                    setShowTransactionUpdateForm(false);
                                }
                                // FAILED UPDATE
                                else {
                                    setShowLoadingModal(false);
                                    setShowMessageModal({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                                }
                            })
                            // SERVER ERROR NO API RESPONSE
                            .catch(error=>{
                                setShowLoadingModal(false);
                                    setShowMessageModal({
                                        show: true,
                                        title: "Server Error",
                                        message: "Server Rejected Your Request :("
                                    })
                            })
                            }}
                        >
                            <div className="d-flex form-group" style={{justifyContent:"center"}}>
                                {/* DATE */}
                                <div className="mx-2" style={{minWidth:"200px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="date">Transaction Date</label>
                                    <input type="date" value={showTransactionInfoModal.newDate} onChange={(e)=>setShowTransactionInfoModal({...showTransactionInfoModal, newDate: e.target.value})} className="form-control bg-light text-dark" name="Transaction Date" required/>
                                </div>
                                {/* PAYMENT METHOD */}
                                <div className="mx-2" style={{minWidth:"200px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Mode">Transaction Mode</label>
                                    <select className="form-control bg-light text-dark" name="Transaction Mode"
                                    value={showTransactionInfoModal.newMode}
                                    onChange={(e)=>{setShowTransactionInfoModal({...showTransactionInfoModal,newMode:e.target.value})}}
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
                                <div className="mx-2" style={{minWidth:"420px"}}>
                                    <label className="mx-2 mb-1 text-secondary" htmlFor="Transaction Amount">Transaction Amount (₹ Rupee)</label>
                                    <input type="number" value={showTransactionInfoModal.newAmount} onChange={(e)=>setShowTransactionInfoModal({...showTransactionInfoModal, newAmount: e.target.value})} className="form-control bg-light text-dark" min="1" name="Transaction Amount" placeholder="Amount" required />
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="d-flex mt-4 mb-4" style={{justifyContent:"center"}}>
                                    <button type="submit" className="btn mx-2" style={{backgroundColor:"teal"}}><i className="bi bi-floppy2"></i> Update</button>
                                    <button type="button" className="btn btn-secondary mx-2" onClick={()=>{
                                        setShowTransactionUpdateForm(false);
                                    }}><i className="bi bi-skip-backward-btn"></i> Go Back</button>
                            </div>
                        </form>
                        </div>
                </Modal.Body>
            </>    
            }
            </Modal>
        )
    }

    // Modal For Delete Confirmation of Transaction
    const handleDeleteTransaction = (transaction_id,client_email) =>{
        setShowTransactionDeleteConfirm(null);
        setShowLoadingModal(true);
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
                        setShowTransactionInfoModal(null);
                        setShowLoadingModal(false);
                        setShowMessageModal({
                            show:true,
                            title:"Transaction Deleted",
                            message:response.data.message
                        })
                        }
                    
                    else {
                        // There are No Transactions Left
                        setShowTransactionInfoModal(null);
                        setShowLoadingModal(false);
                        setShowMessageModal({
                            show:true,
                            title:"Transaction Deleted",
                            message:response.data.message
                        })
                    }
                })
                .catch(error=>{
                    console.error(error);
                    setShowLoadingModal(false);
                        setShowMessageModal({
                            show:true,
                            title:"Server Error",
                            message:"Server Rejected Your Request"
                        })
                    })

            }
        })
        .catch(error=>{
            console.error(error);
                    setShowLoadingModal(false);
                        setShowMessageModal({
                            show:true,
                            title:"Server Error",
                            message:"Server Rejected Your Request"
                        })
        })
    }

    const transactionDeleteConfirmModal = () => {
        return (
        showTransactionDeleteConfirm != null &&
        <Modal show={showTransactionDeleteConfirm!=null} 
                onHide={()=>setShowTransactionDeleteConfirm(null)} 
                style={{backgroundColor:"rgba(0,0,0,0.6)"}}
                centered
                backdrop='static' 
                keyboard={false}>
            <Modal.Header className="bg-danger">
            <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
                <h3 className="fw-bold">This action cannot be undone</h3>
                <p>You're about to delete this transaction.</p>
                <div className="d-flex" style={{justifyContent:"flex-end"}}>
                    <button type="button" onClick={()=>{
                        handleDeleteTransaction(showTransactionDeleteConfirm.id,showTransactionDeleteConfirm.email);
                    }} className="btn btn-danger mx-2"><i className="bi bi-trash3"></i>Permanently Delete</button>

                    <button type="button" onClick={()=>setShowTransactionDeleteConfirm(null)} className="btn btn-secondary mx-2"><i className="bi bi-x-circle"></i> Cancel</button>
                </div>
            </Modal.Body>
        </Modal>
        )
    }
    

    useEffect(() => {
        hasMore === false && setHasMore(true);
        offset != 0 && setOffset(0);
        transactionData != "loading" && setTransactionData("loading");
        transactionCount != 0 && setTransactionCount(0);

        const headers = {"Authorization": `Bearer ${authToken}`};
        axios.get(`${apiDomain}/admin/transactions`, { params: { offset: 0, limit: dbLimit }, headers })
        .then(res=>{
            if(res.data.result === true){

                // Setting Transaction Count
                setTransactionCount(res.data.data[0].transaction_count);

                // Check if all transactions have been loaded
                if (res.data.data.length >= res.data.data[0].transaction_count) {
                    setHasMore(false);
                }

                // Fetched Transaction Data
                setTransactionData(res.data.data);

                // Setting Offset
                setOffset((prevOffset) => prevOffset + dbLimit);
            }

            // No Transactions Found in Database
            else if(res.data.result === false){
                setHasMore(false);
                setTransactionData(null);
            }
        })
        .catch (error => {
            setTransactionData("error")
            console.error('Error fetching transactions:', error);
        })
    }, []);

    // Function For Fetching More Transaction For Scroll Pagination
    const refreshTransactions = () => {
        setShowLoadingModal(true);
        const headers = {"Authorization": `Bearer ${authToken}`};
        axios.get(`${apiDomain}/admin/transactions`, { params: { offset: 0, limit: offset }, headers })
        .then(res=>{
            if(res.data.result === true){
                // Transaction Found
                setTransactionData(res.data.data);

                // Stopping Loading
                setShowLoadingModal(false);
            }
        
            // No More Transactions Found in Database
            else if(res.data.result === false){
                setShowLoadingModal(false);
            }
        })
        .catch (error => {
            // Error Occured
            console.error('Error Occured During Refreshing Transaction List '+error);
            setShowLoadingModal(false);
            setShowMessageModal({show:true,title:"Server Error Occured",message:"Please Check Your Internet Connection or Try Again Later."});
        })
    };

    // Function For Fetching More Transaction For Scroll Pagination
    const fetchTransactions = () => {
        setShowLoadingModal(true);
        const headers = {"Authorization": `Bearer ${authToken}`};
        axios.get(`${apiDomain}/admin/transactions`, { params: { offset: offset, limit: dbLimit }, headers })
        .then(res=>{
            if(res.data.result === true){
                // Set Transaction Count
                if (transactionCount != res.data.data[0].transaction_count){
                    setTransactionCount(res.data.data[0].transaction_count);
                }

                // Check if all transactions have been loaded
                if (transactionData.length + res.data.data.length >= res.data.data[0].transaction_count) {
                    setHasMore(false);
                }

                // Transaction Found
                setTransactionData((prevTransactions) => [
                    ...prevTransactions,
                    ...res.data.data,
                ]);
            
                // Setting Offset
                setOffset((prevOffset) => prevOffset + dbLimit);

                // Stopping Loading
                setShowLoadingModal(false);
            }
        
            // No More Transactions Found in Database
            else if(res.data.result === false){
                setShowLoadingModal(false);
            }
        })
        .catch (error => {
            // Error Occured
            console.error('Error Occured During Fetching Transactions '+error);
            setShowLoadingModal(false);
            setShowMessageModal({show:true,title:"Server Error Occured",message:"Please Check Your Internet Connection or Try Again Later."});
        })
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !showLoadingModal) {
            fetchTransactions();
        }
    };
    
    if (transactionData === "error") {
        
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
    else if (transactionData === "loading"){
        return <Spinner/> 
    }
    else if (transactionData != null && transactionData[0].hasOwnProperty("id")) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                <div className="card dark-gradient w-50">
                    <div className="card-body">
                        <h5 className="card-title fw-bold">Transaction Management</h5>
                        <p className="card-text">Total Transactions: {transactionData[0].transaction_count}</p>
                    </div>
                </div>
            </div>
            <div className="d-flex mx-4" style={{justifyContent:"flex-end"}}>
            <button className="btn btn-light fw-bold border-dark mx-2" onClick={handleCreateTransactionButton}><i className="bi bi-person-plus-fill"></i> Add Transaction</button>
            </div>

            <div style={{height:"600px"}}>
            <div onScroll={handleScroll} className="d-flex mt-3 px-4 custom-scrollwheel" style={{maxHeight:"600px",overflowY:"scroll",overflowX:"hidden"}}>
            <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px"}}>
                <thead className="bg-dark border-dark">
                  <tr>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>#</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>Date</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>From</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Received</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"70px",textAlign:"center"}}>Razorpay</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>Invoice No</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Mode</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"150px",textAlign:"center"}}>Phone</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"100px",textAlign:"center"}}>Actions</th>
                  </tr>
                </thead>
            <tbody>
                {transactionData.map((item,index_number)=>{
                    return (
                            <tr key={item.id} style={{fontSize:"15px",height:"10px"}}>
                                {/* Serial Number */}
                                <td scope="row" style={{width:"100px",textAlign:"center"}}>{item.transaction_count - index_number}</td>

                                {/* Date */}
                                <td style={{width:"200px",textAlign:"center"}}>{formatDate(item.date)} {formatTime(item.transaction_timestamp)}</td>

                                {/* Name */}
                                <td style={{width:"150px",textAlign:"center"}}>{item.name.toUpperCase()}</td>

                                {/* Amount */}
                                <td style={{width:"150px",textAlign:"center"}}>&#x20b9; {formatINR(item.amount)}</td>

                                {/* Auto Generated */}
                                <td style={{width:"70px",textAlign:"center"}}>{item.auto_generated ? "Yes" : "No"}</td>

                                {/* Invoice No */}
                                <td style={{width:"100px",textAlign:"center"}}>{item.invoice}</td>

                                {/* Payment Method */}
                                <td title="NETBANKING" style={{width:"150px",textAlign:"center"}}>{item.mode.toUpperCase()}</td>

                                {/* Phone */}
                                <td style={{width:"150px",textAlign:"center"}}>{item.phone}</td>

                                

                                {/* Actions */}
                                <td style={{width:"100px",textAlign:"center"}}>
                                    {/* Show Transaction Info Button */}
                                    <a title="Detailed View" className="btn border text-dark mx-1" onClick={()=>{
                                        setShowLoadingModal(true);
                                        axios.post(`${apiDomain}/admin/client-profile`,{email:item.email},{headers:{'Authorization':`Bearer ${authToken}`}})
                                        .then(res=>{
                                            if (res.data.result === true){
                                                setShowLoadingModal(false);
                                                setShowTransactionInfoModal({...item,client_data:res.data.data[0]});
                                            }
                                            else {
                                                setShowLoadingModal(false);
                                                setShowMessageModal({show:true,title:"Server Error",message:"Server Rejected Your Request :("});
                                            }
                                        })
                                        .catch(error=>{
                                            console.error(error);
                                            setShowMessageModal({show:true,title:"Server Error",message:"Server Rejected Your Request :("});
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
    {createTransactionModal()}
    {messageModal()}
    {loadingModal()}
    {showTransactionInfoModal != null && transactionInfoModal()}
    {transactionDeleteConfirmModal()}
    </div>
    </>
        )
    }
    else if (transactionData === null) {
        
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
                <div className="text-center">
                  <i className="bi bi-receipt-cutoff text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
                  <h2 className="mt-3 text-light">No Transactions Found</h2>
                  <p className="text-light">It seems like there are no transactions available in the database.</p>
                  <button onClick={handleCreateTransactionButton} className="btn btn-light fw-bold border text-dark">
                  <i className="bi bi-currency-rupee"></i> Create New Transaction
                  </button>
                </div>
            </div>
        </div>
        
        {createTransactionModal()}
        {messageModal()}
        {loadingModal()}
        </>
        )
    };
}