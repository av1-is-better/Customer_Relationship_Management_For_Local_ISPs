import React from "react";

const BottomNavbar = ({navbarLinks,active,setActive,setShowLogoutModal}) => {

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-bottom">
      <div
        className="d-flex justify-content-center align-items-center w-100"
        style={{ textAlign: "center" }}
      >

        {navbarLinks.map((item,index)=>{
            if (item.title === "Logout") {
              return (
                  <a key={index} onClick={()=>{
                    setShowLogoutModal(true);
                  }} className="navbar-brand mx-2 px-2">
                      <div style={{ fontSize: "40px" }}>
                          <i className={item.logoClass}></i>
                      </div>
                      <div style={{ fontSize: "14px" }}>{item.title}</div>
                  </a>
              )

            }

            else if (item.title === active) {
                return (
                    <a key={index} onClick={()=>{ active != item.title && setActive(item.title) }} className="navbar-brand mx-2 px-2 bg-light text-dark rounded-2">
                        <div style={{ fontSize: "40px" }}>
                            <i className={item.logoClass}></i>
                        </div>
                        <div style={{ fontSize: "14px" }}>{item.title}</div>
                    </a>
                )
            }
            else {
                return (
                    <a key={index} onClick={()=>{ active != item.title && setActive(item.title) }} className="navbar-brand mx-2 px-2">
                        <div style={{ fontSize: "40px" }}>
                            <i className={item.logoClass}></i>
                        </div>
                        <div style={{ fontSize: "14px" }}>{item.title}</div>
                    </a>
                )
            }
        })}

      </div>
    </nav>
  );
};

export default BottomNavbar;
