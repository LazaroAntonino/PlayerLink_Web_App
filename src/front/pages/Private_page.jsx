import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";


export const Private_page = () => {
    const navigate = useNavigate()
    const {store, dispatch} = useGlobalReducer();

    useEffect (()=>{
        if (!store.user){
            navigate('/')
        }else{
            navigate('/private/profile')
        }
    },[])
    
    return <div>
        
    </div>
}