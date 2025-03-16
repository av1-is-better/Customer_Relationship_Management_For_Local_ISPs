import { useEffect,useState } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import axios from "axios";
import Spinner from "../components/Spinner.jsx";
import { Button, Modal } from 'react-bootstrap';
import PaymentModeChart from "./PaymentModeChart.jsx";


function Dashboard(apiDomain, authToken, apiData, showTransactionDetailModel, setShowTransactionDetailModel, transactionModelData, setTransactionModelData, dataFound, showLoadingModal, setShowLoadingModal, transactionList, setTransactionList, showMessageModal, setShowMessageModal) {
  // This Function Returns INR value formatted using comma (,) like 1,000 10,000 10,00,000
  function formatINR(number) {
    // Convert number to string and split into integer and decimal parts
    const [integerPart, decimalPart] = number.toString().split('.');

    // Define the Indian numbering system formatting
    const regex = /(\d)(?=(\d\d)+\d(\.|$))/g;
    const formattedIntegerPart = integerPart.replace(regex, '$1,');

    // Combine integer and decimal parts if decimal part exists
    return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
  }
  // Pie Chart data
  // const data = [
  //   { name: 'CASH', value: apiData[0].cash_transaction_count },
  //   { name: 'CREDIT CARD', value: apiData[0].credit_card_transaction_count },
  //   { name: 'DEBIT CARD', value: apiData[0].debit_card_transaction_count },
  //   { name: 'UPI', value: apiData[0].upi_transaction_count },
  //   { name: 'NETBANKING', value: apiData[0].netbanking_transaction_count },
  //   { name: 'CHEQUE', value: apiData[0].cheque_transaction_count },
  // ];

  const data = apiData.map((item)=>{
    return { name: item.plan_name, value: item.subscribers }
  });

  const COLORS = [
    "#16A085",  // Teal
    "#C0392B", // Strong Red
    "#2980B9", // Deep Sky Blue
    "#8A8D90", // Rich Green
    "#F39C12", // Bright Orange
    "#8E44AD", // Vivid Purple
  ];

  // Pie Chart data
  const paymentChartData = [
    { mode: 'CASH', count: apiData[0].cash_transaction_count },
    { mode: 'CREDIT CARD', count: apiData[0].credit_card_transaction_count },
    { mode: 'DEBIT CARD', count: apiData[0].debit_card_transaction_count },
    { mode: 'UPI', count: apiData[0].upi_transaction_count },
    { mode: 'NETBANKING', count: apiData[0].netbanking_transaction_count },
    { mode: 'CHEQUE', count: apiData[0].cheque_transaction_count },
  ];

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


  return(<>
  <div className="div-transparent mt-2 rounded-3" style={{height:"95vh", marginLeft:"100px", paddingLeft:"40px", paddingRight:"38px", paddingTop:"70px"}}>

  <div className="d-flex">

        <div>

                    {/* ===================================================================================================================================================== */}

                  <div className="d-flex mt-3 rounded-5 second-gradient-combo text-dark">
                                              {/* 

                                      ░█████╗░██╗░░░░░██╗███████╗███╗░░██╗████████╗  ░█████╗░░█████╗░██╗░░░██╗███╗░░██╗████████╗
                                      ██╔══██╗██║░░░░░██║██╔════╝████╗░██║╚══██╔══╝  ██╔══██╗██╔══██╗██║░░░██║████╗░██║╚══██╔══╝
                                      ██║░░╚═╝██║░░░░░██║█████╗░░██╔██╗██║░░░██║░░░  ██║░░╚═╝██║░░██║██║░░░██║██╔██╗██║░░░██║░░░
                                      ██║░░██╗██║░░░░░██║██╔══╝░░██║╚████║░░░██║░░░  ██║░░██╗██║░░██║██║░░░██║██║╚████║░░░██║░░░
                                      ╚█████╔╝███████╗██║███████╗██║░╚███║░░░██║░░░  ╚█████╔╝╚█████╔╝╚██████╔╝██║░╚███║░░░██║░░░
                                      ░╚════╝░╚══════╝╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░  ░╚════╝░░╚════╝░░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░
                                              */}
                                <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
                                                              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                                              <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                                                              </svg> Clients</h5>
                                        <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>{apiData[0].client_count}</p>
                                    </div>
                                </div>

                                
                                <div className="vertical-line"></div>
        
        
                                              {/* 

                                      ████████╗██████╗░░█████╗░███╗░░██╗░██████╗░█████╗░░█████╗░████████╗██╗░█████╗░███╗░░██╗
                                      ╚══██╔══╝██╔══██╗██╔══██╗████╗░██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║
                                      ░░░██║░░░██████╔╝███████║██╔██╗██║╚█████╗░███████║██║░░╚═╝░░░██║░░░██║██║░░██║██╔██╗██║
                                      ░░░██║░░░██╔══██╗██╔══██║██║╚████║░╚═══██╗██╔══██║██║░░██╗░░░██║░░░██║██║░░██║██║╚████║
                                      ░░░██║░░░██║░░██║██║░░██║██║░╚███║██████╔╝██║░░██║╚█████╔╝░░░██║░░░██║╚█████╔╝██║░╚███║
                                      ░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝
                                              
                                      ░█████╗░░█████╗░██╗░░░██╗███╗░░██╗████████╗
                                      ██╔══██╗██╔══██╗██║░░░██║████╗░██║╚══██╔══╝
                                      ██║░░╚═╝██║░░██║██║░░░██║██╔██╗██║░░░██║░░░
                                      ██║░░██╗██║░░██║██║░░░██║██║╚████║░░░██║░░░
                                      ╚█████╔╝╚█████╔╝╚██████╔╝██║░╚███║░░░██║░░░
                                      ░╚════╝░░╚════╝░░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░
                                              */}

                                <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-cash-stack" viewBox="0 0 16 16">
                                                              <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                                                              <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
                                                              </svg> Transactions</h5>
                                        <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>{apiData[0].transaction_count}</p>
                                    </div>
                                </div>


                                <div className="vertical-line"></div>

                                               {/* 

                                       ░█████╗░███╗░░░███╗░█████╗░██╗░░░██╗███╗░░██╗████████╗  ░█████╗░░█████╗░██╗░░░██╗███╗░░██╗████████╗
                                       ██╔══██╗████╗░████║██╔══██╗██║░░░██║████╗░██║╚══██╔══╝  ██╔══██╗██╔══██╗██║░░░██║████╗░██║╚══██╔══╝
                                       ███████║██╔████╔██║██║░░██║██║░░░██║██╔██╗██║░░░██║░░░  ██║░░╚═╝██║░░██║██║░░░██║██╔██╗██║░░░██║░░░
                                       ██╔══██║██║╚██╔╝██║██║░░██║██║░░░██║██║╚████║░░░██║░░░  ██║░░██╗██║░░██║██║░░░██║██║╚████║░░░██║░░░
                                       ██║░░██║██║░╚═╝░██║╚█████╔╝╚██████╔╝██║░╚███║░░░██║░░░  ╚█████╔╝╚█████╔╝╚██████╔╝██║░╚███║░░░██║░░░
                                       ╚═╝░░╚═╝╚═╝░░░░░╚═╝░╚════╝░░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░  ░╚════╝░░╚════╝░░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░
                                               */}

                                <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-bank" viewBox="0 0 16 16">
                                                                <path d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1 .485.38l.5 2a.498.498 0 0 1-.485.62H.5a.498.498 0 0 1-.485-.62l.5-2A.5.5 0 0 1 1 13V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89zM3.777 3h8.447L8 1zM2 6v7h1V6zm2 0v7h2.5V6zm3.5 0v7h1V6zm2 0v7H12V6zM13 6v7h1V6zm2-1V4H1v1zm-.39 9H1.39l-.25 1h13.72z"/>
                                                                </svg> Amount Processed</h5>
                                        <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>&#x20b9; {formatINR(apiData[0].amount_total)}</p>
                                    </div>
                                </div>
                    </div>






                      {/* ===================================================================================================================================================== */}






                      <div className="d-flex mt-4 rounded-5 second-gradient-combo">
                                                {/* 

                                        ░█████╗░░█████╗░████████╗██╗██╗░░░██╗███████╗  ██╗░██████╗░██████╗██╗░░░██╗███████╗░██████╗
                                        ██╔══██╗██╔══██╗╚══██╔══╝██║██║░░░██║██╔════╝  ██║██╔════╝██╔════╝██║░░░██║██╔════╝██╔════╝
                                        ███████║██║░░╚═╝░░░██║░░░██║╚██╗░██╔╝█████╗░░  ██║╚█████╗░╚█████╗░██║░░░██║█████╗░░╚█████╗░
                                        ██╔══██║██║░░██╗░░░██║░░░██║░╚████╔╝░██╔══╝░░  ██║░╚═══██╗░╚═══██╗██║░░░██║██╔══╝░░░╚═══██╗
                                        ██║░░██║╚█████╔╝░░░██║░░░██║░░╚██╔╝░░███████╗  ██║██████╔╝██████╔╝╚██████╔╝███████╗██████╔╝
                                        ╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░░░╚═╝░░░╚══════╝  ╚═╝╚═════╝░╚═════╝░░╚═════╝░╚══════╝╚═════╝░
                                                */}
                                          <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                              <div className="card-body">
                                                  <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><i style={{fontSize:"24px"}} className="bi bi-emoji-angry"></i> Active Complaints</h5>
                                                  <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>{apiData[0].active_issues_count === null ? 0 : apiData[0].active_issues_count}</p>
                                              </div>
                                          </div>

                                          <div className="vertical-line"></div>

                                                {/* 
                                        ███████╗███████╗███████╗██████╗░██████╗░░█████╗░░█████╗░██╗░░██╗░██████╗
                                        ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║░██╔╝██╔════╝
                                        █████╗░░█████╗░░█████╗░░██║░░██║██████╦╝███████║██║░░╚═╝█████═╝░╚█████╗░
                                        ██╔══╝░░██╔══╝░░██╔══╝░░██║░░██║██╔══██╗██╔══██║██║░░██╗██╔═██╗░░╚═══██╗
                                        ██║░░░░░███████╗███████╗██████╔╝██████╦╝██║░░██║╚█████╔╝██║░╚██╗██████╔╝
                                        ╚═╝░░░░░╚══════╝╚══════╝╚═════╝░╚═════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝╚═════╝░
                                                */}
                                            <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                                <div className="card-body">
                                                    <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><i style={{fontSize:"24px"}} className="bi bi-star-half"></i> Client Feedback</h5>
                                                    <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>{apiData[0].total_reviews === null ? 0 : apiData[0].total_reviews}</p>
                                                </div>
                                            </div>

                                            <div className="vertical-line"></div>

                                                {/* 

                                        ████████╗░█████╗░████████╗░█████╗░██╗░░░░░  ██████╗░██╗░░░░░░█████╗░███╗░░██╗░██████╗
                                        ╚══██╔══╝██╔══██╗╚══██╔══╝██╔══██╗██║░░░░░  ██╔══██╗██║░░░░░██╔══██╗████╗░██║██╔════╝
                                        ░░░██║░░░██║░░██║░░░██║░░░███████║██║░░░░░  ██████╔╝██║░░░░░███████║██╔██╗██║╚█████╗░
                                        ░░░██║░░░██║░░██║░░░██║░░░██╔══██║██║░░░░░  ██╔═══╝░██║░░░░░██╔══██║██║╚████║░╚═══██╗
                                        ░░░██║░░░╚█████╔╝░░░██║░░░██║░░██║███████╗  ██║░░░░░███████╗██║░░██║██║░╚███║██████╔╝
                                        ░░░╚═╝░░░░╚════╝░░░░╚═╝░░░╚═╝░░╚═╝╚══════╝  ╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░
                                                */}

                                            <div className="card borderless text-dark" style={{width:"18rem",margin:"5px",backgroundColor:"transparent"}}>
                                                <div className="card-body">
                                                    <h5 className="card-title fw-bold" style={{fontSize:"20px", textAlign:"center"}}><i style={{fontSize:"24px"}} className="bi bi-router-fill"></i> Tariff Plans</h5>
                                                    <p className="card-text fw-bold" style={{fontSize:"30px", textAlign:"center"}}>{apiData[0].total_plans}</p>
                                                </div>
                                            </div>
                      </div>




    
                      {/* ===================================================================================================================================================== */}





                      <div className="d-flex mt-4">
                                                  {/* 
                                                  
                                        ██████╗░░█████╗░██████╗░░██████╗░██████╗░░█████╗░██████╗░██╗░░██╗
                                        ██╔══██╗██╔══██╗██╔══██╗██╔════╝░██╔══██╗██╔══██╗██╔══██╗██║░░██║
                                        ██████╦╝███████║██████╔╝██║░░██╗░██████╔╝███████║██████╔╝███████║
                                        ██╔══██╗██╔══██║██╔══██╗██║░░╚██╗██╔══██╗██╔══██║██╔═══╝░██╔══██║
                                        ██████╦╝██║░░██║██║░░██║╚██████╔╝██║░░██║██║░░██║██║░░░░░██║░░██║
                                        ╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░░░░╚═╝░░╚═╝
                                                  */}
                                        {
                                          <div className="card second-gradient-combo text-dark rounded-4 py-4 px-3" style={{width:"550px", minHeight:"460px", margin:"5px"}}>
                                            {dataFound === true && apiData[0].transaction_count != 0 ? <>
                                              <PaymentModeChart data={paymentChartData} />
                                            </> : <>
                                              <p style={{fontSize:"20px",fontWeight:"bold"}} className="text-center fw-bold">Popular Transaction Modes</p>
                                              <p className="text-center text-secondary" style={{marginTop:"50px"}}><i style={{fontSize:"100px"}} className="bi bi-ban"></i></p>
                                              <p className="text-center px-5">No Transaction Data Available in Database</p>
                                            </>}
                                            
                                          </div>
                                        }
        
                                                {/* 

                                        ██████╗░██╗███████╗  ░█████╗░██╗░░██╗░█████╗░██████╗░████████╗
                                        ██╔══██╗██║██╔════╝  ██╔══██╗██║░░██║██╔══██╗██╔══██╗╚══██╔══╝
                                        ██████╔╝██║█████╗░░  ██║░░╚═╝███████║███████║██████╔╝░░░██║░░░
                                        ██╔═══╝░██║██╔══╝░░  ██║░░██╗██╔══██║██╔══██║██╔══██╗░░░██║░░░
                                        ██║░░░░░██║███████╗  ╚█████╔╝██║░░██║██║░░██║██║░░██║░░░██║░░░
                                        ╚═╝░░░░░╚═╝╚══════╝  ░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░
                                                */}
        
                                        <div className="card second-gradient-combo text-dark rounded-4 py-4 px-3" style={{width:"350px", margin:"5px"}}>
                                        {dataFound === true && apiData[0].transaction_count !=0 ? <>
                                        <h5 className="text-center fw-bold">Tariff Subscribers</h5>
                                        <PieChart width={330} height={350} className="">
                                          <Pie
                                            data={data}
                                            cx={160}
                                            cy={125}
                                            innerRadius={0}
                                            outerRadius={115}
                                            fill="#8884d8"
                                            paddingAngle={0}
                                            dataKey="value"
                                          >
                                            {data.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <Tooltip />
                                          <Legend />
                                        </PieChart>
                                        </> : <>
                                        <h4 className="text-center fw-bold">Pie Chart</h4>
                                        <p className="text-center text-secondary" style={{marginTop:"50px"}}><i style={{fontSize:"100px"}} className="bi bi-ban"></i></p>
                                        <p className="text-center px-5">No Tariff Data Available in Database</p>
                                        </>}
                                        </div>

                      </div>



                      {/* ===================================================================================================================================================== */}
          </div>

          <div className="card second-gradient-combo text-dark rounded-4 py-4 px-3" style={{width:"440px", marginLeft:"25px", marginTop:"15px", marginBottom:"8px" }}>
          <div>
            <h5 className="text-center fw-bold mb-4">Recent Transactions</h5>
          </div>
          <div className="custom-scrollwheel" style={{maxHeight:"650px", overflowY:"scroll"}}>
          <table className="table rounded-table second-gradient-combo table-light table-striped" style={{minWidth:"250px",borderRadius:"10px",overflow:"hidden"}}>
                <thead className="bg-dark border-dark">
                  <tr>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"130px",textAlign:"center"}}>Date</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"120px",textAlign:"center"}}>Received</th>
                    <th scope="col" className="bg-dark border-secondary text-white" style={{width:"170px",textAlign:"center"}}>From</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionList != null && Array.isArray(transactionList) && transactionList.map((item,index)=>{
                    return (
                      <tr onClick={()=>{
                        setShowLoadingModal(true);
                        
                        const headers = {"Authorization": `Bearer ${authToken}`};
                        const body = {"email":item.email};

                        axios.post(`${apiDomain}/admin/client-profile`,body,{headers})
                        .then(res => {
                          if (res.data.result === true){
                            setShowLoadingModal(false);
                            setTransactionModelData({...item,...res.data.data[0]});
                            setShowTransactionDetailModel(true);
                          }
                          else {
                            setShowLoadingModal(false);
                            setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Please check your internet connection, or try again later :("});
                          }
                        })
                        .catch(error => {
                          console.error("error occured during fetching client profile",error);
                          setShowLoadingModal(false);
                          setShowMessageModal({show:true,type:"error",title:"Error Occured",message:"Please check your internet connection, or try again later :("});
                        })
                      }} key={index} style={{fontSize:"15px"}}>
                      
                        {/* Date */}
                        <td scope="row" style={{minWidth:"120px", textAlign:"center"}}>{formatDate(item.date)} {formatTime(item.transaction_timestamp)}</td>

                        {/* Amount */}
                        <td scope="row" style={{minWidth:"100px", textAlign:"center"}}>₹ {formatINR(item.amount)}</td>

                        {/* From */}
                        <td scope="row" style={{maxWidth:"170px", textAlign:"center",textTransform:"capitalize"}}>{item.name.length < 13 ? item.name.toLowerCase().substring(0,12) : item.name.toLowerCase().substring(0,12)+"...."}</td>
                    
                    </tr>
                    )
                  })}
                </tbody>
          </table>
          </div>
          </div>
    </div>






















    {/* 
███╗░░░███╗░█████╗░██████╗░░█████╗░██╗░░░░░
████╗░████║██╔══██╗██╔══██╗██╔══██╗██║░░░░░
██╔████╔██║██║░░██║██║░░██║███████║██║░░░░░
██║╚██╔╝██║██║░░██║██║░░██║██╔══██║██║░░░░░
██║░╚═╝░██║╚█████╔╝██████╔╝██║░░██║███████╗
╚═╝░░░░░╚═╝░╚════╝░╚═════╝░╚═╝░░╚═╝╚══════╝ */}
    
    { 
    showTransactionDetailModel === true &&
    <Modal 
      show={showTransactionDetailModel} 
      onHide={()=>setShowTransactionDetailModel(false)} 
      backdrop="static" 
      keyboard={false}
      style={{backgroundColor:"rgba(0,0,0,0.5)"}}
      centered
      >
      <Modal.Header closeButton className="bg-teal">
        <div className="block">
        <h4>Received ₹ {formatINR(transactionModelData.amount)}</h4>
        <p className="text-muted" style={{marginBottom:"1px"}}>{transactionModelData.id}</p>
        </div>
      </Modal.Header>
      <Modal.Body className="bg-light text-dark">
        <div className="d-flex" style={{justifyContent:"center"}}>
        <img className="rounded-3" width={"150px"} src={`data:image/jpg;base64,${transactionModelData.picture}`} alt="" />
        </div>
        <div className="block text-center mt-1">
        <p style={{fontWeight:"bold",fontSize:"20px"}}>{transactionModelData.name}</p>
        <p style={{marginTop:"-18px"}} className="text-secondary">{transactionModelData.email}</p>
        <p style={{marginTop:"-18px"}} className="text-secondary">{transactionModelData.phone}</p>
        </div>
        <p className="fw-bold fs-5">Transactions Details:</p>
        <div className="mx-3">
          <p style={{marginBottom:"1px",marginTop:"-10px"}}><span className="fw-bold">ID: </span>{transactionModelData.id}</p>
          <p style={{marginBottom:"1px"}}><span className="fw-bold">INVOICE: </span>{transactionModelData.invoice}</p>
          <p style={{marginBottom:"1px"}}><span className="fw-bold">DATE: </span>{formatDate(transactionModelData.date)} {formatTime(transactionModelData.transaction_timestamp)}</p>
          <p style={{marginBottom:"1px"}}><span className="fw-bold">MODE: </span>{transactionModelData.mode}</p>
          <p style={{marginBottom:"1px"}}><span className="fw-bold">AMOUNT: </span>₹ {formatINR(transactionModelData.amount)}</p>
        </div>
        <div>
            <p className="fw-bold text-danger mt-4">{transactionModelData.auto_generated === true ? "This Transaction is Auto Generated via Razorpay" : null}</p>
        </div>
        <div className="d-flex" style={{justifyContent:"center"}}>
          <button onClick={()=>{
            setShowLoadingModal(true);
            axios.get(`${apiDomain}/invoice`,{params:{id:transactionModelData.id}, responseType:'blob', headers:{'Authorization':`Bearer ${authToken}`}})
            .then(res=>{
                setShowLoadingModal(false);
                window.open(URL.createObjectURL(res.data), '_blank');
            })
            .catch(error => {
                setShowLoadingModal(false);
                setShowMessageModal({show:true,title:"Server Error",type:"error",message:"Check Your Internet Connection or Try Again Later."});
                console.error('Error fetching protected content:', error);
            });
          }} className="btn btn-teal mx-1"><i className="bi bi-receipt"></i> Invoice</button>
          <button onClick={()=>setShowTransactionDetailModel(false)} className="btn btn-secondary mx-1"><i className="bi bi-x-square"></i> Close</button>
        </div>
      </Modal.Body>
    </Modal>
    }
      {/* 
      
██╗░░░░░░█████╗░░█████╗░██████╗░██╗███╗░░██╗░██████╗░  ███╗░░░███╗░█████╗░██████╗░░█████╗░██╗░░░░░
██║░░░░░██╔══██╗██╔══██╗██╔══██╗██║████╗░██║██╔════╝░  ████╗░████║██╔══██╗██╔══██╗██╔══██╗██║░░░░░
██║░░░░░██║░░██║███████║██║░░██║██║██╔██╗██║██║░░██╗░  ██╔████╔██║██║░░██║██║░░██║███████║██║░░░░░
██║░░░░░██║░░██║██╔══██║██║░░██║██║██║╚████║██║░░╚██╗  ██║╚██╔╝██║██║░░██║██║░░██║██╔══██║██║░░░░░
███████╗╚█████╔╝██║░░██║██████╔╝██║██║░╚███║╚██████╔╝  ██║░╚═╝░██║╚█████╔╝██████╔╝██║░░██║███████╗
╚══════╝░╚════╝░╚═╝░░╚═╝╚═════╝░╚═╝╚═╝░░╚══╝░╚═════╝░  ╚═╝░░░░░╚═╝░╚════╝░╚═════╝░╚═╝░░╚═╝╚══════╝ */}
      <Modal show={showLoadingModal === true} backdrop="static" keyboard={false} centered style={{backgroundColor:"rgba(0,0,0,0.8)"}}>
        <Modal.Header className="bg-teal">
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

      {/* 
███╗░░░███╗███████╗░██████╗░██████╗░█████╗░░██████╗░███████╗  ███╗░░░███╗░█████╗░██████╗░░█████╗░██╗░░░░░
████╗░████║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝░██╔════╝  ████╗░████║██╔══██╗██╔══██╗██╔══██╗██║░░░░░
██╔████╔██║█████╗░░╚█████╗░╚█████╗░███████║██║░░██╗░█████╗░░  ██╔████╔██║██║░░██║██║░░██║███████║██║░░░░░
██║╚██╔╝██║██╔══╝░░░╚═══██╗░╚═══██╗██╔══██║██║░░╚██╗██╔══╝░░  ██║╚██╔╝██║██║░░██║██║░░██║██╔══██║██║░░░░░
██║░╚═╝░██║███████╗██████╔╝██████╔╝██║░░██║╚██████╔╝███████╗  ██║░╚═╝░██║╚█████╔╝██████╔╝██║░░██║███████╗
╚═╝░░░░░╚═╝╚══════╝╚═════╝░╚═════╝░╚═╝░░╚═╝░╚═════╝░╚══════╝  ╚═╝░░░░░╚═╝░╚════╝░╚═════╝░╚═╝░░╚═╝╚══════╝ */}

        <Modal
          show={showMessageModal.show === true}
          onHide={()=>{
            setShowMessageModal({show:false,type:"",title:"",message:""})
          }}
          backdrop="static"
          keyboard={false}
          style={{backgroundColor:"rgba(0,0,0,0.5)"}}
          centered
        >
            <Modal.Header closeButton className={showMessageModal.type === "error" ? "bg-danger text-light" : "bg-teal text-light"}>
              <Modal.Title>{showMessageModal.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light text-dark">
              <p>{showMessageModal.message}</p>
            </Modal.Body>
        </Modal>
    </div>
    
    </>)


}

export default function Home({authToken,apiDomain}){
    const [ spinner, setSpinner ] = useState(true);
    const [ apiData, setApiData ] = useState({});
    const [ dataFound, setDataFound ] = useState(false);
    const [ showTransactionDetailModel, setShowTransactionDetailModel ] = useState(false);
    const [ transactionList, setTransactionList ] = useState(null);
    const [ transactionModelData, setTransactionModelData ] = useState({});
    const [ serverError, setServerError ] = useState(false);
    const [ showLoadingModal, setShowLoadingModal ] = useState(false);
    const [ showMessageModal, setShowMessageModal ] = useState({show:false,type:"",title:"",message:""});

    useEffect(()=>{
      const headers = {"Authorization":`Bearer ${authToken}`}
      axios.get(`${apiDomain}/admin/dashboard`,{headers})
      .then(res => {
        if (res.data.hasOwnProperty("data")){
          setDataFound(true);
          setSpinner(false);
          setApiData(res.data.data);
          if (res.data.hasOwnProperty("transaction_data")){
            setTransactionList(res.data.transaction_data);
          }
        }
      })
      .catch(error => {
        setServerError(true);
        console.log(error);
      })
    },[])

    if (serverError === true ){ 
      return(
        <>
        <div className="w-100 d-flex flex-column justify-content-center align-items-center text-dark" style={{marginLeft:"20vh",marginTop:"200px" }}>
            <div className="text-center">
              <i className="bi bi-wifi-off text-dark" style={{ fontSize: '8rem', color: 'gray' }}></i>
              <h2 className="mt-3">Server Not Accessible</h2>
              <p className="text-dark">Please check your internet connection or try again later.</p>
            </div>
          </div>
        </>
        )}
    else {
        return(
          <>
          { spinner ? <Spinner />
              :
              Dashboard(apiDomain, authToken, apiData, showTransactionDetailModel, setShowTransactionDetailModel, transactionModelData, setTransactionModelData, dataFound, showLoadingModal, setShowLoadingModal, transactionList, setTransactionList, showMessageModal, setShowMessageModal) }

          </>)
    }
}