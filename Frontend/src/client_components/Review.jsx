import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";

const Review = ({apiDomain,authToken,showFeedbackModal,setShowFeedbackModal,setShowLoadingModal,setShowMessageModal}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // starting loading
    setShowLoadingModal(true);

    const feedback = e.target[0].value;
    const wordCount = feedback.trim().split(/\s+/).length;

    // checking rating and feedback isn't empty
    if (rating === 0 || feedback==="") {
        rating === 0 && alert("Please provide a rating.");
        feedback === "" && alert("Please write feedback.");
        setShowLoadingModal(false);
        return;
    }

    // checking feedback length
    if (wordCount < 10) {
        alert("Feedback must contain at least 10 words.");
        setShowLoadingModal(false);
        return;
    }

    const body = {
                rating: rating,
                feedback: feedback
            }
    
    const headers = {"Authorization" : `Bearer ${authToken}`}

    axios.post(`${apiDomain}/client/feedback`,body,{headers})
    .then(res=>{
        if (res.data.result === true){
            // successfully created client review
            setShowLoadingModal(false);
            setShowFeedbackModal(false);
            setShowMessageModal({show:true,title:"Thank You",message:res.data.message});

        }
    })
    .catch(error => {
        setShowLoadingModal(false);
        setShowFeedbackModal(false);
        setShowMessageModal({show:true,type:"error",title:"Server Error",message:"Please check your internet connection, or try again later :("})
        console.error("error occured during creating client feedback!",error);
    })
  };

  return (

    <Modal 
        show={showFeedbackModal === true}
        onHide={()=>{setShowFeedbackModal(false)}}
        centered
        backdrop="static"
        keyboard={null}
        style={{backgroundColor:"rgba(0,0,0,0.6)"}}
        dialogClassName="profile-modal"
    >
        <Modal.Header className="bg-teal">
            <Modal.Title>Feedback Form</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light text-dark">
        <form onSubmit={handleSubmit} className="p-3" style={{ maxWidth: "400px", margin: "auto" }}>
            <div className="mb-3">
                <label className="form-label fw-bold">Rating:</label>
                <div>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={`bi bi-star${star <= (hover || rating) ? "-fill text-warning" : " text-secondary"}`}
                            style={{ cursor: "pointer", fontSize: "1.5rem", marginRight: "5px" }}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                        ></span>
                    ))}
                </div>
            </div>

            <div className="mb-5">
                <label htmlFor="review" className="form-label fw-bold">Feedback:</label>
                <textarea
                    id="review"
                    className="form-control bg-light text-dark mt-2"
                    rows="8"
                    placeholder="Please share your thoughts about your experience with our internet services. How can we serve you better? Your input helps us improve!"
                ></textarea>
            </div>

            <div className="d-flex" style={{justifyContent:"center"}}>
                <button type="submit" className="btn btn-teal mx-1"><i className="bi bi-send-check"></i> Submit</button>
                <button type="button" onClick={()=>{setShowFeedbackModal(false)}} className="btn btn-secondary mx-1"><i className="bi bi-x-square"></i> Close</button>
            </div>

        </form>
        </Modal.Body>
    </Modal>
  );
};

export default Review;
