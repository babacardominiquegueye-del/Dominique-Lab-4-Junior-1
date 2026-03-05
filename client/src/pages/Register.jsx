import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Register(){

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");

const navigate = useNavigate();

const handleRegister = async (e)=>{
e.preventDefault();

await API.post("/register",{email,password});

navigate("/login");
};

return(

<div>

<h2>Register</h2>

<form onSubmit={handleRegister}>

<input
placeholder="email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="password"
onChange={(e)=>setPassword(e.target.value)}
/>

<button>Register</button>

</form>

</div>

);

}