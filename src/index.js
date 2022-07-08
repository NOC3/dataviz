import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import "./css/index.css"
import MapView from "./MapView";
import AnalisiView from "./AnalisiView";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   <Menu/>
  </React.StrictMode>
);

function Menu(){


    const map = <MapView/>
    const analisi = <AnalisiView/>
    const [view, setView] = useState(map);

 return(
     <div>
         <div className={"menu"}>
              <div className={"menu-inner"}>
                    <input type={"button"} value={"Mappa"} className={"menu-button"} onClick={()=>setView(map)}/>
                    <input type={"button"} value={"Analisi"} className={"menu-button"} onClick={()=>setView(analisi)}/>
              </div>
         </div>
         <div className={"mainView"}>
             {view}
         </div>
     </div>)
}
