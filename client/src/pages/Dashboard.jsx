import { useEffect, useState } from "react";
import API from "../api";

export default function Dashboard() {

const [todos, setTodos] = useState([]);

useEffect(() => {

const token = localStorage.getItem("token");

API.get("/todos",{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(res => setTodos(res.data));

},[]);

return (

<div>
<h2>Dashboard</h2>

{todos.map(todo => (
<p key={todo.id}>{todo.content}</p>
))}

</div>

);

}