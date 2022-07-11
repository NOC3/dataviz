import * as d3g from "d3-geo";
import * as d3 from "d3";
import {useRef, useState} from "react";
import {useEffect} from "react";
import {Slider} from "@mui/material";
import ReactLoading from "react-loading";
import Select from "react-select";


let width = 960,
    rotated = 90,
    height = 500;

export default function MapView(props){
    const [loaded, setLoaded] = useState(false)

    const [geographies, setGeographies] = useState([])
    const [datas, setDatas] = useState([])

    const [mouse_up, set_mouse_up] = useState(undefined) //max 370
    const [mouse_down, set_mouse_down] = useState(undefined)

    const [movement_x, setMovement_x] = useState(0)

//    const [center, setCenter] = useState({clientX:0, clientY:0})
    const [center, setCenter] = useState(0)

    function setSelect(e, setFunc){
        let tmp = []
        for(let i = 0; i<e.length; i++){
            tmp.push(e[i].value)
        }
        setFunc(tmp)
    }

    const [selectPaeseOptions, setSelectPaeseOptions] = useState([])
    const [selectAttrOptions, setSelectAttrOptions]= useState([])

    const [selectedCountry, setSelectedCountry] = useState(undefined)
    const [year, setYear] = useState(2015)

    const [histDataSource,setHistDataSource] = useState("selected")
    const [selectHistoptions, setSelectHistOptions] = useState([])

    const [triggerDetails, setTriggerDetails] = useState(false)
    const [triggerHist, setTriggerHist] = useState(false)
    const [triggerLinechart, setTriggerLinechart] = useState(false)

    function fetchDatas(){
        //get json data map and assign it
        fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(response => {
                if (response.status !== 200) {
                    console.log(`There was a problem: ${response.status}`)
                    return
                }
                response.json().then(worlddata => {
                    setGeographies(worlddata.features)
                })
            })
        //get json data and assign it
        fetch("http://markits.altervista.org/datas/datas.php")
            .then(response => {

                if (response.status !== 200) {
                    console.log(`There was a problem: ${response.status}`)
                    return
                }
                response.json().then(worlddata => {
                    setDatas(worlddata)
                })
            })
    }

    function processDatas(){
        if(datas.length!==0 && geographies.length!==0){
            for(let i in geographies){
                let countryname = geographies[i].properties.name
                let d = datas[countryname]
                let props = {
                    name : countryname,
                    data : d
                }
                geographies[i].properties = props
            }
            setGeographies(geographies)
            setLoaded(true)
        }
    }


    useEffect(fetchDatas, [])
    useEffect(processDatas, [geographies,datas])
    useEffect(lineChartPlot, [triggerLinechart, selectPaeseOptions, selectAttrOptions, year])
    useEffect(multiHistPlot, [triggerHist,year, selectedCountry, histDataSource, selectHistoptions])






    function handleZoomMap(e){
        console.log(e)
    }



    let projection = d3g.geoMercator()
//        .translate([width/2,height/1.5])
        .translate([height/1.5,height/1.5])
        .rotate([center,0])



    if(loaded){
        return(<div>
            <div className={"slider"}>
                <div className={"slider-inner"}>
                    <Slider
                        aria-label="Anni"
                        defaultValue={2015}
                        valueLabelDisplay="auto"
                        step={1}
                        min={2015}
                        max={2019}
                        onChange={(e)=>setYear(e.target.value)}

                    />
                </div>

            </div>
            <div className={"map"} >
                <svg onClick={(e)=>setCenter(e)} onWheel={handleZoomMap} onMouseUp={(e)=>set_mouse_up(e)} onMouseDown={(e)=>set_mouse_down(e)} className={"map-svg"} width={ "100%" } height={ "100%" } viewBox="0 0 800 450"  >
                    <g className="countries">
                        {geographies.map((d,i) => {
                            let happyrank = d.properties.data===undefined? null : (d.properties.data[year]===undefined? null : d.properties.data[year]["Happiness Score"]*10)
                            let color
                            if(happyrank===null){
                                color = `rgb(220,220,220)`
                            }else{
                                color = numberToColorHsl(happyrank)
                            }
                            return(<path
                                key={ "path-"+i }
                                d={ d3g.geoPath().projection(projection)(d) }
                                className="country"
                                fill={ color }
                                stroke="#FFFFFF"
                                strokeWidth={ 0.5 }
                                onClick={(g)=>showDetails(g, d)}
                            />)
                        })}
                    </g>
                </svg>
                <div>
                    <Slider
                        aria-label="Anni"
                        defaultValue={0}
                        min={-width/4}
                        max={width/4}
                        onChange={(e)=>setCenter(-e.target.value)}

                    />
                </div>
            </div>
            <div>
                <Details/>
            </div>
            <div>
                {triggerHist ?
                    <div className={"hist"}>
                        <input type={"button"} value={"chiudi"} onClick={() => setTriggerHist(false)}/>
                        {histDataSource==="selected"?
                            <input type={"button"} value={"Seleziona da input"} onClick={() => setHistDataSource("input")}/>
                            :
                            <input type={"button"} value={"Seleziona dalla mappa"} onClick={() => setHistDataSource("selected")}/>
                        }
                        <div className={"select select-attributi"}> Attributi
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable={true}
                                isSearchable={true}
                                name="color"
                                isMulti
                                options={PaesiOpt}
                                onChange={(e)=>setSelect(e,setSelectHistOptions)}
                            /></div>
                        <div id={"histchart-area"}></div>
                    </div>
                    :
                    <div><input className={"stat-button-hist"} type={"button"} value={"Apri Istogramma"} onClick={()=>setTriggerHist(true)}/></div>
                }
            </div>
            <div>
                {triggerLinechart? <div className={"linechart"}>
                    <input type={"button"} value={"chiudi"} onClick={()=>setTriggerLinechart(false)}/>
                    <div className={"select select-paese"}> Paesi
                        <input type={"button"} value={"Seleziona tutti"} onClick={()=>setSelect(PaesiOpt, setSelectPaeseOptions)}/>
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            isClearable={true}
                            isSearchable={true}
                            name="color"
                            isMulti
                            options={PaesiOpt}
                            onChange={(e)=>setSelect(e,setSelectPaeseOptions)}
                        /></div>
                    <div className={"select select-attributi"}> Attributi
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            isClearable={true}
                            isSearchable={true}
                            name="color"
                            isMulti
                            options={AttrOpt}
                            onChange={(e)=>setSelect(e,setSelectAttrOptions)}
                        /></div>
                    <div id={"linechart-area"}></div>
                </div> : <div className={"stat-button-line"}><input type={"button"} value={"Apri linechart"} onClick={()=>setTriggerLinechart(true)}/></div>}
            </div>
        </div>)
    }else{
        return(<div><ReactLoading type={"spin"}/></div>)
    }

    function showDetails(g, d){
        setTriggerDetails(true)
        setSelectedCountry(d.properties)
    }

    function Details(){
        if(triggerDetails){
            if(selectedCountry!==undefined && selectedCountry.data!==undefined && selectedCountry.data[year]!==undefined) {
                let datas = selectedCountry.data[year]
                let k = Object.keys(datas)
                return (<div className={"details"}>
                    <input type={"button"} value={"chiudi"} onClick={() => setTriggerDetails(false)}/>
                    <div>Nome: {selectedCountry.name}</div>
                    {k.map((k, key)=><div key={key}>{k}: {datas[k]!==undefined? datas[k] : "Dati mancanti"}</div>)}
                </div>)
            }else{
                return (<div className={"details"}>
                    <input type={"button"} value={"chiudi"} onClick={() => setTriggerDetails(false)}/>
                    <div>Dati mancanti</div>
                </div>)
            }

        }else{
            return(<div></div>)
        }
    }

    function lineChartPlot() {
        function removeAllChildNodes(parent) {
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        }
        const container = document.querySelector("#linechart-area");

        if (loaded && datas!==undefined && container!==null) {
            // set the dimensions and margins of the graph
            var margin = {top: 30, right: 50, bottom: 10, left: 50},
                width = 920 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

            //clearing
            removeAllChildNodes(container);

            // append the svg object to the body of the page
            var svg = d3.select("#linechart-area")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");



                // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
//                let dimensions = Object.keys(data[0]).filter(function(d) { return d != "Species" })

                let dimensions = selectAttrOptions
                let data = formatterLC(datas, year, dimensions, selectPaeseOptions)

                // For each dimension, I build a linear scale. I store all in a y object
                const y = {}
                for (let i in dimensions) {
                    let name = dimensions[i]
                    y[name] = d3.scaleLinear()
                        .domain(d3.extent(data, function (d) {
                            return +d[name];
                        }))
                        .range([height, 0])
                }

                var color = d3.scaleOrdinal()
                    .domain(["setosa", "versicolor", "virginica" ])
                    .range([ "#440154ff", "#21908dff", "#fde725ff"])

                // Build the X scale -> it find the best position for each Y axis
                let x = d3.scalePoint()
                    .range([0, width])
                    .padding(1)
                    .domain(dimensions);

                // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
                function path(d) {
                    return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
                }

                var highlight = function(d){
                    console.log(d.target)

                    // first every group turns grey
                    d3.selectAll(".line")
                        .transition().duration(200)
                        .style("stroke", "lightgrey")
                        .style("opacity", "0.2")
                    // Second the hovered specie takes its color
                    d3.select(d.target)
                        .transition().duration(200)
                        .style("stroke", "green")
                        .style("opacity", "1")
                }

                // Unhighlight
                var doNotHighlight = function(d){
                    d3.selectAll(".line")
                        .transition().duration(200).delay(1000)
                        .style("stroke", function(d){ return( color(d.country))} )
                        .style("opacity", "1")
                }

                svg
                    .selectAll("myPath")
                    .data(data)
                    .enter()
                    .append("path")
                    .attr("class", function (d) { return "line " + d.country } ) // 2 class for each line: 'line' and the group name
                    .attr("d",  path)
                    .style("fill", "none" )
                    .style("stroke", function(d){ return( color(d.country))} )
                    .style("opacity", 0.5)
                    .on("mouseover", highlight)
                    .on("mouseleave", doNotHighlight )

                // Draw the axis:
                svg.selectAll("myAxis")
                    // For each dimension of the dataset I add a 'g' element:
                    .data(dimensions).enter()
                    .append("g")
                    .attr("class", "axis")
                    // I translate this element to its right position on the x axis
                    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
                    // And I build the axis with the call function
                    .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
                    // Add axis title
                    .append("text")
                    .style("text-anchor", "middle")
                    .attr("y", -9)
                    .text(function(d) { return d; })
                    .style("fill", "black")

        }
    }

    function multiHistPlot() {
        function removeAllChildNodes(parent) {
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        }
        const container = document.querySelector("#histchart-area");

        if (loaded && container!==null) {
            removeAllChildNodes(container);


            let d
            let domain

            if (histDataSource === "selected") {
                d = [selectedCountry]

            } else {
                d = []
                for (let i = 0; i < selectHistoptions.length; i++) {
                    let tmp = {
                        name:selectHistoptions[i],
                        data:datas[selectHistoptions[i]]
                    }
                    d.push(tmp)
                }
            }

            if (d.length>0 && d[0]!==undefined) {
                domain = Object.keys(d[0].data[year]).filter(function (d) {
                    return !(d === "Year" || d === "Happiness Rank")
                })
                let groupData = formatterHC(d, domain, year)

                var margin = {top: 20, right: 20, bottom: 70, left: 40},
                    width = 400 - margin.left - margin.right,
                    height = 400 - margin.top - margin.bottom;


                var x0 = d3.scaleBand().rangeRound([0, width], .5)
                var x1 = d3.scaleBand();
                var y = d3.scaleLinear().rangeRound([height, 0]);

                var xAxis = d3.axisBottom().scale(x0)
                    .tickValues(groupData.map(d => d.key));

                var yAxis = d3.axisLeft().scale(y);

                const color = d3.scaleOrdinal(d3.schemeCategory10);

                var svg = d3.select('#histchart-area').append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var categoriesNames = groupData.map(function (d) {
                    return d.key;
                });
                var rateNames = groupData[0].values.map(function (d) {
                    return d.grpName;
                });

                x0.domain(categoriesNames);
                x1.domain(rateNames).rangeRound([0, x0.bandwidth()]);
                y.domain([0, d3.max(groupData, function (key) {
                    return d3.max(key.values, function (d) {
                        return d.grpValue;
                    });
                })]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");


                svg.append("g")
                    .attr("class", "y axis")
                    .style('opacity', '0')
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .style('font-weight', 'bold')
                    .text("Value");

                svg.select('.y').transition().duration(500).delay(1300).style('opacity', '1');

                var slice = svg.selectAll(".slice")
                    .data(groupData)
                    .enter().append("g")
                    .attr("class", "g")
                    .attr("transform", function (d) {
                        return "translate(" + x0(d.key) + ",0)";
                    });

                slice.selectAll("rect")
                    .data(function (d) {
                        return d.values;
                    })
                    .enter().append("rect")
                    .attr("width", x1.bandwidth())
                    .attr("x", function (d) {
                        return x1(d.grpName);
                    })
                    .style("fill", function (d) {
                        return color(d.grpName)
                    })
                    .attr("y", function (d) {
                        return y(0);
                    })
                    .attr("height", function (d) {
                        return height - y(0);
                    })
                /*
                .on("mouseover", function(d) {
                    d3.select(this).style("fill", d3.rgb(color(d.grpName)).darker(2));
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("fill", color(d.grpName));
                });

                 */


                slice.selectAll("rect")
                    .transition()
                    .delay(function (d) {
                        return Math.random() * 1000;
                    })
                    .duration(1000)
                    .attr("y", function (d) {
                        return y(d.grpValue);
                    })
                    .attr("height", function (d) {
                        return height - y(d.grpValue);
                    });

                //Legend
                var legend = svg.selectAll(".legend")
                    .data(groupData[0].values.map(function (d) {
                        return d.grpName;
                    }).reverse())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function (d, i) {
                        return "translate(0," + i * 20 + ")";
                    })
                    .style("opacity", "0");

                legend.append("rect")
                    .attr("x", width - 18)
                    .attr("width", 18)
                    .attr("height", 18)
                    .style("fill", function (d) {
                        return color(d);
                    });

                legend.append("text")
                    .attr("x", width - 24)
                    .attr("y", 9)
                    .attr("dy", ".35em")
                    .style("text-anchor", "end")
                    .text(function (d) {
                        return d;
                    });

                legend.transition().duration(500).delay(function (d, i) {
                    return 1300 + 100 * i;
                }).style("opacity", "1");

            }
        }
    }
    function histPlot(){
        if(selectedCountry) {
            var margin = {top: 30, right: 30, bottom: 70, left: 60},
                width = 460 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            var svg = d3.select("#histchart-area")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
            // Parse the Data
            let domain = Object.keys(selectedCountry.data[year]).filter(function(d) { return d !== "Year"  })

            let data = []
            for(let i = 0; i<domain.length; i++){
                data.push([domain[i],selectedCountry.data[year][domain[i]]])
            }

            // X axis
            var x = d3.scaleBand()
                .range([0, width])
                .domain(domain)
                .padding(0.2);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, 5])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Bars
            svg.selectAll("mybar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "mybar")
                .attr("x", function (d) {
                    return x(d[0]);
                })
                .attr("y", function (d) {
                    return y(d[1]);
                })
                .attr("width", x.bandwidth())
                .attr("height", function (d) {
                    return height - y(d[1]);
                })
                .attr("fill", "#69b3a2")
        }

    }
}


// convert a number to a color using hsl
function numberToColorHsl(i) {
    // as the function expects a value between 0 and 1, and red = 0° and green = 120°
    // we convert the input to the appropriate hue value
    var hue = i * 1.2 / 360;
    // we convert hsl to rgb (saturation 100%, lightness 50%)
    var rgb = hslToRgb(hue, 1, .5);
    // we format to css value and return
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';

    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

function formatterHC(list, column, year){
    let res = []

    for(let i = 0; i<column.length; i++){
        let col = column[i]
        let values = []
        //{grpName:'Team1', grpValue:26},
        for(let j = 0; j<list.length; j++){
            let elem = list[j]
            values.push({
                grpName: elem.name,
                grpValue: elem.data[year][col]
            })
        }
        let tmp = {
            key: col,
            values: values
        }
        res.push(tmp)
    }
    return res
}

function formatterLC(d, y, c, af){
    let keys = Object.keys(d)

    let a = []
    for(let i =0; i<keys.length; i++){
        let k =keys[i]
        if(af.includes(k)){
            let tmp = d[k][y]
            if(tmp!==undefined){
                tmp["country"]=k
                a.push(tmp)
            }
        }
    }
    a.push({"columns":c})
    return a
}

const AttrOpt = [{value:"Happiness Rank",label:"Happiness Rank"},
    {value:"Economy",label:"Economy"}, {value:"Family",label:"Family"},
    {value:"Health",label:"Health"}, {label:"Freedom",value:"Freedom"},
    {label:"Goverment Trust",value:"Goverment Trust"}, {value:"Generosity",label:"Generosity"}]
const PaesiOpt = [
    {
        "value": "Denmark",
        "label": "Denmark"
    },
    {
        "value": "Switzerland",
        "label": "Switzerland"
    },
    {
        "value": "Iceland",
        "label": "Iceland"
    },
    {
        "value": "Norway",
        "label": "Norway"
    },
    {
        "value": "Finland",
        "label": "Finland"
    },
    {
        "value": "Canada",
        "label": "Canada"
    },
    {
        "value": "Netherlands",
        "label": "Netherlands"
    },
    {
        "value": "New Zealand",
        "label": "New Zealand"
    },
    {
        "value": "Australia",
        "label": "Australia"
    },
    {
        "value": "Sweden",
        "label": "Sweden"
    },
    {
        "value": "Israel",
        "label": "Israel"
    },
    {
        "value": "Austria",
        "label": "Austria"
    },
    {
        "value": "USA",
        "label": "USA"
    },
    {
        "value": "Costa Rica",
        "label": "Costa Rica"
    },
    {
        "value": "Puerto Rico",
        "label": "Puerto Rico"
    },
    {
        "value": "Germany",
        "label": "Germany"
    },
    {
        "value": "Brazil",
        "label": "Brazil"
    },
    {
        "value": "Belgium",
        "label": "Belgium"
    },
    {
        "value": "Ireland",
        "label": "Ireland"
    },
    {
        "value": "Luxembourg",
        "label": "Luxembourg"
    },
    {
        "value": "Mexico",
        "label": "Mexico"
    },
    {
        "value": "Singapore",
        "label": "Singapore"
    },
    {
        "value": "United Kingdom",
        "label": "United Kingdom"
    },
    {
        "value": "Chile",
        "label": "Chile"
    },
    {
        "value": "Panama",
        "label": "Panama"
    },
    {
        "value": "Argentina",
        "label": "Argentina"
    },
    {
        "value": "Czech Republic",
        "label": "Czech Republic"
    },
    {
        "value": "United Arab Emirates",
        "label": "United Arab Emirates"
    },
    {
        "value": "Uruguay",
        "label": "Uruguay"
    },
    {
        "value": "Malta",
        "label": "Malta"
    },
    {
        "value": "Colombia",
        "label": "Colombia"
    },
    {
        "value": "France",
        "label": "France"
    },
    {
        "value": "Thailand",
        "label": "Thailand"
    },
    {
        "value": "Saudi Arabia",
        "label": "Saudi Arabia"
    },
    {
        "value": "Taiwan",
        "label": "Taiwan"
    },
    {
        "value": "Qatar",
        "label": "Qatar"
    },
    {
        "value": "Spain",
        "label": "Spain"
    },
    {
        "value": "Algeria",
        "label": "Algeria"
    },
    {
        "value": "Guatemala",
        "label": "Guatemala"
    },
    {
        "value": "Suriname",
        "label": "Suriname"
    },
    {
        "value": "Kuwait",
        "label": "Kuwait"
    },
    {
        "value": "Bahrain",
        "label": "Bahrain"
    },
    {
        "value": "Trinidad and Tobago",
        "label": "Trinidad and Tobago"
    },
    {
        "value": "Venezuela",
        "label": "Venezuela"
    },
    {
        "value": "Slovakia",
        "label": "Slovakia"
    },
    {
        "value": "El Salvador",
        "label": "El Salvador"
    },
    {
        "value": "Malaysia",
        "label": "Malaysia"
    },
    {
        "value": "Nicaragua",
        "label": "Nicaragua"
    },
    {
        "value": "Uzbekistan",
        "label": "Uzbekistan"
    },
    {
        "value": "Italy",
        "label": "Italy"
    },
    {
        "value": "Ecuador",
        "label": "Ecuador"
    },
    {
        "value": "Belize",
        "label": "Belize"
    },
    {
        "value": "Japan",
        "label": "Japan"
    },
    {
        "value": "Kazakhstan",
        "label": "Kazakhstan"
    },
    {
        "value": "Moldova",
        "label": "Moldova"
    },
    {
        "value": "Russia",
        "label": "Russia"
    },
    {
        "value": "Poland",
        "label": "Poland"
    },
    {
        "value": "South Korea",
        "label": "South Korea"
    },
    {
        "value": "Bolivia",
        "label": "Bolivia"
    },
    {
        "value": "Lithuania",
        "label": "Lithuania"
    },
    {
        "value": "Belarus",
        "label": "Belarus"
    },
    {
        "value": "North Cyprus",
        "label": "North Cyprus"
    },
    {
        "value": "Slovenia",
        "label": "Slovenia"
    },
    {
        "value": "Peru",
        "label": "Peru"
    },
    {
        "value": "Turkmenistan",
        "label": "Turkmenistan"
    },
    {
        "value": "Mauritius",
        "label": "Mauritius"
    },
    {
        "value": "Libya",
        "label": "Libya"
    },
    {
        "value": "Latvia",
        "label": "Latvia"
    },
    {
        "value": "Cyprus",
        "label": "Cyprus"
    },
    {
        "value": "Paraguay",
        "label": "Paraguay"
    },
    {
        "value": "Romania",
        "label": "Romania"
    },
    {
        "value": "Estonia",
        "label": "Estonia"
    },
    {
        "value": "Jamaica",
        "label": "Jamaica"
    },
    {
        "value": "Croatia",
        "label": "Croatia"
    },
    {
        "value": "Hong Kong",
        "label": "Hong Kong"
    },
    {
        "value": "Somalia",
        "label": "Somalia"
    },
    {
        "value": "Kosovo",
        "label": "Kosovo"
    },
    {
        "value": "Turkey",
        "label": "Turkey"
    },
    {
        "value": "Indonesia",
        "label": "Indonesia"
    },
    {
        "value": "Jordan",
        "label": "Jordan"
    },
    {
        "value": "Azerbaijan",
        "label": "Azerbaijan"
    },
    {
        "value": "Philippines",
        "label": "Philippines"
    },
    {
        "value": "China",
        "label": "China"
    },
    {
        "value": "Bhutan",
        "label": "Bhutan"
    },
    {
        "value": "Kyrgyzstan",
        "label": "Kyrgyzstan"
    },
    {
        "value": "Serbia",
        "label": "Serbia"
    },
    {
        "value": "Bosnia and Herzegovina",
        "label": "Bosnia and Herzegovina"
    },
    {
        "value": "Montenegro",
        "label": "Montenegro"
    },
    {
        "value": "Dominican Republic",
        "label": "Dominican Republic"
    },
    {
        "value": "Morocco",
        "label": "Morocco"
    },
    {
        "value": "Hungary",
        "label": "Hungary"
    },
    {
        "value": "Pakistan",
        "label": "Pakistan"
    },
    {
        "value": "Lebanon",
        "label": "Lebanon"
    },
    {
        "value": "Portugal",
        "label": "Portugal"
    },
    {
        "value": "Macedonia",
        "label": "Macedonia"
    },
    {
        "value": "Vietnam",
        "label": "Vietnam"
    },
    {
        "value": "Somaliland Region",
        "label": "Somaliland Region"
    },
    {
        "value": "Tunisia",
        "label": "Tunisia"
    },
    {
        "value": "Greece",
        "label": "Greece"
    },
    {
        "value": "Tajikistan",
        "label": "Tajikistan"
    },
    {
        "value": "Mongolia",
        "label": "Mongolia"
    },
    {
        "value": "Laos",
        "label": "Laos"
    },
    {
        "value": "Nigeria",
        "label": "Nigeria"
    },
    {
        "value": "Honduras",
        "label": "Honduras"
    },
    {
        "value": "Iran",
        "label": "Iran"
    },
    {
        "value": "Zambia",
        "label": "Zambia"
    },
    {
        "value": "Nepal",
        "label": "Nepal"
    },
    {
        "value": "Palestinian Territories",
        "label": "Palestinian Territories"
    },
    {
        "value": "Albania",
        "label": "Albania"
    },
    {
        "value": "Bangladesh",
        "label": "Bangladesh"
    },
    {
        "value": "Sierra Leone",
        "label": "Sierra Leone"
    },
    {
        "value": "Iraq",
        "label": "Iraq"
    },
    {
        "value": "Namibia",
        "label": "Namibia"
    },
    {
        "value": "Cameroon",
        "label": "Cameroon"
    },
    {
        "value": "Ethiopia",
        "label": "Ethiopia"
    },
    {
        "value": "South Africa",
        "label": "South Africa"
    },
    {
        "value": "Sri Lanka",
        "label": "Sri Lanka"
    },
    {
        "value": "India",
        "label": "India"
    },
    {
        "value": "Myanmar",
        "label": "Myanmar"
    },
    {
        "value": "Egypt",
        "label": "Egypt"
    },
    {
        "value": "Armenia",
        "label": "Armenia"
    },
    {
        "value": "Kenya",
        "label": "Kenya"
    },
    {
        "value": "Ukraine",
        "label": "Ukraine"
    },
    {
        "value": "Ghana",
        "label": "Ghana"
    },
    {
        "value": "Congo (Kinshasa)",
        "label": "Congo (Kinshasa)"
    },
    {
        "value": "Georgia",
        "label": "Georgia"
    },
    {
        "value": "Congo (Brazzaville)",
        "label": "Congo (Brazzaville)"
    },
    {
        "value": "Senegal",
        "label": "Senegal"
    },
    {
        "value": "Bulgaria",
        "label": "Bulgaria"
    },
    {
        "value": "Mauritania",
        "label": "Mauritania"
    },
    {
        "value": "Zimbabwe",
        "label": "Zimbabwe"
    },
    {
        "value": "Malawi",
        "label": "Malawi"
    },
    {
        "value": "Sudan",
        "label": "Sudan"
    },
    {
        "value": "Gabon",
        "label": "Gabon"
    },
    {
        "value": "Mali",
        "label": "Mali"
    },
    {
        "value": "Haiti",
        "label": "Haiti"
    },
    {
        "value": "Botswana",
        "label": "Botswana"
    },
    {
        "value": "Comoros",
        "label": "Comoros"
    },
    {
        "value": "Ivory Coast",
        "label": "Ivory Coast"
    },
    {
        "value": "Cambodia",
        "label": "Cambodia"
    },
    {
        "value": "Angola",
        "label": "Angola"
    },
    {
        "value": "Niger",
        "label": "Niger"
    },
    {
        "value": "South Sudan",
        "label": "South Sudan"
    },
    {
        "value": "Chad",
        "label": "Chad"
    },
    {
        "value": "Burkina Faso",
        "label": "Burkina Faso"
    },
    {
        "value": "Uganda",
        "label": "Uganda"
    },
    {
        "value": "Yemen",
        "label": "Yemen"
    },
    {
        "value": "Madagascar",
        "label": "Madagascar"
    },
    {
        "value": "Tanzania",
        "label": "Tanzania"
    },
    {
        "value": "Liberia",
        "label": "Liberia"
    },
    {
        "value": "Guinea",
        "label": "Guinea"
    },
    {
        "value": "Rwanda",
        "label": "Rwanda"
    },
    {
        "value": "Benin",
        "label": "Benin"
    },
    {
        "value": "Afghanistan",
        "label": "Afghanistan"
    },
    {
        "value": "Togo",
        "label": "Togo"
    },
    {
        "value": "Syria",
        "label": "Syria"
    },
    {
        "value": "Burundi",
        "label": "Burundi"
    },
    {
        "value": "Trinidad & Tobago",
        "label": "Trinidad & Tobago"
    },
    {
        "value": "Northern Cyprus",
        "label": "Northern Cyprus"
    },
    {
        "value": "North Macedonia",
        "label": "North Macedonia"
    },
    {
        "value": "Gambia",
        "label": "Gambia"
    },
    {
        "value": "Mozambique",
        "label": "Mozambique"
    },
    {
        "value": "Swaziland",
        "label": "Swaziland"
    },
    {
        "value": "Lesotho",
        "label": "Lesotho"
    },
    {
        "value": "Central African Republic",
        "label": "Central African Republic"
    },
    {
        "value": "Oman",
        "label": "Oman"
    },
    {
        "value": "Somaliland region",
        "label": "Somaliland region"
    },
    {
        "value": "Djibouti",
        "label": "Djibouti"
    },
    {
        "value": "Taiwan Province of China",
        "label": "Taiwan Province of China"
    },
    {
        "value": "Hong Kong S.A.R., China",
        "label": "Hong Kong S.A.R., China"
    }
]


/*

 */