import axios from "axios"

export const fetchPriceData = async () => {
    try {
        const response = await axios.post("http://localhost:3000/api/tokens/price", {
                tokenAddress: "So11111111111111111111111111111111111111112",
                timeStamp: Date.now().toString()
        });
        console.log("response from price ", response.data);
   
  } catch(err){
    console.error(err)
  }
}