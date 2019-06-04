// Cusom Map JS

// --- config --- //
const TOPO_JSON = "./assets/us-counties.topojson";
const US_COUNTIES = "./assets/us-counties.csv";
const SPECIFIC_STATE_INFO = "./assets/georgiaMarch.csv";
const COLOR_1 = "#002f45";
const COLOR_2 = "#12547a";
const COLOR_3 = "#107dc2";
const COLOR_4 = "#44a4aa";
const COLOR_5 = "#8EC07F";
const COLOR_6 = "#cbcb31";
const COLOR_7 = "#fec122";
const COLOR_8 = "#f6914e";
const COLOR_9 = "#f27446";
const COLOR_10 = "#f05d5d";
// ---   end  --- //

var stateInfo = SPECIFIC_STATE_INFO;

var margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10
}, width = parseInt(d3.select('.viz').style('width'))
    , width = width - margin.left - margin.right
    , mapRatio = 0.5
    , height = width * mapRatio
    , active = d3.select(null);

var svg = d3.select('.viz').append('svg')
    .attr('class', 'center-container viz-svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right);

svg.append('rect')
    .attr('class', 'background center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .on('click', clicked);

var usMapData = null;

Promise.resolve(d3.json(TOPO_JSON))
    .then((us) => {
        usMapData = us;
        ready(us, stateInfo);
    });

var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

var path = d3.geoPath()
    .projection(projection);

var g = svg.append("g")
    .attr('class', 'center-container center-items us-state')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

$('.import-btn').click(function (e) {
    if (e.target.name === 'Default') {
        stateInfo = SPECIFIC_STATE_INFO;
    } else {
        stateInfo = './assets/georgia' + e.target.name + '.csv';
    }
    ready(usMapData, stateInfo);
})

var usCountiesData = null;
var cityData = null;

function ready(us, stateInfo) {
    d3.csv(US_COUNTIES)
        .then((data) => {
            d3.csv(stateInfo).then((citydata) => {
                usCountiesData = data;
                cityData = citydata;
                mainMapDraw(us, cityData, usCountiesData);
                walMartMark();
            });
        });
}

function mainMapDraw(us, cityData, data) {
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .style("fill", function (d) {
            var getCounty = window.lodash.filter(data, function (o) {
                return o.id == d.id;
            });
            var color = "#002F45";
            if (getCounty[0] && getCounty[0].state !== undefined) {
                if (getCounty[0].state === "Georgia") {
                    var getCountyScore = window.lodash.filter(cityData, function (o) {
                        return o.id == getCounty[0].id;
                    });
                    // color = '#' + Math.floor(Math.random() * Math.pow(2, 32) ^ 0xffffff).toString(16).substr(-6);
                    color = colorRange(getCountyScore[0] == undefined ? 0 : getCountyScore[0].CountyScore);
                } else {
                    color = "#002F45";
                }
            } else if (getCounty[0] && getCounty[0].state == undefined) {
                color = "#fec122";
            }
            return color;
        })
        .on("click", clicked)
        .on("mousemove", function (d) {

            var getCity = window.lodash.filter(data, function (o) {
                return o.id == d.id;
            });
            var getGeorgiaCountyScore = window.lodash.filter(cityData, function (o) {
                return o.id == d.id;
            });

            var html = "";
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += "State: " + getCity[0].state;
            html += "<br/>";
            html += "County: " + getCity[0].county;
            if (getGeorgiaCountyScore[0] !== undefined) {
                html += "<br/>";
                html += "CountyScore: " + getGeorgiaCountyScore[0].CountyScore;
            }
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            html += "";
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.viz-svg')[0].getBoundingClientRect().width;
            if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function () {
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });

    g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "state")
        .attr("fill", "none")
        .on("click", clicked)

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", path);
}

function citiesMark(d) {
    $('.city-marked').css("display", "none");
    // $('.county-boundary').css("fill", "#aaa");
    d3.csv(SPECIFIC_STATE_INFO).then((cityData) => {

        var getCity = window.lodash.filter(cityData, function (o) {
            return o.id == d.id;
        });

        g.append("g")
            .attr("id", "cities")
            .selectAll("circle")
            .data(getCity)
            .enter().append("circle")
            .attr("class", "county-boundary city-marked city-marked-" + d.id)
            .attr("cx", function (d) {
                return projection([d.Long, d.Lat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.Long, d.Lat])[1];
            })
            .attr("r", function (d) {
                return Math.sqrt(d.ZipScore * 0.01) * 0.5;
            })
            .style("fill", function (d) {
                color = '#' + Math.floor(Math.random() * Math.pow(2, 32) ^ 0xffffff).toString(16).substr(-6);
                // color = '#000';
                // color = '#aaa';
                // color = colorRange(d.ZipScore);
                return color;
            })
            .style("opacity", 1.0)
            .style("display", "block")
            // .style("stroke", "#aaa")
            .style("stroke-width", 0.1)
            .on("mouseover", function (d) {
                var html = "";
                html += "<div class=\"tooltip_kv\">";
                html += "<span class=\"tooltip_key\">";
                html += "State: " + d.State;
                html += "<br/>";
                html += "County: " + d.County;
                html += "<br/>";
                html += "City: " + d.City;
                html += "<br/>";
                html += "ZipCode: " + d.ZipCode;
                html += "<br/>";
                html += "ZipScore: " + d.ZipScore;
                html += "</span>";
                html += "<span class=\"tooltip_value\">";
                html += "";
                html += "</span>";
                html += "</div>";

                $("#tooltip-container").html(html);
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").show();

                var coordinates = d3.mouse(this);

                var map_width = $('.viz-svg')[0].getBoundingClientRect().width;
                if (d3.event.layerX < map_width / 2) {
                    d3.select("#tooltip-container")
                        .style("top", (d3.event.layerY + 15) + "px")
                        .style("left", (d3.event.layerX + 15) + "px");
                } else {
                    var tooltip_width = $("#tooltip-container").width();
                    d3.select("#tooltip-container")
                        .style("top", (d3.event.layerY + 15) + "px")
                        .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
                }
            })
            .on("mouseout", function () {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            });


        $('.city-marked-' + d.id).css("display", "block");
    });
}

function walMartMark() {
    var marks = [
        {
            long: -84.945630,
            lat: 34.479210
        },
        {
            long: -84.730390,
            lat: 33.935610
        },
        {
            long: -84.415916,
            lat: 33.752935
        }
    ];
    g.append("g")
        .attr("id", "walmart")
        .selectAll(".mark")
        .data(marks)
        .enter()
        .append("image")
        .attr('class', 'mark')
        .attr('width', 3)
        .attr('height', 3)
        .attr("xlink:href", 'https://static.wixstatic.com/media/20c715_dc20b5f240f149678f72c5c7710b817a~mv2.png')
        .attr("transform", function (d) {
            return "translate(" + projection([d.long, d.lat]) + ")";
        });

}

function cityMark() {
    d3.csv("./assets/cities-lived.csv").then((cityData) => {
        svg.selectAll("circle")
            .data(cityData)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("r", function (d) {
                return Math.sqrt(d.years) * 4;
            })
            .style("fill", "rgb(217,91,67)")
            .style("opacity", 0.85)
            .on("mouseover", function (d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.text(d.place)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })

            // fade out tooltip on mouse out               
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });
}

function colorRange(score) {
    var color = "#fff";
    if (0 < score && score <= 60) {
        color = COLOR_1;
    } else if (60 < score && score <= 120) {
        color = COLOR_2;
    }
    else if (120 < score && score <= 180) {
        color = COLOR_3;
    }
    else if (180 < score && score <= 240) {
        color = COLOR_4;
    }
    else if (240 < score && score <= 300) {
        color = COLOR_5;
    }
    else if (300 < score && score <= 360) {
        color = COLOR_6;
    }
    else if (360 < score && score <= 420) {
        color = COLOR_7;
    }
    else if (420 < score && score <= 480) {
        color = COLOR_8;
    }
    else if (480 < score && score <= 540) {
        color = COLOR_9;
    }
    else if (540 < score && score <= 600) {
        color = COLOR_10;
    }

    return color;
}

function colorGeneratorbyMinMax(data) {
    var lowColor = '#44A4AA';
    var highColor = '#F05D5D';
    // var lowColor = '#f9f9f9'
    // var highColor = '#bc2a66'
    var dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].CountyScore))
    }
    var minVal = d3.min(dataArray)
    var maxVal = d3.max(dataArray)
    var ramp = d3.scaleLinear().domain([minVal, maxVal]).range([lowColor, highColor]);

    return ramp;
}

function clicked(d) {
    if (d3.select('.background').node() === this) return reset();

    if (active.node() === this) return reset();

    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .style("fill", "#000")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

    citiesMark(d);

}

function reset() {
    active.classed("active", false);
    active = d3.select(null);
    $('.city-marked').css("display", "none");

    g.transition()
        .delay(100)
        .duration(550)
        .style("stroke-width", "1.5px")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        walMartMark();

    // setTimeout(function () {
    //     mainMapDraw(usMapData, cityData, usCountiesData);
    //     walMartMark();
    // }, 800)
}