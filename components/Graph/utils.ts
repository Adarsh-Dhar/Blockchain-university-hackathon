import axios from "axios"

export const fetchPriceData = async () => {
    try {
        const response = await axios.get("http://localhost:3000/api/tokens/price", {
            params: { ids: "So11111111111111111111111111111111111111112" }
        });
        console.log("response from price ", response.data.data.So11111111111111111111111111111111111111112.price);
   
  } catch(err){
    console.error(err)
  }
}