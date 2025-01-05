"use client"


import axios from 'axios';
import { Button } from '../ui/button';
const App = () => {


  return (
    <div>
      <Button 
        onClick={async () => {
            try{
                console.log("1")
                const response = await axios.get('http://localhost:3000/api/tokens');
                if(!response) {
                    console.log("no resp")
                }
                console.log("response", response.data)
                console.log("response 1", response.data[0])

                console.log("2")

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
