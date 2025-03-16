import logo from '../assets/logo.png'

export default function SiteLogo(){
    return <>
        <div className="container-fluid bg-dark py-2 fixed-top">
            <center>
                <img src={logo} width={"140px"} alt="logo" />
                <p style={{marginTop:"-5px",fontSize:"15px"}}>ONLINE CLIENT PORTAL</p>
            </center>
        </div>
    </>
}