// *********************************************
// *********** PAGE INITIALIZATION *************
// *********************************************

d3.json("data/samples.json").then(function(data){
    // populate test subject ID and allocate to the drop down selection
    d3.select("#selDataset").selectAll("option")
        .data(data.names)
        .enter()
        .append("option")
        .text( d=> d)
        .attr("value", d => d)
    
    // set default test ID to the first item on the name list
    var selectedValue = data.names[0];
    
    // starting up web page with default selection
    handleSelection(selectedValue);
});


// *********************************************
// ********** CREATE VISUALIZATIONS ************
// *********************************************

function handleSelection(id){
    // data extraction
    d3.json("data/samples.json").then(function(data){
        console.log("Dataset:",data);
        // filter data based on selected ID
        var filteredData = data.samples.filter(sample => sample.id == id)[0]
        

        // **************************************
        // ********* UPDATE BAR CHART ***********
        // **************************************

        // 1. getting data for bar chart
        // 2. use only 10 records
        // 3. sort data ascending based on sample values, since the data in sample value was already sorted, we use reverse function
        var sample_values = filteredData.sample_values.slice(0,10).reverse();
        var otu_ids = filteredData.otu_ids.slice(0,10).reverse();
        var otu_labels = filteredData.otu_labels.slice(0,10).reverse();
        
        trace = {
            x : sample_values,
            y : otu_ids.map(id => `OTU ${id}`),
            text: otu_labels,
            orientation: "h",
            type: "bar",
        };
        layout = {
            autosize:true,
            title:`<b>Top 10 operational axonomic units (OTUs)<b>`,
            xaxis:{fontsize: 1, title: "sample value"}
        }
        Plotly.newPlot("bar", [trace], layout, {responsive: true});


        // **************************************
        // ******** UPDATE BULLET CHART *********
        // **************************************

        // to see how much top OTUS took from the total sample value
        var totalTop10 = sample_values.reduce((a, b) => a + b, 0);
        var totalSampleValue = filteredData.sample_values.reduce((a, b) => a + b, 0);

        // show percentage on bullet chart
        var percentageTop10 = `<b>${Math.floor(totalTop10/totalSampleValue*100)}%</b>`

        var bulletData = [{
              type: "indicator",
              mode: "number+gauge",
              value: totalTop10,
              title: { text: percentageTop10},
              gauge: {
                shape: "bullet",
                axis: { range: [null, totalSampleValue] }
              }
            }];
          
          var layout = {title:`<b>Total sample value - Top 10 OTUs vs ALL</b>`,
                        height: 250
                    };
          
          Plotly.newPlot('bullet', bulletData, layout, {responsive: true});
        

        // ************************************** 
        // ******** UPDATE BUBBLE CHART *********
        // **************************************
        
        // extract data
        sample_values = filteredData.sample_values;
        otu_ids = filteredData.otu_ids;
        otu_labels = filteredData.otu_labels;
        
        var trace1 = {
            x: otu_ids,
            y: sample_values,
            text: otu_labels,
            mode: 'markers',
            marker: {
              // set red and blue color coresponding to the OTU id
              color: otu_ids.map(d => `rgb(${Math.floor(d/Math.max(...otu_ids)*255)},
                                            100,
                                            ${255-Math.floor(d/Math.max(...otu_ids)*255)})`),
              size: sample_values
            }
        };
          
          var layout = {
                title: `<b> Bubble chart - OTUs' samples </b>`,
                autosize:true,
                showlegend: false,
                xaxis: {title: "OTU ID"},
                yaxis: {title: "sample value",
                        orientation:"h"},
          };
          
          Plotly.newPlot('bubble', [trace1], layout, {responsive: true});
           

        // **************************************
        // ****** UPDATE DEMOGRAPHIC INFO *******
        // **************************************
                
        var testProfile = data.metadata.filter(profile => profile.id == id)[0]; 

        // loop through the matching ID profile to display the demographic info
        var arr = Object.entries(testProfile).map(([key, value]) => `${key}: ${value}`);
        
        // update data
        var demoSection = d3.select("#sample-metadata")
                            .selectAll("h6")
                            .data(arr)
        
            // enter data
            demoSection
                .enter()
                .append("h6")
                .merge(demoSection)
                .text(d=>d)

            // remove extra element if the updated profile is short of information
            demoSection.exit().remove()
            

        // **************************************    
        // *******   UPDATE GAUGE CHART   *******
        // **************************************
        
        var washFreq = testProfile.wfreq;
            
        // create a function to draw needle base on washFreq value
        function gaugeNeedle(wfreq){
                // each wash frequency takes 20 degrees
            var degrees = 180 - wfreq*20,
                radius = .65;
            var radians = degrees * Math.PI / 180;
            var x = radius * Math.cos(radians);
            var y = radius * Math.sin(radians);

            // create path
            var mainPath = 'M -.0 -0.035 L .0 0.035 L ',
                pathX = String(x),
                space = ' ',
                pathY = String(y),
                pathEnd = ' Z';
            var path = mainPath.concat(pathX,space,pathY,pathEnd);
                
                return path;
        }

        // data for drawing needle button, just one point shown on a scatter plot
        var buttonData = { type: 'scatter',
                            x:[0],
                            y:[0],
                            marker: {size: 15, color:'850000'},
                            showlegend: false,
                            name: 'Wash frequency',
                            text: washFreq,
                            hoverinfo: 'text+name'
                        }
        // data for drawing the gauge (an half of a pie chart)
        var pieData = { values: [1,1,1,1,1,1,1,1,1,9],
                            rotation: 90,
                            text: ['8-9', '7-8', '6-7','5-6', '4-5', '3-4', '2-3', '1-2', '0-1'],
                            textinfo: 'text',
                            textposition:'inside',	  
                            marker: {colors:['rgba(14, 127, 0, .5)',
                                            'rgba(34, 130, 12, .5)',
                                            'rgba(54, 149, 24, .5)',
                                            'rgba(110, 154, 36, .5)',
                                            'rgba(170, 170, 48, .5)',
                                            'rgba(190, 190, 60, .5)', 
                                            'rgba(202, 202, 72, .5)',
                                            'rgba(210, 213, 84, .5)', 
                                            'rgba(232, 226, 96, .5)',
                                            'rgba(255, 255, 255, 0)']},
                            hoverinfo: 'text',
                            hole: 0.4,
                            type: 'pie',
                            showlegend: false
                        };
        var data = [buttonData,pieData];

        var layout = {
            autosize:true,
            // draw needle
            shapes:[{
                type: 'path',
                path: gaugeNeedle(washFreq),
                fillcolor: '850000',
                line: {
                    color: '850000'
                }
                }],
            title: '<b>Belly Button Washing Frequency</b> <br> Scrubs per week',
            xaxis: {
                zeroline:false, 
                showticklabels:false,
                showgrid: false, 
                range: [-1, 1]
            },
            yaxis: {
                zeroline:false, 
                showticklabels:false,
                showgrid: false, 
                range: [-1, 1]
            }
        };

        Plotly.newPlot('gauge', data, layout, {responsive: true});
    });
};


