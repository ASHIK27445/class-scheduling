import { useEffect, useState } from "react";
import { SlotContext } from "./SlotContext"

const SlotProvider = ({children}) =>{
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_BASE_LINK

const refreshSlots = async () => {
    setLoading(true);
    try {
        console.log("API BASE:", API_BASE);
        const fullUrl = `${API_BASE}/slots`;
        console.log("FULL URL:", fullUrl);
        
        const res = await fetch(fullUrl);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setSlots(data);
    } catch (error) {
        console.error("Fetch error:", error);
        // You might want to set an error state here
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        console.log("API BASE:", API_BASE);
console.log("FULL URL:", `${API_BASE}/slots`);
        refreshSlots();
    }, []);

    return(
        <SlotContext value={{slots, setSlots, refreshSlots, loading}}>
            {children}
        </SlotContext>
    )
}
export default SlotProvider