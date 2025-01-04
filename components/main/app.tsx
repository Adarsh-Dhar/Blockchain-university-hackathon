"use client"


import axios from 'axios';
import { Button } from '../ui/button';
const App = () => {


  return (
    <div>
      <Button 
        onClick={async () => {
            try{
                const response = await axios.get('https://tokens.jup.ag/tokens_with_markets');
                console.log("response", response.data)
            }catch(error) {
                console.error(error)
            }
            
        } }
      >
        click me
      </Button>
    </div>
  );
};

export default App;
