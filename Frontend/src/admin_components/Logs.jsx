import { useEffect,useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Modal } from "react-bootstrap";

const fetchLogs = async (apiDomain, authToken, setDisableBtn, page, dbLimit, setLogData, setTotalPages) => {
    setDisableBtn(true);
    const offset = (page - 1) * dbLimit;
    const headers = {"Authorization": `Bearer ${authToken}`};
    await axios.get(`${apiDomain}/admin/logs`, { params: {offset: offset, limit: dbLimit }, headers })
    .then(res=>{
        if(res.data.result === true){
            const log_count = res.data.data[0].log_count;
            
            // Calculating Total Pages Required
            setTotalPages(Math.ceil(log_count / dbLimit));

            // Fetched Log Data
            setLogData(res.data.data);
        }
        // No Log Found in Database
        else if(res.data.result === false){
            setLogData(null)
        }
    })
    .catch (error => {
        setLogData("error")
        console.error('Error fetching logs:', error);
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

export default function Logs({authToken, apiDomain}){
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
    
    // logData For Handling Multiple Scinarios (loading,error,null)
    const [logData, setLogData] = useState("loading");
    const [showLoadingModal, setShowLoadingModal] = useState(false);

    // Table Handlers
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Change Table Limit Through This Hook
    const [dbLimit, setDbLimit] = useState(15);

    // Disable Button During API Calls
    const [disableBtn, setDisableBtn] = useState(false);

    // Modal For Showing Loading Status
    const loadingModal = () => {
        return (
            <Modal show={showLoadingModal === true} backdrop="static" keyboard={false}>
                        <Modal.Header>
                            <Modal.Title>Please Wait</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <center>
                            <div className="spinner-border" role="status">
                                <span className="sr-only" hidden>Loading...</span>
                            </div>
                            </center>
                        </Modal.Body>
            </Modal>
        )
    }
    

    useEffect(() => {
        fetchLogs(apiDomain, authToken, setDisableBtn, page, dbLimit, setLogData, setTotalPages);
    }, [page,dbLimit]);
    
    if (logData === "error") {
        
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
    else if (logData === "loading" || disableBtn){
        return <Spinner/> 
    }
    else if (logData != null) {
        return (
            <>
            <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
            <div className="d-flex mt-5 text-center mb-3" style={{minWidth:"900px",justifyContent:"center"}}>
                <div className="card dark-gradient w-50">
                    <div className="card-body">
                        <h5 className="card-title fw-bold">Server Logs</h5>
                        <p className="card-text">Total Logs: {logData[0].log_count}</p>
                    </div>
                </div>
            </div>
            <div className="custom-scrollwheel mb-4" style={{height:"600px",overflowY:"auto",overflowX:"hidden"}}>
            <div className="d-flex mt-3 px-4" style={{minWidth:"900px",height:"auto"}}>
            <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"1250px",borderRadius:"10px"}}>
                <thead>
                  <tr>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"30px",textAlign:"center"}}>#</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"130px",textAlign:"center"}}>Date (DD-MM-YYY)</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"400px",textAlign:"center"}}>Logs</th>
                  </tr>
                </thead>
            <tbody>
                {logData.map((item,index_number)=>{
                    return (
                            <tr key={index_number} style={{fontSize:"15px"}}>
                                {/* Serial Number */}
                                <td scope="row" style={{width:"30px",textAlign:"center", color:"black"}}>{item.log_count - (((page - 1) * dbLimit)+index_number)}</td>

                                {/* Date */}
                                <td style={{width:"130px",textAlign:"left", color:"black",paddingLeft:"15px"}}>{convertTo12HourFormat(item.log_timestamp)}</td>

                                {/* Log Text */}
                                <td style={{width:"400px",textAlign:"left", color:"black",paddingLeft:"20px"}}>{item.log_text}</td>
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
    {loadingModal()}
    </>
        )
    }
    else if (logData === null) {
        
        return (
        <>
        <div className="div-transparent mt-2 rounded-3" style={{width:"1420px",height:"95vh", marginLeft:"100px", paddingLeft:"60px", paddingRight:"60px", paddingTop:"10px"}}>
        <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-database-slash text-light" style={{ fontSize: '10rem', color: 'gray' }}></i>
              <h2 className="mt-3 text-light">No Logs Found</h2>
              <p className="text-light">It seems like there are no logs available in your database.</p>
            </div>
        </div>
        </div>
        </>
        )
    };
}