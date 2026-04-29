import { useEffect, useState } from "react";
import { SlotContext } from "./SlotContext"

const SlotProvider = ({children}) =>{
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshSlots = async () => {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/slots");
        const data = await res.json();
        setSlots(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshSlots();
    }, []);

    return(
        <SlotContext value={{slots, setSlots, refreshSlots, loading}}>
            {children}
        </SlotContext>
    )
}
export default SlotProvider