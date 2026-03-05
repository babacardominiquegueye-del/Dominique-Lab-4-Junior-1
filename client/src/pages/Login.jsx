import React from "react";
import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");

const navigate = useNavigate();

const handleLogin = async (e)=>{
e.preventDefault();

const res = await API.post("/login",{email,password});

localStorage.setItem("token",res.data.token);

navigate("/dashboard");
};

return (
<div>

<h2>Login</h2>

<form onSubmit={handleLogin}>

<input
placeholder="email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="password"
onChange={(e)=>setPassword(e.target.value)}
/>

<button>Login</button>

</form>

</div>
);

}