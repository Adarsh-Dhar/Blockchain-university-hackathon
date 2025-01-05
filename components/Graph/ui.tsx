"use client"
import { Button } from "../ui/button"
import { fetchPriceData } from "./utils"

export const GraphUI = () => {
    return(
    
            <Button onClick={async () => {
                await fetchPriceData()
            } }>Graph</Button>
    
    )
}