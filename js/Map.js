function map(dataset) {
  var format = d3.format(",");
  
  

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
              width = 960 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;
  
  var color = d3.scaleThreshold()
      .domain([10,20,30,40,50,60,70,80,90,100])
      .range(["rgb(255,255,217)", "rgb(237,248,177)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)","rgb(34,94,168)","rgb(12,44,132)","rgb(3,27,93)","rgb(2,13,43)"]);
  
  var path = d3.geoPath();
  
  
    var svg = d3.select("#map")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append('g')
                .attr('class', 'map');

    var projection = d3.geoMercator()
                        .scale(130)
                        .translate( [width / 2, height / 1.5]);

    var path = d3.geoPath().projection(projection);

    // Set tooltips
    var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return "<strong>Country: </strong><span class='details'>" + d.properties.name +  "<br></span>" + 
                    "<strong>RNEW: </strong><span class='details'>" + format(d.Renewable2021) + "<br></span>" +
                    "<strong>ELEC: </strong><span class='details'>" + format(d.Electricity2021) +"<br></span>" +
                    "<strong>GDP per capita: </strong><span class='details'>" + format(d.GDP) +"</span>";
                })

    svg.call(tip);
    let selectedCountries = [];

    queue()
        .defer(d3.json, "data/world_countries.json")
        .defer(d3.tsv, dataset)
        .await(ready);

    function ready(error, countries, data) {
        var countryById = {};
        var elecById = {};
        var gdpById = {};

        data.forEach(function(d) { countryById[d.id] = +d.Renewable2021; });
        countries.features.forEach(function(d) { d.Renewable2021 = countryById[d.id] });
        data.forEach(function(d) { elecById[d.id] = +d.Electricity2021; });     //adds elec data for tooltip use
        countries.features.forEach(function(d) { d.Electricity2021 = elecById[d.id] });
        data.forEach(function(d) { gdpById[d.id] = +d.GDP; });     //adds GDP per capita data for tooltip use
        countries.features.forEach(function(d) { d.GDP = gdpById[d.id] });

        svg.append("g")
            .attr("class", "countries")
        .selectAll("path")
            .data(countries.features)
        .enter().append("path")
            .attr("d", path)
            .style("fill", function(d) { return color(countryById[d.id]); })
            .style('stroke', 'white')
            .style('stroke-width', 1.5)
            .style("opacity",0.8)
            // tooltips
            .style("stroke","black")
            .style('stroke-width', 0.3)
            .on('mouseover', function(d) {
              tip.show(d);
            d3.select(this).style("opacity", 1).style("stroke-width", 3);
    
    // Check if the country name exists in the energy data
    const countryName = d.properties.name;
    if (energyData[countryName]) {
        updatePieChart(countryName); // Update the pie chart with the hovered country data
    }

    if (d.mapSelected == false || d.mapSelected == undefined){
        d3.select(this).style("stroke", "pink");
    }
})


            .on('mouseout', function(d){
                tip.hide(d);

                d3.select(this)
                .style("opacity", 0.8)
                if (d.mapSelected == false || d.mapSelected == undefined){
                    d3.select(this)
                    .style("stroke","black")
                    .style("stroke-width",0.3);
                }
            })
            .on('click', function(d){
                console.log(d3.select(this))
                // d3.select(this)._groups[0][0].classList.contains("mapSelected") == true
                if (d.mapSelected == true){
                    d.mapSelected = false
                    d3.select(this).style("stroke", "pink")
                }
                else{
                    d.mapSelected = true
                    selectedCountries.push(countryName);
                    d3.select(this).style("stroke", "red")
                }
              updatePieChartWithAverages(selectedCountries, countries.features);
                // console.log(svg.selectAll("path"))
                // svg.selectAll("path").style("stroke", "pink")
            });

        svg.append("path")
            .datum(topojson.mesh(countries.features, function(a, b) { return a.id !== b.id; }))
            // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
            .attr("class", "names")
            .attr("d", path);

        
    }
  function updatePieChartWithAverages(selectedCountries, energyData) {
    if (selectedCountries.length === 0) {
      updatePieChart(energyData["World"]); // Default to World if no country is selected
      return;
    }

    // Initialize totals for each renewable type
    let totals = {
      BIOENERGY: 0,
      HYDROPOWER: 0,
      SOLAR: 0,
      WIND: 0
    };

    // Calculate totals for each renewable type
    selectedCountries.forEach((country) => {
      if (energyData[country]) {
        totals.BIOENERGY += energyData[country].BIOENERGY || 0;
        totals.HYDROPOWER += energyData[country].HYDROPOWER || 0;
        totals.SOLAR += energyData[country].SOLAR || 0;
        totals.WIND += energyData[country].WIND || 0;
      }
    });

    // Calculate averages
    const numCountries = selectedCountries.length;
    let averages = {
      BIOENERGY: totals.BIOENERGY / numCountries,
      HYDROPOWER: totals.HYDROPOWER / numCountries,
      SOLAR: totals.SOLAR / numCountries,
      WIND: totals.WIND / numCountries
    };

    // Update the pie chart
    updatePieChart(averages);
  }
}
    function update(countrySelection){
        // function findFunction(country){
        //     console.log("country")
        //     console.log(country)
        //     return true
        // }
        nodeList = svg.selectAll("path")._groups[0]
        
        nodeList.forEach(country => {
            if (country.__data__.properties != undefined){
                if (countrySelection.includes(country.__data__.properties.name)){
                    country.__data__.mapSelected = true
                    d3.select(country).style("stroke", "red").style("stroke-width",3)
                }
                else{
                    country.__data__.mapSelected = false
                    d3.select(country).style("stroke", "black").style("stroke-width",0.3)
                }
            }
          });
        // console.log(user)
    }
    return update;
}

// Usage of the map function
var mapUpdate = map("data/world_rnew.tsv");

// Function to update the bar chart based on selected countries
function updateMap(selectedCountries) {
    // console.log(selectedCountries)
    mapUpdate(selectedCountries);
}
