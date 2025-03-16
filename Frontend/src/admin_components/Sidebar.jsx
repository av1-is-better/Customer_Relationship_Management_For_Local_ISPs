import logo from '../assets/logo.png'
export default function Sidebar(props){
    const active = props.active;
    const setActive = props.setActive;
    const sidebarLinks = props.sidebarLinks;
    const setLogoutModal = props.setLogoutModal;
    const showLogoutModal = props.showLogoutModal;

    return <>
    <div className="sidebar dark-gradient p-3" style={{ width: '300px', height: '100vh', position: 'fixed', top: '0', left: '0', zIndex: '100' }}>
        <div className='d-flex' style={{justifyContent:"center"}}>
            <img src={logo} width={"150px"} style={{marginTop:"50px"}} alt="logo" />
        </div>
        <p className='text-center' style={{marginTop:"-5px", fontSize:"14px"}}>ADMIN PORTAL</p>
        <br />
        <ul className="nav mt-3 flex-column">
            {sidebarLinks.map((items)=>{
                if (items.title == active){
                    return <li key={items.title} className="nav-item">
                                <div onClick={()=>setActive(items.title)} className='d-flex bg-white text-dark rounded-4 mb-4'>
                                    <a className="nav-link" href="#" dangerouslySetInnerHTML={{ __html: items.logo+" " }} />
                                    <p className='fw-bold' style={{marginTop:"17px"}}>{items.title}</p>
                                </div>
                            </li>
                }
                else if (items.title == "Logout"){
                    return <li key={items.title} className="nav-item">
                            <div onClick={()=>setLogoutModal(true)} className='d-flex rounded-4 mb-4'>
                                <a className="nav-link" href="#" dangerouslySetInnerHTML={{ __html: items.logo+" " }} />
                                <p className='fw-bold' style={{marginTop:"17px"}}>{items.title}</p>
                            </div>
                        </li>
                }
                else {
                    return <li key={items.title} className="nav-item">
                    <div onClick={()=>setActive(items.title)} className='d-flex rounded-4 mb-4'>
                        <a className="nav-link" href="#" dangerouslySetInnerHTML={{ __html: items.logo+" " }} />
                        <p className='fw-bold' style={{marginTop:"17px"}}>{items.title}</p>
                    </div>
                </li>
                }
            })}
        </ul>
    </div>
    </>
}