"use client"
import App from "@/components/List/app";
import  Tokens  from "@/components/List/Tokens";
import { GraphUI } from "@/components/Graph/ui";

import TweetSearch from "@/components/twitter/TweetSearch";

export default function Home() {
  return (
   <div>
      <App />
      <GraphUI />
      {/* <Button onClick={() => {
        handleTwitterActions()
      }}>Twitter</Button> */}
      {/* <TwitterUI /> */}
      {/* <TweetSearch /> */}
      <Tokens />
   </div>
  );
}
