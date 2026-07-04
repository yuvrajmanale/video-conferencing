import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import mobileImg from "../assets/mobile.png";

export default function Landing() {

const router = useNavigate();

  return (
    <div className="Landingpagecontainer">
      <nav>
        <div className="navHeader">
          <h2> Video Call</h2>
        </div>
        <div className="navlist">
          <p onClick={() => {
           router("/q23qsc");
          }}>Join as Guest</p>
          <p onClick={() => {
            router("/auth")
          }}>Register</p>
          <div role="button">
            <p onClick={() => {
              router("/auth")
            }}>Login</p>
          </div>
        </div>
      </nav>

   <div className="landingMainConatiner">
       <div>
        <h1><span style={{color:"#ff9839"}}>Connect</span> with your loved Ones</h1>

        <p>Cover a distance by apna Video Call</p>
        <div role="button">
            <Link to={"/home"}>Get Started</Link>
        </div>
       </div>
       <div>

   <img src={mobileImg} alt="" />

       </div>
   </div>

    </div>
  );
}
